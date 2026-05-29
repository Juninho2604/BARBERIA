import { z } from "zod";
import { RoleSchema } from "./auth.js";

/**
 * Miembro del staff — quien puede entrar al panel admin con un rol asignado.
 * Es proyección de `User` con rol != CLIENT + meta de gestión.
 */
export const StaffMemberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().nullable(),
  role: RoleSchema,
  isActive: z.boolean(),
  /** Si el rol es BARBER, referencia al perfil de barber. */
  barberId: z.string().nullable(),
  createdAt: z.string(),
  lastLoginAt: z.string().nullable(),
});
export type StaffMember = z.infer<typeof StaffMemberSchema>;

/**
 * Invita un nuevo miembro al staff. En backend real esto manda un email con
 * link para fijar contraseña; en mock se crea directo. El rol CLIENT no se
 * acepta aquí (no es staff).
 */
export const InviteStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  role: z.enum(["OWNER", "MANAGER", "RECEPTIONIST", "BARBER"]),
  /** Opcional: vincular a un Barber existente (si el rol es BARBER). */
  barberId: z.string().nullable().optional(),
});
export type InviteStaffInput = z.infer<typeof InviteStaffSchema>;

export const UpdateStaffSchema = z.object({
  role: z.enum(["OWNER", "MANAGER", "RECEPTIONIST", "BARBER"]).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(6).max(20).nullable().optional(),
});
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
