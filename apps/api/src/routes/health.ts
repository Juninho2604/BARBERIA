import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get("/ready", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "ready",
        db: "ok",
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      app.log.error({ err }, "DB no disponible en /health/ready");
      return reply.status(503).send({
        error: {
          code: "DB_UNAVAILABLE",
          message: "Base de datos no disponible",
        },
      });
    }
  });
};
