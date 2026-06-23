import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  CreateBarberSchema,
  SetWorkingHoursSchema,
  UpdateBarberSchema,
  type Barber as BarberDto,
} from "@barberia/shared";
import { prisma } from "../db.js";
import type { AuthGuards } from "../auth/middleware.js";

const IdParam = z.object({ id: z.string().min(1) });

type BarberWithUser = Awaited<ReturnType<typeof loadBarber>>;

async function loadBarber(id: string) {
  return prisma.barber.findUnique({
    where: { id },
    include: { user: true, workingHours: { orderBy: [{ weekday: "asc" }, { startMin: "asc" }] } },
  });
}

function toDto(b: NonNullable<BarberWithUser>): BarberDto {
  return {
    id: b.id,
    userId: b.userId,
    name: b.user.name,
    email: b.user.email,
    phone: b.user.phone,
    bio: b.bio,
    photoUrl: b.photoUrl,
    isActive: b.isActive,
    workingHours: b.workingHours.map((w) => ({
      id: w.id,
      barberId: w.barberId,
      weekday: w.weekday,
      startMin: w.startMin,
      endMin: w.endMin,
    })),
  };
}

export function barbersRoutes(guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();

    r.get(
      "/",
      {
        schema: {
          querystring: z.object({
            includeInactive: z.coerce.boolean().optional().default(false),
          }),
        },
      },
      async (req) => {
        const barbers = await prisma.barber.findMany({
          where: req.query.includeInactive ? undefined : { isActive: true },
          include: {
            user: true,
            workingHours: { orderBy: [{ weekday: "asc" }, { startMin: "asc" }] },
          },
          orderBy: { user: { name: "asc" } },
        });
        return barbers.map(toDto);
      },
    );

    r.get("/:id", { schema: { params: IdParam } }, async (req, reply) => {
      const barber = await loadBarber(req.params.id);
      if (!barber) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Barbero no encontrado" },
        });
      }
      return toDto(barber);
    });

    r.post(
      "/",
      {
        preHandler: [guards.requireAuth, guards.requireAction("barbers.manage")],
        schema: { body: CreateBarberSchema },
      },
      async (req, reply) => {
        const { email, name, phone, bio, photoUrl, workingHours } = req.body;
        const normalizedEmail = email.toLowerCase();

        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
          return reply.status(409).send({
            error: {
              code: "EMAIL_TAKEN",
              message: "Ya existe un usuario con ese email",
            },
          });
        }

        const created = await prisma.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              email: normalizedEmail,
              name,
              phone,
              role: "BARBER",
              // passwordHash null: el barbero puede reclamar la cuenta luego con /auth/register.
            },
          });
          const barber = await tx.barber.create({
            data: {
              userId: user.id,
              bio,
              photoUrl,
              workingHours: workingHours?.length
                ? { create: workingHours }
                : undefined,
            },
          });
          return barber.id;
        });

        const fresh = await loadBarber(created);
        return reply.status(201).send(toDto(fresh!));
      },
    );

    r.put(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireAction("barbers.manage")],
        schema: { params: IdParam, body: UpdateBarberSchema },
      },
      async (req, reply) => {
        const barber = await prisma.barber.findUnique({ where: { id: req.params.id } });
        if (!barber) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Barbero no encontrado" },
          });
        }

        const { name, phone, bio, photoUrl, isActive } = req.body;
        await prisma.$transaction(async (tx) => {
          if (name !== undefined || phone !== undefined) {
            await tx.user.update({
              where: { id: barber.userId },
              data: {
                ...(name !== undefined ? { name } : {}),
                ...(phone !== undefined ? { phone } : {}),
              },
            });
          }
          if (bio !== undefined || photoUrl !== undefined || isActive !== undefined) {
            await tx.barber.update({
              where: { id: barber.id },
              data: {
                ...(bio !== undefined ? { bio } : {}),
                ...(photoUrl !== undefined ? { photoUrl } : {}),
                ...(isActive !== undefined ? { isActive } : {}),
              },
            });
          }
        });

        const fresh = await loadBarber(req.params.id);
        return toDto(fresh!);
      },
    );

    r.delete(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireAction("barbers.manage")],
        schema: {
          params: IdParam,
          querystring: z.object({
            // purge=true → borrado real (elimina el perfil de Barber, no solo
            // lo desactiva). Útil para limpiar barberos de prueba/duplicados.
            // Sin purge → soft-delete (isActive=false), preserva el historial.
            purge: z.coerce.boolean().optional().default(false),
          }),
        },
      },
      async (req, reply) => {
        const barber = await prisma.barber.findUnique({
          where: { id: req.params.id },
          include: { user: true },
        });
        if (!barber) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Barbero no encontrado" },
          });
        }

        // Soft-delete: solo desactiva, conserva todo.
        if (!req.query.purge) {
          await prisma.barber.update({
            where: { id: barber.id },
            data: { isActive: false },
          });
          return reply.status(204).send();
        }

        // Borrado real. Si tiene citas como barbero no podemos borrar el
        // perfil sin romper el historial (FK Restrict en Appointment.barber).
        const apptCount = await prisma.appointment.count({
          where: { barberId: barber.id },
        });
        if (apptCount > 0) {
          return reply.status(409).send({
            error: {
              code: "BARBER_HAS_APPOINTMENTS",
              message:
                `Este barbero tiene ${apptCount} cita(s) en su historial. ` +
                "Desactívalo en lugar de eliminarlo para no perder el registro.",
            },
          });
        }

        // Sin citas → podemos borrar el perfil de Barber (cascade a
        // workingHours + timeOff). El User se conserva si es OWNER/staff
        // (estos barberos son dueños a la vez); solo se borra el User cuando
        // es un BARBER puro sin citas como cliente (duplicado/seed de prueba).
        const clientApptCount = await prisma.appointment.count({
          where: { clientId: barber.userId },
        });
        const userIsPureBarber =
          barber.user.role === "BARBER" && clientApptCount === 0;

        await prisma.$transaction(async (tx) => {
          if (userIsPureBarber) {
            // onDelete:Cascade en Barber.user → borrar el User arrastra el
            // Barber, sus workingHours y timeOff de una.
            await tx.user.delete({ where: { id: barber.userId } });
          } else {
            // Conservar el User (es owner/staff o tiene citas como cliente);
            // borrar solo el perfil de Barber (cascade workingHours/timeOff).
            await tx.barber.delete({ where: { id: barber.id } });
          }
        });
        return reply.status(204).send();
      },
    );

    r.put(
      "/:id/working-hours",
      {
        preHandler: [guards.requireAuth, guards.requireAction("barbers.manage")],
        schema: { params: IdParam, body: SetWorkingHoursSchema },
      },
      async (req, reply) => {
        const barber = await prisma.barber.findUnique({ where: { id: req.params.id } });
        if (!barber) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Barbero no encontrado" },
          });
        }
        await prisma.$transaction([
          prisma.workingHour.deleteMany({ where: { barberId: barber.id } }),
          prisma.workingHour.createMany({
            data: req.body.workingHours.map((wh) => ({ ...wh, barberId: barber.id })),
          }),
        ]);
        const fresh = await loadBarber(barber.id);
        return toDto(fresh!);
      },
    );
  };
}
