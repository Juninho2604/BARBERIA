import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AvailabilityQuerySchema, type AvailabilityResponse } from "@barberia/shared";
import { prisma } from "../db.js";
import type { Env } from "../env.js";
import { computeAvailableSlots } from "../lib/availability.js";
import { endOfDayUtc, startOfDayUtc } from "../lib/timezone.js";

const ParamsSchema = z.object({ id: z.string().min(1) });

export function availabilityRoutes(env: Env): FastifyPluginAsync {
  return async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();

    r.get(
      "/:id/availability",
      { schema: { params: ParamsSchema, querystring: AvailabilityQuerySchema } },
      async (req, reply): Promise<AvailabilityResponse> => {
        const barberId = req.params.id;
        const { serviceId, date } = req.query;

        const [barber, service] = await Promise.all([
          prisma.barber.findUnique({
            where: { id: barberId },
            include: { workingHours: true },
          }),
          prisma.service.findUnique({ where: { id: serviceId } }),
        ]);

        if (!barber || !barber.isActive) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Barbero no encontrado o inactivo" },
          }) as never;
        }
        if (!service || !service.isActive) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Servicio no encontrado o inactivo" },
          }) as never;
        }

        const dayStart = startOfDayUtc(date, env.DEFAULT_TIMEZONE);
        const dayEnd = endOfDayUtc(date, env.DEFAULT_TIMEZONE);

        const [timeOff, appointments] = await Promise.all([
          prisma.timeOff.findMany({
            where: {
              barberId,
              // Cualquier time-off que solape el día
              startsAt: { lt: dayEnd },
              endsAt: { gt: dayStart },
            },
          }),
          prisma.appointment.findMany({
            where: {
              barberId,
              startsAt: { lt: dayEnd },
              endsAt: { gt: dayStart },
              status: { not: "CANCELLED" },
            },
          }),
        ]);

        const slots = computeAvailableSlots({
          env,
          date,
          durationMinutes: service.durationMinutes,
          workingHours: barber.workingHours,
          timeOff,
          appointments,
          now: new Date(),
        });

        return {
          date,
          tz: env.DEFAULT_TIMEZONE,
          durationMinutes: service.durationMinutes,
          slots,
        };
      },
    );
  };
}
