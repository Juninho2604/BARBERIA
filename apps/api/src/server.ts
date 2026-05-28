import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import { type Env } from "./env.js";
import { healthRoutes } from "./routes/health.js";

export async function buildServer(env: Env) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } }
          : undefined,
    },
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });
  await app.register(sensible);

  await app.register(healthRoutes, { prefix: "/health" });

  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    const statusCode = err.statusCode ?? 500;
    reply.status(statusCode).send({
      error: {
        code: err.code ?? "INTERNAL_ERROR",
        message: statusCode >= 500 ? "Error interno" : err.message,
      },
    });
  });

  return app;
}
