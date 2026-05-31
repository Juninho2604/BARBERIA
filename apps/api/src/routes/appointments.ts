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
import { verifyAccessToken } from "../auth/tokens.js";
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

    // POST / — crear reserva. Auth opcional: si no hay token, guest es obligatorio.
    // Rate limit: 10/hora por IP para evitar que un bot reserve todos los
    // slots futuros como denegación de servicio del negocio.
    r.post(
      "/",
      {
        schema: { body: CreateAppointmentSchema },
        config: { rateLimit: { max: 10, timeWindow: "1 hour" } },
      },
      async (req, reply) => {
        const { serviceId, barberId, startsAt, guest, notes } = req.body;

        // Auth opcional: si llega un Bearer válido, lo usamos; si no, seguimos sin.
        const header = req.headers.authorization;
        if (header?.startsWith("Bearer ")) {
          try {
            const payload = await verifyAccessToken(env, header.slice(7).trim());
            req.auth = { userId: payload.sub, role: payload.role };
          } catch {
            // Token presente pero inválido → 401, no procesamos como guest.
            return reply.status(401).send({
              error: { code: "INVALID_TOKEN", message: "Token inválido o expirado" },
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
        // Bound máximo: 90 días en el futuro. Evita basura en DB
        // (cita para año 2099) y refleja una política realista de
        // booking. Mover a settings cuando exista.
        const MAX_DAYS_AHEAD = 90;
        const maxAhead = new Date(now.getTime() + MAX_DAYS_AHEAD * 86400_000);
        if (Number.isNaN(startsAtDate.getTime()) || startsAtDate <= now) {
          return reply.status(400).send({
            error: { code: "INVALID_TIME", message: "startsAt debe ser un instante futuro" },
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

        // Determinar el clientId: sesión o guest.
        let clientId: string;
        if (req.auth) {
          clientId = req.auth.userId;
        } else {
          if (!guest) {
            return reply.status(400).send({
              error: {
                code: "GUEST_REQUIRED",
                message: "Sin sesión, los datos de cliente (guest) son obligatorios",
              },
            });
          }
          const normalizedEmail = guest.email.toLowerCase().trim();
          const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
          if (existing) {
            // Bloqueamos: un usuario anónimo no puede usar el email de
            // un miembro del staff (sería vector para manipular su PII y
            // ensuciar su historial con citas falsas).
            if (existing.role !== "CLIENT") {
              return reply.status(409).send({
                error: {
                  code: "EMAIL_BELONGS_TO_STAFF",
                  message: "Ese email pertenece a un miembro del equipo. Si eres tú, inicia sesión.",
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
                // passwordHash null: se reclama luego con /auth/register.
              },
            });
            clientId = created.id;
          }
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
