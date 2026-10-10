import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@prisma/client";
import { can, type Action } from "@barberia/shared";
import { verifyAccessToken } from "./tokens.js";
import { prisma } from "../db.js";
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
  /**
   * Valida el Bearer y lo contrasta con la DB: el rol sale de la DB (no
   * del JWT), y la cuenta debe seguir activa con el mismo `tokenVersion`.
   * Así desactivar, degradar o cambiar la contraseña corta el acceso al
   * instante en vez de esperar a que expire el access token.
   */
  async function resolveAuth(req: FastifyRequest): Promise<"none" | "ok" | "invalid"> {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return "none";
    try {
      const payload = await verifyAccessToken(env, header.slice("Bearer ".length).trim());
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { role: true, isActive: true, tokenVersion: true },
      });
      if (!user?.isActive || user.tokenVersion !== payload.tv) return "invalid";
      req.auth = { userId: payload.sub, role: user.role };
      return "ok";
    } catch {
      return "invalid";
    }
  }

  async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
    const result = await resolveAuth(req);
    if (result === "none") {
      return reply.status(401).send({
        error: { code: "UNAUTHORIZED", message: "Token requerido" },
      });
    }
    if (result === "invalid") {
      return reply.status(401).send({
        error: { code: "INVALID_TOKEN", message: "Token inválido o expirado" },
      });
    }
  }

  /** Rellena `req.auth` si llega un token válido; nunca rechaza. */
  async function optionalAuth(req: FastifyRequest) {
    await resolveAuth(req);
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

  return { requireAuth, optionalAuth, requireRole, requireAction };
}

export type AuthGuards = ReturnType<typeof makeAuthGuards>;
