import Fastify, { type FastifyError, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";
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
import { availabilityRoutes } from "./routes/availability.js";
import { appointmentsRoutes } from "./routes/appointments.js";
import { timeOffRoutes } from "./routes/timeoff.js";
import { staffRoutes } from "./routes/staff.js";
import { clientsRoutes } from "./routes/clients.js";
import { cspRoutes } from "./routes/csp.js";
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

  // CSP minimal — la API solo responde JSON, así que `default-src 'none'`
  // bloquea cualquier intento de servir scripts/iframes desde la API.
  // Si en algún momento la API renderiza HTML (improbable), revisar.
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    referrerPolicy: { policy: "no-referrer" },
    crossOriginResourcePolicy: { policy: "same-site" },
  });
  await app.register(cors, {
    origin: env.CORS_ORIGINS,
    credentials: true,
  });
  await app.register(sensible);

  // Rate limiting global como red de seguridad. Cada handler crítico
  // (login, register, booking guest) puede sobrescribir con límites más
  // estrictos vía `config: { rateLimit: { ... } }`.
  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
    keyGenerator: (req: FastifyRequest) => {
      // Nginx pisa X-Real-IP con $remote_addr, así que el cliente no puede
      // falsificarlo. X-Forwarded-For NO sirve: Nginx añade al valor que
      // manda el cliente y el primer elemento es controlable por él.
      const realIp = req.headers["x-real-ip"];
      return (typeof realIp === "string" && realIp) || req.ip;
    },
    // El plugin lanza lo que devuelve esto; sin statusCode el error handler
    // lo trataba como 500.
    errorResponseBuilder: (_req, ctx) =>
      Object.assign(new Error(`Demasiadas peticiones, intenta de nuevo en ${ctx.after}`), {
        statusCode: ctx.statusCode,
        code: "RATE_LIMITED",
      }),
  });

  // Debe registrarse ANTES que las rutas: los plugins de rutas heredan el
  // error handler vigente al registrarse; si va después, aplica el de
  // Fastify por defecto, que devuelve el mensaje interno en los 500.
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
    // En 5xx no se exponen mensajes ni códigos internos (p. ej. P2002 de Prisma).
    return reply.status(statusCode).send({
      error:
        statusCode >= 500
          ? { code: "INTERNAL_ERROR", message: "Error interno" }
          : { code: err.code ?? "ERROR", message: err.message },
    });
  });

  const guards = makeAuthGuards(env);

  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(authRoutes(env, guards), { prefix: "/auth" });
  await app.register(servicesRoutes(guards), { prefix: "/services" });
  await app.register(barbersRoutes(guards), { prefix: "/barbers" });
  await app.register(availabilityRoutes(env), { prefix: "/barbers" });
  await app.register(appointmentsRoutes(env, guards), { prefix: "/appointments" });
  await app.register(timeOffRoutes(guards));
  await app.register(staffRoutes(guards), { prefix: "/staff" });
  await app.register(clientsRoutes(guards), { prefix: "/clients" });
  await app.register(cspRoutes, { prefix: "/csp-report" });

  return app;
}
