import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CreateTimeOffSchema } from "@barberia/shared";
import { prisma } from "../db.js";
import type { AuthGuards } from "../auth/middleware.js";

const BarberIdParam = z.object({ id: z.string().min(1) });
const TimeOffIdParam = z.object({ id: z.string().min(1) });

const ListQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export function timeOffRoutes(guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();

    r.get(
      "/barbers/:id/time-off",
      { schema: { params: BarberIdParam, querystring: ListQuery } },
      async (req) => {
        const { from, to } = req.query;
        return prisma.timeOff.findMany({
          where: {
            barberId: req.params.id,
            ...(from || to
              ? {
                  startsAt: from ? { lt: to ? new Date(to) : undefined } : undefined,
                  endsAt: to ? { gt: from ? new Date(from) : undefined } : undefined,
                }
              : {}),
          },
          orderBy: { startsAt: "asc" },
        });
      },
    );

    r.post(
      "/barbers/:id/time-off",
      {
        preHandler: [guards.requireAuth, guards.requireRole("ADMIN")],
        schema: { params: BarberIdParam, body: CreateTimeOffSchema },
      },
      async (req, reply) => {
        const barber = await prisma.barber.findUnique({ where: { id: req.params.id } });
        if (!barber) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Barbero no encontrado" },
          });
        }
        const created = await prisma.timeOff.create({
          data: {
            barberId: barber.id,
            startsAt: new Date(req.body.startsAt),
            endsAt: new Date(req.body.endsAt),
            reason: req.body.reason,
          },
        });
        return reply.status(201).send(created);
      },
    );

    r.delete(
      "/time-off/:id",
      {
        preHandler: [guards.requireAuth, guards.requireRole("ADMIN")],
        schema: { params: TimeOffIdParam },
      },
      async (req, reply) => {
        try {
          await prisma.timeOff.delete({ where: { id: req.params.id } });
          return reply.status(204).send();
        } catch {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "TimeOff no encontrado" },
          });
        }
      },
    );
  };
}
