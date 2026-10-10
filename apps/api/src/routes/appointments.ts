import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { Appointment as PrismaAppointment } from "@prisma/client";
import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  can,
  type Appointment as AppointmentDto,
} from "@barberia/shared";
import { prisma } from "../db.js";
import type { AuthGuards } from "../auth/middleware.js";
import type { Env } from "../env.js";

const IdParam = z.object({ id: z.string().min(1) });

const ListQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  barberId: z.string().optional(),
});

type Includes = {
  client: { id: string; name: string; email: string; phone: string | null };
  barber: { id: string; user: { name: string } };
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
  };
};

function toDto(a: PrismaAppointment & Includes): AppointmentDto {
  return {
    id: a.id,
    clientId: a.clientId,
    barberId: a.barberId,
    serviceId: a.serviceId,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    status: a.status,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
    client: {
      name: a.client.name,
      email: a.client.email,
      phone: a.client.phone,
    },
    barber: { id: a.barber.id, name: a.barber.user.name },
    service: {
      id: a.service.id,
      name: a.service.name,
      durationMinutes: a.service.durationMinutes,
      priceCents: a.service.priceCents,
    },
  };
}

const INCLUDE = {
  client: { select: { id: true, name: true, email: true, phone: true } },
  barber: { select: { id: true, user: { select: { name: true } } } },
  service: {
    select: { id: true, name: true, durationMinutes: true, priceCents: true },
  },
} as const;

export function appointmentsRoutes(env: Env, guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();

    // POST / — cita creada por el staff desde el calendario del panel (las
    // reservas públicas se hacen en Booksy). `guest` identifica al cliente:
    // se busca por email o se crea como CLIENT. Un BARBER solo puede
    // crear citas en su propia agenda.
    r.post(
      "/",
      {
        preHandler: guards.requireAuth,
        schema: { body: CreateAppointmentSchema },
        config: { rateLimit: { max: 60, timeWindow: "1 hour" } },
      },
      async (req, reply) => {
        const { serviceId, barberId, startsAt, guest, notes } = req.body;
        const { userId, role } = req.auth!;

        if (!can(role, "appointments.create")) {
          const own =
            role === "BARBER" ? await prisma.barber.findUnique({ where: { userId } }) : null;
          if (own?.id !== barberId) {
            return reply.status(403).send({
              error: { code: "FORBIDDEN", message: "Permiso appointments.create requerido" },
            });
          }
        }

        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service?.isActive) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Servicio no encontrado o inactivo" },
          });
        }
        const barber = await prisma.barber.findUnique({ where: { id: barberId } });
        if (!barber?.isActive) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Barbero no encontrado o inactivo" },
          });
        }

        const startsAtDate = new Date(startsAt);
        const now = new Date();
        // Política de tiempos:
        //  - Bound máximo: 90 días en el futuro. Evita basura en DB
        //    (cita para año 2099). Política mover a settings cuando exista.
        //  - Bound mínimo: hasta 12h hacia atrás, para registrar walk-ins
        //    (cliente que entró sin reserva) y que cuenten en el historial.
        const MAX_DAYS_AHEAD = 90;
        const WALKIN_WINDOW_HOURS = 12;
        const maxAhead = new Date(now.getTime() + MAX_DAYS_AHEAD * 86400_000);
        const minPast = new Date(now.getTime() - WALKIN_WINDOW_HOURS * 3600_000);
        if (Number.isNaN(startsAtDate.getTime()) || startsAtDate <= minPast) {
          return reply.status(400).send({
            error: {
              code: "INVALID_TIME",
              message: `startsAt debe ser dentro de las últimas ${WALKIN_WINDOW_HOURS}h o en el futuro`,
            },
          });
        }
        if (startsAtDate > maxAhead) {
          return reply.status(400).send({
            error: {
              code: "TOO_FAR_AHEAD",
              message: `Solo se acepta reservar con hasta ${MAX_DAYS_AHEAD} días de antelación`,
            },
          });
        }
        const endsAtDate = new Date(startsAtDate.getTime() + service.durationMinutes * 60_000);

        if (!guest) {
          return reply.status(400).send({
            error: {
              code: "GUEST_REQUIRED",
              message: "Los datos del cliente (guest) son obligatorios",
            },
          });
        }
        let clientId: string;
        const normalizedEmail = guest.email.toLowerCase().trim();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
          // Un miembro del staff no figura como cliente de una cita:
          // evita ensuciar su historial y tocar sus datos.
          if (existing.role !== "CLIENT") {
            return reply.status(409).send({
              error: {
                code: "EMAIL_BELONGS_TO_STAFF",
                message: "Ese email pertenece a un miembro del equipo.",
              },
            });
          }
          clientId = existing.id;
          // Si el guest llega con un teléfono y el User no lo tenía, lo guardamos sin tocar nada más.
          if (!existing.phone && guest.phone) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { phone: guest.phone },
            });
          }
        } else {
          const created = await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: guest.name,
              phone: guest.phone,
              role: "CLIENT",
            },
          });
          clientId = created.id;
        }

        // Crear en transacción con re-chequeo de solapamiento + isolation
        // SERIALIZABLE. Doble protección:
        //   1) Re-check dentro de la tx capta solapamientos parciales (citas
        //      que se cruzan en el medio de un slot).
        //   2) Índice único parcial en DB (migration
        //      20260531120000_appointment_unique_active_index) bloquea el
        //      caso de mismo (barberId, startsAt) entre dos tx serializadas.
        try {
          const appointment = await prisma.$transaction(
            async (tx) => {
              const conflict = await tx.appointment.findFirst({
                where: {
                  barberId,
                  status: { not: "CANCELLED" },
                  startsAt: { lt: endsAtDate },
                  endsAt: { gt: startsAtDate },
                },
                select: { id: true },
              });
              if (conflict) {
                throw new Error("SLOT_TAKEN");
              }
              const timeOff = await tx.timeOff.findFirst({
                where: {
                  barberId,
                  startsAt: { lt: endsAtDate },
                  endsAt: { gt: startsAtDate },
                },
                select: { id: true },
              });
              if (timeOff) {
                throw new Error("BARBER_UNAVAILABLE");
              }
              return tx.appointment.create({
                data: {
                  clientId,
                  barberId,
                  serviceId,
                  startsAt: startsAtDate,
                  endsAt: endsAtDate,
                  notes,
                  status: "PENDING",
                },
                include: INCLUDE,
              });
            },
            { isolationLevel: "Serializable" },
          );
          return reply.status(201).send(toDto(appointment));
        } catch (err) {
          // Prisma P2002 = unique constraint violation. Pasa si dos tx
          // serializables compiten por el mismo slot exacto.
          if (
            err &&
            typeof err === "object" &&
            "code" in err &&
            (err as { code?: string }).code === "P2002"
          ) {
            return reply.status(409).send({
              error: { code: "SLOT_TAKEN", message: "Ese horario acaba de ser reservado" },
            });
          }
          if (err instanceof Error && err.message === "SLOT_TAKEN") {
            return reply.status(409).send({
              error: { code: "SLOT_TAKEN", message: "Ese horario acaba de ser reservado" },
            });
          }
          if (err instanceof Error && err.message === "BARBER_UNAVAILABLE") {
            return reply.status(409).send({
              error: { code: "BARBER_UNAVAILABLE", message: "El barbero no está disponible" },
            });
          }
          throw err;
        }
      },
    );

    // GET / — listar. Auth requerida. Filtra por rol.
    r.get(
      "/",
      {
        preHandler: guards.requireAuth,
        schema: { querystring: ListQuery },
      },
      async (req) => {
        const { from, to, status, barberId } = req.query;
        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (from || to) {
          where.startsAt = {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lt: new Date(to) } : {}),
          };
        }

        const { userId, role } = req.auth!;
        if (role === "CLIENT") {
          where.clientId = userId;
        } else if (role === "BARBER") {
          // Un BARBER siempre solo ve sus propias citas, sin importar el
          // filtro `barberId` que mande la query.
          const profile = await prisma.barber.findUnique({ where: { userId } });
          where.barberId = profile?.id ?? "__none__";
        } else if (can(role, "appointments.viewAll")) {
          // OWNER / MANAGER / RECEPTIONIST / ADMIN pueden filtrar opcional.
          if (barberId) where.barberId = barberId;
        } else {
          // Cualquier otro rol sin permiso → vacío.
          where.clientId = "__none__";
        }

        const appointments = await prisma.appointment.findMany({
          where,
          include: INCLUDE,
          orderBy: { startsAt: "asc" },
        });
        return appointments.map(toDto);
      },
    );

    // PATCH /:id/cancel
    r.patch(
      "/:id/cancel",
      { preHandler: guards.requireAuth, schema: { params: IdParam } },
      async (req, reply) => {
        const appointment = await prisma.appointment.findUnique({
          where: { id: req.params.id },
          include: { barber: true },
        });
        if (!appointment) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Cita no encontrada" },
          });
        }
        const { userId, role } = req.auth!;
        const isOwner = appointment.clientId === userId;
        const isAssignedBarber =
          role === "BARBER" && appointment.barber.userId === userId;
        // Roles admin (OWNER/MANAGER/RECEPTIONIST/ADMIN) pueden cancelar
        // cualquier cita. Cliente solo la suya. BARBER solo las suyas.
        const canForce = can(role, "appointments.cancel") && role !== "BARBER" && role !== "CLIENT";
        if (!canForce && !isOwner && !isAssignedBarber) {
          return reply.status(403).send({
            error: { code: "FORBIDDEN", message: "Permisos insuficientes" },
          });
        }
        if (appointment.status === "CANCELLED") {
          return reply.status(409).send({
            error: { code: "ALREADY_CANCELLED", message: "La cita ya está cancelada" },
          });
        }
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "CANCELLED" },
          include: INCLUDE,
        });
        return toDto(updated);
      },
    );

    // PATCH /:id — cambio parcial (estado, notas). Usado por el calendario
    // operativo del admin para confirmar / completar / marcar no-show.
    r.patch(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireAction("appointments.changeStatus")],
        schema: { params: IdParam, body: UpdateAppointmentSchema },
      },
      async (req, reply) => {
        const appointment = await prisma.appointment.findUnique({
          where: { id: req.params.id },
          include: { barber: true },
        });
        if (!appointment) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Cita no encontrada" },
          });
        }
        // BARBER solo puede modificar sus propias citas.
        if (req.auth!.role === "BARBER" && appointment.barber.userId !== req.auth!.userId) {
          return reply.status(403).send({
            error: { code: "FORBIDDEN", message: "No es tu cita" },
          });
        }
        const data: { status?: AppointmentDto["status"]; notes?: string | null } = {};
        if (req.body.status !== undefined) data.status = req.body.status;
        if (req.body.notes !== undefined) data.notes = req.body.notes;
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data,
          include: INCLUDE,
        });
        return toDto(updated);
      },
    );
  };
}
