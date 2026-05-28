import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import {
  serializerCompiler,
  validatorCompiler,
  hasZodFastifySchemaValidationErrors,
} from "fastify-type-provider-zod";
import { type Env } from "./env.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { servicesRoutes } from "./routes/services.js";
import { barbersRoutes } from "./routes/barbers.js";
import { makeAuthGuards } from "./auth/middleware.js";

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

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });
  await app.register(sensible);

  const guards = makeAuthGuards(env);

  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(authRoutes(env, guards), { prefix: "/auth" });
  await app.register(servicesRoutes(guards), { prefix: "/services" });
  await app.register(barbersRoutes(guards), { prefix: "/barbers" });

  app.setErrorHandler((err: FastifyError, _req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Datos inválidos",
          details: err.validation,
        },
      });
    }
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
