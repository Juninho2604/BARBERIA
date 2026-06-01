import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@prisma/client";
import { can, type Action } from "@barberia/shared";
import { verifyAccessToken } from "./tokens.js";
import type { Env } from "../env.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: {
      userId: string;
      role: Role;
    };
  }
}

export function makeAuthGuards(env: Env) {
  async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: { code: "UNAUTHORIZED", message: "Token requerido" },
      });
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      const payload = await verifyAccessToken(env, token);
      req.auth = { userId: payload.sub, role: payload.role };
    } catch {
      return reply.status(401).send({
        error: { code: "INVALID_TOKEN", message: "Token inválido o expirado" },
      });
    }
  }

  /**
   * Guard básico por whitelist de roles. Útil para casos donde necesitas
   * varios roles explícitos sin una acción definida (legado).
   * Para nuevas rutas: preferir `requireAction(action)`.
   */
  function requireRole(...allowed: Role[]) {
    return async function (req: FastifyRequest, reply: FastifyReply) {
      if (!req.auth) {
        return reply.status(401).send({
          error: { code: "UNAUTHORIZED", message: "Token requerido" },
        });
      }
      if (!allowed.includes(req.auth.role)) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: "Permisos insuficientes" },
        });
      }
    };
  }

  /**
   * Guard por acción — consume la matriz compartida `@barberia/shared`.
   * Ejemplos:
   *   r.get("/", { preHandler: [auth, guards.requireAction("clients.manage")] }, ...)
   *   r.post("/", { preHandler: [auth, guards.requireAction("services.manage")] }, ...)
   */
  function requireAction(action: Action) {
    return async function (req: FastifyRequest, reply: FastifyReply) {
      if (!req.auth) {
        return reply.status(401).send({
          error: { code: "UNAUTHORIZED", message: "Token requerido" },
        });
      }
      if (!can(req.auth.role, action)) {
        return reply.status(403).send({
          error: { code: "FORBIDDEN", message: `Permiso ${action} requerido` },
        });
      }
    };
  }

  return { requireAuth, requireRole, requireAction };
}

export type AuthGuards = ReturnType<typeof makeAuthGuards>;
