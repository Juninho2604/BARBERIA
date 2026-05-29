import type { Role } from "@prisma/client";

/**
 * Matriz de permisos del backend — réplica autoritativa de
 * `apps/web/src/lib/permissions.ts`. El cliente usa su copia para mostrar /
 * ocultar UI; este es el guard real: nunca confiamos del cliente.
 *
 * Si cambias una fila aquí, cámbiala también en el frontend (y viceversa)
 * para que la UI no ofrezca acciones que el backend va a rechazar.
 */
export type Action =
  | "panel.access"          // entra al panel admin
  | "staff.manage"          // ver, invitar, cambiar rol, desactivar staff
  | "services.manage"       // CRUD de servicios
  | "barbers.manage"        // CRUD de barberos + horarios + time-off
  | "appointments.viewAll"  // ver TODAS las citas
  | "appointments.viewOwn"  // ver sus propias citas (barbero)
  | "appointments.create"   // reservar a mano (recepción)
  | "appointments.cancel"   // cancelar
  | "appointments.changeStatus" // confirmar / completar / no-show
  | "clients.manage"        // ver lista de clientes + notas
  | "reports.view"          // dashboard de ingresos / métricas
  | "settings.manage";      // configuración del local

const MATRIX: Record<Action, Role[]> = {
  "panel.access":              ["OWNER", "MANAGER", "RECEPTIONIST", "BARBER", "ADMIN"],
  "staff.manage":              ["OWNER", "ADMIN"],
  "services.manage":           ["OWNER", "MANAGER", "ADMIN"],
  "barbers.manage":            ["OWNER", "MANAGER", "ADMIN"],
  "appointments.viewAll":      ["OWNER", "MANAGER", "RECEPTIONIST", "ADMIN"],
  "appointments.viewOwn":      ["OWNER", "MANAGER", "RECEPTIONIST", "BARBER", "ADMIN"],
  "appointments.create":       ["OWNER", "MANAGER", "RECEPTIONIST", "ADMIN"],
  "appointments.cancel":       ["OWNER", "MANAGER", "RECEPTIONIST", "BARBER", "ADMIN"],
  "appointments.changeStatus": ["OWNER", "MANAGER", "RECEPTIONIST", "BARBER", "ADMIN"],
  "clients.manage":            ["OWNER", "MANAGER", "RECEPTIONIST", "ADMIN"],
  "reports.view":              ["OWNER", "MANAGER", "ADMIN"],
  "settings.manage":           ["OWNER", "ADMIN"],
};

export function can(role: Role | undefined | null, action: Action): boolean {
  if (!role) return false;
  return MATRIX[action].includes(role);
}
