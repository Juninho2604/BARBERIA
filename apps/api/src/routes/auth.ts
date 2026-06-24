import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  ChangePasswordSchema,
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

    r.post(
      "/register",
      {
        schema: { body: RegisterSchema },
        // Anti spam: 3 cuentas por IP por hora.
        config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
      },
      async (req, reply) => {
      const { email, password, name, phone } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing?.passwordHash) {
        return reply.status(409).send({
          error: { code: "EMAIL_TAKEN", message: "Ese email ya tiene una cuenta" },
        });
      }

      // CRITICAL: si existe pero NO es CLIENT, alguien intenta reclamar una
      // cuenta staff sin token de invitación. Bloqueamos. Tokens de invite
      // formales irán en M9.4 (cuando enchufemos Resend); por ahora un
      // OWNER comparte la URL fuera de banda y el flow de claim debería
      // ir por un endpoint dedicado, no por /register.
      if (existing && existing.role !== "CLIENT") {
        return reply.status(409).send({
          error: {
            code: "STAFF_CLAIM_REQUIRES_INVITE",
            message: "Esta cuenta es de staff y requiere un token de invitación. Contacta al owner.",
          },
        });
      }

      const passwordHash = await hashPassword(password);

      // Si existe sin password (cuenta creada por reserva sin registro)
      // y es CLIENT, la reclamamos.
      const user = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: { passwordHash, name: name.trim(), phone: phone ?? existing.phone },
          })
        : await prisma.user.create({
            data: {
              email: normalizedEmail,
              passwordHash,
              name: name.trim(),
              phone,
              role: "CLIENT",
            },
          });

      return reply.status(201).send(await issueSession(env, user));
      },
    );

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
      if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
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

    r.post("/refresh", { schema: { body: RefreshSchema } }, async (req, reply) => {
      try {
        const payload = await verifyRefreshToken(env, req.body.refreshToken);
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) {
          return reply.status(401).send({
            error: { code: "INVALID_TOKEN", message: "Usuario no encontrado" },
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
    });

    // POST /logout — invalidación logística + cliente borra localStorage.
    // Una rotación verdadera con tabla RefreshToken queda para v2 (requiere
    // schema change). Hoy registramos el evento (último acceso) para
    // auditoría y devolvemos 204.
    r.post("/logout", { preHandler: guards.requireAuth }, async (req, reply) => {
      await prisma.user
        .update({
          where: { id: req.auth!.userId },
          data: { lastLoginAt: new Date() },
        })
        .catch(() => {
          // Si el user no existe (ya borrado), igual devolvemos 204.
        });
      return reply.status(204).send();
    });

    // POST /change-password — el usuario autenticado cambia su propia
    // contraseña. Exige la contraseña actual (re-auth) para evitar que un
    // token robado/sesión abierta cambie la clave sin conocerla. Cuentas
    // sin passwordHash (creadas por reserva sin registro) no aplican aquí.
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
        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
        return reply.status(204).send();
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
