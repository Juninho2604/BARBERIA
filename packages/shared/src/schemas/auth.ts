import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20).optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof RefreshSchema>;

/**
 * Roles del sistema.
 *
 *  - OWNER        — dueño/a. Acceso total: staff, servicios, barberos, finanzas, settings.
 *  - MANAGER      — gestiona operación día a día (servicios, barberos, citas) pero no
 *                   maneja staff ni settings críticos. Ve reportes.
 *  - RECEPTIONIST — atiende citas y clientes (crear, modificar, cancelar reservas).
 *                   No edita servicios ni barberos.
 *  - BARBER       — solo ve y gestiona SU agenda + perfil. No ve a los demás.
 *  - CLIENT       — usuario final que reserva citas en la web pública.
 *  - ADMIN        — alias deprecated, mantenido por compat. Se trata como OWNER.
 */
export const RoleSchema = z.enum([
  "OWNER",
  "MANAGER",
  "RECEPTIONIST",
  "BARBER",
  "CLIENT",
  "ADMIN", // alias deprecated → OWNER
]);
export type Role = z.infer<typeof RoleSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: RoleSchema,
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthSessionSchema = z.object({
  user: AuthUserSchema,
  tokens: AuthTokensSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
