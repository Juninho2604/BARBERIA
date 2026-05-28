import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CreateServiceSchema, UpdateServiceSchema } from "@barberia/shared";
import { prisma } from "../db.js";
import type { AuthGuards } from "../auth/middleware.js";

const IdParam = z.object({ id: z.string().min(1) });

export function servicesRoutes(guards: AuthGuards): FastifyPluginAsync {
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
        return prisma.service.findMany({
          where: req.query.includeInactive ? undefined : { isActive: true },
          orderBy: { name: "asc" },
        });
      },
    );

    r.get("/:id", { schema: { params: IdParam } }, async (req, reply) => {
      const service = await prisma.service.findUnique({ where: { id: req.params.id } });
      if (!service) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Servicio no encontrado" },
        });
      }
      return service;
    });

    r.post(
      "/",
      {
        preHandler: [guards.requireAuth, guards.requireRole("ADMIN")],
        schema: { body: CreateServiceSchema },
      },
      async (req, reply) => {
        const service = await prisma.service.create({ data: req.body });
        return reply.status(201).send(service);
      },
    );

    r.put(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireRole("ADMIN")],
        schema: { params: IdParam, body: UpdateServiceSchema },
      },
      async (req, reply) => {
        try {
          return await prisma.service.update({
            where: { id: req.params.id },
            data: req.body,
          });
        } catch {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Servicio no encontrado" },
          });
        }
      },
    );

    r.delete(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireRole("ADMIN")],
        schema: { params: IdParam },
      },
      async (req, reply) => {
        try {
          // Soft-delete: marcamos como inactivo para no romper appointments existentes.
          await prisma.service.update({
            where: { id: req.params.id },
            data: { isActive: false },
          });
          return reply.status(204).send();
        } catch {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Servicio no encontrado" },
          });
        }
      },
    );
  };
}
