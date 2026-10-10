import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  ChangePasswordSchema,
  LoginSchema,
  RefreshSchema,
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

// Hash de relleno: el login lo compara cuando el email no existe, para
// que la respuesta tarde lo mismo y no revele qué emails tienen cuenta.
const DUMMY_HASH = "$2a$12$ke8k9LBqVX7kgW6/NHMGu..1BzRc5P8zH7qyzj/gpyGxpLbFOWDpG";

async function issueSession(env: Env, user: User) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(env, user.id, user.role, user.tokenVersion),
    signRefreshToken(env, user.id, user.tokenVersion),
  ]);
  return {
    user: toAuthUser(user),
    tokens: { accessToken, refreshToken },
  };
}

export function authRoutes(env: Env, guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();

    // Sin registro público: las reservas se hacen en Booksy y el panel solo
    // lo usa el staff, que se crea desde /admin/staff.

    r.post(
      "/login",
      {
        schema: { body: LoginSchema },
        // Anti brute-force: 8 intentos por IP cada 15 min. bcrypt 12 rounds
        // ralentiza por sí solo, pero esto cierra la puerta.
        config: { rateLimit: { max: 8, timeWindow: "15 minutes" } },
      },
      async (req, reply) => {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user?.passwordHash || !valid) {
        return reply.status(401).send({
          error: { code: "INVALID_CREDENTIALS", message: "Email o contraseña inválidos" },
        });
      }
      // Cuenta desactivada por OWNER → bloqueamos login.
      if (!user.isActive) {
        return reply.status(403).send({
          error: { code: "ACCOUNT_DISABLED", message: "Cuenta desactivada. Contacta al owner." },
        });
      }
      // Trackeo último acceso para auditoría (columna existente desde M9).
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      return issueSession(env, user);
      },
    );

    r.post(
      "/refresh",
      {
        schema: { body: RefreshSchema },
        config: { rateLimit: { max: 30, timeWindow: "15 minutes" } },
      },
      async (req, reply) => {
      try {
        const payload = await verifyRefreshToken(env, req.body.refreshToken);
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || user.tokenVersion !== payload.tv) {
          return reply.status(401).send({
            error: { code: "INVALID_TOKEN", message: "Sesión expirada, vuelve a entrar" },
          });
        }
        if (!user.isActive) {
          return reply.status(403).send({
            error: { code: "ACCOUNT_DISABLED", message: "Cuenta desactivada" },
          });
        }
        return issueSession(env, user);
      } catch {
        return reply.status(401).send({
          error: { code: "INVALID_TOKEN", message: "Refresh token inválido o expirado" },
        });
      }
      },
    );

    // POST /logout — invalida todas las sesiones del usuario (también las
    // de otros dispositivos): sube `tokenVersion`.
    r.post("/logout", { preHandler: guards.requireAuth }, async (req, reply) => {
      await prisma.user
        .update({
          where: { id: req.auth!.userId },
          data: { tokenVersion: { increment: 1 } },
        })
        .catch(() => {
          // Si el user no existe (ya borrado), igual devolvemos 204.
        });
      return reply.status(204).send();
    });

    // POST /change-password — el usuario autenticado cambia su propia
    // contraseña. Exige la contraseña actual (re-auth) para evitar que un
    // token robado/sesión abierta cambie la clave sin conocerla.
    r.post(
      "/change-password",
      {
        preHandler: guards.requireAuth,
        schema: { body: ChangePasswordSchema },
        // Anti brute-force sobre la contraseña actual.
        config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
      },
      async (req, reply) => {
        const { currentPassword, newPassword } = req.body;
        const user = await prisma.user.findUnique({
          where: { id: req.auth!.userId },
        });
        if (!user) {
          return reply.status(404).send({
            error: { code: "USER_NOT_FOUND", message: "Usuario no encontrado" },
          });
        }
        if (!user.isActive) {
          return reply.status(403).send({
            error: { code: "ACCOUNT_DISABLED", message: "Cuenta desactivada" },
          });
        }
        if (!user.passwordHash) {
          return reply.status(409).send({
            error: {
              code: "NO_PASSWORD_SET",
              message: "Esta cuenta aún no tiene contraseña configurada.",
            },
          });
        }
        if (!(await verifyPassword(currentPassword, user.passwordHash))) {
          return reply.status(401).send({
            error: {
              code: "INVALID_CURRENT_PASSWORD",
              message: "La contraseña actual es incorrecta.",
            },
          });
        }
        if (await verifyPassword(newPassword, user.passwordHash)) {
          return reply.status(400).send({
            error: {
              code: "SAME_PASSWORD",
              message: "La nueva contraseña debe ser distinta a la actual.",
            },
          });
        }
        // Sube `tokenVersion` para cerrar cualquier otra sesión abierta (p. ej.
        // un token robado) y devuelve una sesión nueva para este dispositivo.
        const passwordHash = await hashPassword(newPassword);
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash, tokenVersion: { increment: 1 } },
        });
        return issueSession(env, updated);
      },
    );

    r.get("/me", { preHandler: guards.requireAuth }, async (req, reply) => {
      const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
      if (!user) {
        return reply.status(404).send({
          error: { code: "USER_NOT_FOUND", message: "Usuario no encontrado" },
        });
      }
      if (!user.isActive) {
        return reply.status(403).send({
          error: { code: "ACCOUNT_DISABLED", message: "Cuenta desactivada" },
        });
      }
      return toAuthUser(user);
    });
  };
}
