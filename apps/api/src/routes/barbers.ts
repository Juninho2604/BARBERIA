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
        schema: { params: IdParam },
      },
      async (req, reply) => {
        try {
          await prisma.barber.update({
            where: { id: req.params.id },
            data: { isActive: false },
          });
          return reply.status(204).send();
        } catch {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Barbero no encontrado" },
          });
        }
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
