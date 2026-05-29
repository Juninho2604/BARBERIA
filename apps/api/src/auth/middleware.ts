import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@prisma/client";
import { verifyAccessToken } from "./tokens.js";
import { can, type Action } from "./permissions.js";
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
   * Guard por acción — resuelve los roles permitidos contra la matriz de
   * `permissions.ts`. Preferir esto sobre `requireRole` para que añadir un rol
   * a una capacidad sea un cambio en un solo sitio (la matriz), no en cada ruta.
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
          error: { code: "FORBIDDEN", message: "Permisos insuficientes" },
        });
      }
    };
  }

  return { requireAuth, requireRole, requireAction };
}

export type AuthGuards = ReturnType<typeof makeAuthGuards>;
