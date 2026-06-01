import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  UpdateClientNotesSchema,
  type ClientDetail,
  type ClientSummary,
} from "@barberia/shared";
import { prisma } from "../db.js";
import type { AuthGuards } from "../auth/middleware.js";

const IdParam = z.object({ id: z.string().min(1) });

interface ClientAggregate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  totalAppointments: number;
  completedAppointments: number;
  lifetimeCents: number;
  firstVisitAt: Date | null;
  lastVisitAt: Date | null;
}

function aggregateToSummary(c: ClientAggregate): ClientSummary {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    totalAppointments: c.totalAppointments,
    completedAppointments: c.completedAppointments,
    lifetimeCents: c.lifetimeCents,
    firstVisitAt: c.firstVisitAt ? c.firstVisitAt.toISOString() : null,
    lastVisitAt: c.lastVisitAt ? c.lastVisitAt.toISOString() : null,
  };
}

async function listClients(): Promise<ClientSummary[]> {
  // Sólo cuentas con rol CLIENT que tienen al menos una cita histórica.
  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      notes: true,
      appointmentsAsClient: {
        select: {
          status: true,
          startsAt: true,
          service: { select: { priceCents: true } },
        },
      },
    },
  });
  const agg: ClientAggregate[] = users
    .filter((u) => u.appointmentsAsClient.length > 0)
    .map((u) => {
      let lifetimeCents = 0;
      let completed = 0;
      let first: Date | null = null;
      let last: Date | null = null;
      for (const a of u.appointmentsAsClient) {
        if (a.status === "COMPLETED") {
          completed += 1;
          lifetimeCents += a.service.priceCents;
        }
        if (!first || a.startsAt < first) first = a.startsAt;
        if (!last || a.startsAt > last) last = a.startsAt;
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        notes: u.notes,
        totalAppointments: u.appointmentsAsClient.length,
        completedAppointments: completed,
        lifetimeCents,
        firstVisitAt: first,
        lastVisitAt: last,
      };
    });
  agg.sort((a, b) => {
    const lb = b.lastVisitAt?.getTime() ?? 0;
    const la = a.lastVisitAt?.getTime() ?? 0;
    return lb - la;
  });
  return agg.map(aggregateToSummary);
}

/**
 * Rutas de gestión de clientes (CRM lite). Acceso: roles con permiso
 * `clients.manage` (OWNER, MANAGER, RECEPTIONIST, ADMIN).
 */
export function clientsRoutes(guards: AuthGuards): FastifyPluginAsync {
  return async (fastify) => {
    const r = fastify.withTypeProvider<ZodTypeProvider>();

    // GET / — lista agregada con métricas.
    r.get(
      "/",
      { preHandler: [guards.requireAuth, guards.requireAction("clients.manage")] },
      async () => listClients(),
    );

    // GET /:id — detalle con historial cronológico.
    r.get(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireAction("clients.manage")],
        schema: { params: IdParam },
      },
      async (req, reply) => {
        const u = await prisma.user.findUnique({
          where: { id: req.params.id },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            notes: true,
            role: true,
            appointmentsAsClient: {
              select: {
                id: true,
                startsAt: true,
                endsAt: true,
                status: true,
                service: { select: { name: true, priceCents: true } },
                barber: { select: { user: { select: { name: true } } } },
              },
              orderBy: { startsAt: "desc" },
            },
          },
        });
        if (!u || u.role !== "CLIENT") {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Cliente no encontrado" },
          });
        }
        let lifetimeCents = 0;
        let completed = 0;
        let first: Date | null = null;
        let last: Date | null = null;
        for (const a of u.appointmentsAsClient) {
          if (a.status === "COMPLETED") {
            completed += 1;
            lifetimeCents += a.service.priceCents;
          }
          if (!first || a.startsAt < first) first = a.startsAt;
          if (!last || a.startsAt > last) last = a.startsAt;
        }
        const detail: ClientDetail = {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          notes: u.notes,
          totalAppointments: u.appointmentsAsClient.length,
          completedAppointments: completed,
          lifetimeCents,
          firstVisitAt: first ? first.toISOString() : null,
          lastVisitAt: last ? last.toISOString() : null,
          appointments: u.appointmentsAsClient.map((a) => ({
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

    // PATCH /:id/notes — actualiza solo las notas internas.
    r.patch(
      "/:id/notes",
      {
        preHandler: [guards.requireAuth, guards.requireAction("clients.manage")],
        schema: { params: IdParam, body: UpdateClientNotesSchema },
      },
      async (req, reply) => {
        const u = await prisma.user.findUnique({
          where: { id: req.params.id },
          select: { id: true, role: true },
        });
        if (!u || u.role !== "CLIENT") {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Cliente no encontrado" },
          });
        }
        await prisma.user.update({
          where: { id: u.id },
          data: { notes: req.body.notes },
        });
        const list = await listClients();
        const summary = list.find((c) => c.id === u.id);
        if (!summary) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Cliente no encontrado" },
          });
        }
        return summary;
      },
    );
  };
}
