import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import {
  UpdateClientNotesSchema,
  type ClientSummary as ClientSummaryDto,
  type ClientDetail as ClientDetailDto,
} from "@barberia/shared";
import { prisma } from "../db.js";
import type { AuthGuards } from "../auth/middleware.js";

const IdParam = z.object({ id: z.string().min(1) });

const APPOINTMENTS_INCLUDE = {
  appointmentsAsClient: {
    include: {
      service: { select: { name: true, priceCents: true } },
      barber: { select: { user: { select: { name: true } } } },
    },
    orderBy: { startsAt: "asc" },
  },
} satisfies Prisma.UserInclude;

type ClientUser = Prisma.UserGetPayload<{ include: typeof APPOINTMENTS_INCLUDE }>;

/** Métricas agregadas a partir del historial de citas del cliente. */
function summarize(u: ClientUser): ClientSummaryDto {
  const appts = u.appointmentsAsClient;
  let completed = 0;
  let lifetimeCents = 0;
  let firstVisitAt: string | null = null;
  let lastVisitAt: string | null = null;
  for (const a of appts) {
    if (a.status === "COMPLETED") {
      completed += 1;
      lifetimeCents += a.service.priceCents;
    }
    const iso = a.startsAt.toISOString();
    if (!firstVisitAt || iso < firstVisitAt) firstVisitAt = iso;
    if (!lastVisitAt || iso > lastVisitAt) lastVisitAt = iso;
  }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    totalAppointments: appts.length,
    completedAppointments: completed,
    lifetimeCents,
    firstVisitAt,
    lastVisitAt,
    notes: u.notes,
  };
}

export function clientsRoutes(guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();

    // GET / — lista de clientes (usuarios con rol CLIENT) con métricas.
    r.get(
      "/",
      { preHandler: [guards.requireAuth, guards.requireAction("clients.manage")] },
      async () => {
        const users = await prisma.user.findMany({
          where: { role: "CLIENT" },
          include: APPOINTMENTS_INCLUDE,
        });
        return users
          .map(summarize)
          .sort((a, b) => (b.lastVisitAt ?? "").localeCompare(a.lastVisitAt ?? ""));
      },
    );

    // GET /:id — detalle con historial cronológico (más reciente primero).
    r.get(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireAction("clients.manage")],
        schema: { params: IdParam },
      },
      async (req, reply) => {
        const user = await prisma.user.findUnique({
          where: { id: req.params.id },
          include: APPOINTMENTS_INCLUDE,
        });
        if (!user || user.role !== "CLIENT") {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Cliente no encontrado" },
          });
        }
        const detail: ClientDetailDto = {
          ...summarize(user),
          appointments: user.appointmentsAsClient
            .slice()
            .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
            .map((a) => ({
              id: a.id,
              startsAt: a.startsAt.toISOString(),
              endsAt: a.endsAt.toISOString(),
              status: a.status,
              serviceName: a.service.name,
              barberName: a.barber.user.name,
              priceCents: a.service.priceCents,
            })),
        };
        return detail;
      },
    );

    // PATCH /:id/notes — notas internas del staff sobre el cliente.
    r.patch(
      "/:id/notes",
      {
        preHandler: [guards.requireAuth, guards.requireAction("clients.manage")],
        schema: { params: IdParam, body: UpdateClientNotesSchema },
      },
      async (req, reply) => {
        const user = await prisma.user.findUnique({
          where: { id: req.params.id },
          include: APPOINTMENTS_INCLUDE,
        });
        if (!user || user.role !== "CLIENT") {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Cliente no encontrado" },
          });
        }
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { notes: req.body.notes },
          include: APPOINTMENTS_INCLUDE,
        });
        return summarize(updated);
      },
    );
  };
}
