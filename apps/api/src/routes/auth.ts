import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  LoginSchema,
  RefreshSchema,
  RegisterSchema,
  type AuthUser,
} from "@barberia/shared";
import type { User } from "@prisma/client";
import { prisma } from "../db.js";
import type { Env } from "../env.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../auth/tokens.js";
import type { AuthGuards } from "../auth/middleware.js";

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

async function issueSession(env: Env, user: User) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(env, user.id, user.role),
    signRefreshToken(env, user.id),
  ]);
  return {
    user: toAuthUser(user),
    tokens: { accessToken, refreshToken },
  };
}

export function authRoutes(env: Env, guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();

    r.post("/register", { schema: { body: RegisterSchema } }, async (req, reply) => {
      const { email, password, name, phone } = req.body;
      const normalizedEmail = email.toLowerCase();

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing?.passwordHash) {
        return reply.status(409).send({
          error: { code: "EMAIL_TAKEN", message: "Ese email ya tiene una cuenta" },
        });
      }

      const passwordHash = await hashPassword(password);

      // Si existe sin password (cuenta creada por reserva sin registro) la reclamamos.
      const user = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: { passwordHash, name, phone: phone ?? existing.phone },
          })
        : await prisma.user.create({
            data: { email: normalizedEmail, passwordHash, name, phone, role: "CLIENT" },
          });

      return reply.status(201).send(await issueSession(env, user));
    });

    r.post("/login", { schema: { body: LoginSchema } }, async (req, reply) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        return reply.status(401).send({
          error: { code: "INVALID_CREDENTIALS", message: "Email o contraseña inválidos" },
        });
      }
      if (!user.isActive) {
        return reply.status(403).send({
          error: { code: "ACCOUNT_DISABLED", message: "Cuenta desactivada" },
        });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      return issueSession(env, user);
    });

    r.post("/refresh", { schema: { body: RefreshSchema } }, async (req, reply) => {
      try {
        const payload = await verifyRefreshToken(env, req.body.refreshToken);
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
          return reply.status(401).send({
            error: { code: "INVALID_TOKEN", message: "Usuario no encontrado" },
          });
        }
        return issueSession(env, user);
      } catch {
        return reply.status(401).send({
          error: { code: "INVALID_TOKEN", message: "Refresh token inválido o expirado" },
        });
      }
    });

    r.get("/me", { preHandler: guards.requireAuth }, async (req, reply) => {
      const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
      if (!user) {
        return reply.status(404).send({
          error: { code: "USER_NOT_FOUND", message: "Usuario no encontrado" },
        });
      }
      return toAuthUser(user);
    });
  };
}
