import type { Role } from "@barberia/shared";

/**
 * Matriz de permisos del panel admin. Define qué puede hacer cada rol.
 * Se usa tanto para mostrar/ocultar links en el nav como para gatear
 * acciones individuales en cada página.
 *
 * El backend real debe replicar esta lógica en sus guards (no confiamos
 * del cliente). En modo mock esto vive aquí.
 */
export type Action =
  | "panel.access"        // entra al panel admin
  | "staff.manage"        // ver, invitar, cambiar rol, desactivar staff
  | "services.manage"     // CRUD de servicios
  | "barbers.manage"      // CRUD de barberos + horarios + time-off
  | "appointments.viewAll" // ver TODAS las citas
  | "appointments.viewOwn" // ver sus propias citas (barbero)
  | "appointments.create"  // reservar a mano (recepción)
  | "appointments.cancel"  // cancelar
  | "appointments.changeStatus" // confirmar / completar / no-show
  | "clients.manage"      // ver lista de clientes + notas
  | "reports.view"        // dashboard de ingresos / métricas
  | "settings.manage";    // configuración del local

const MATRIX: Record<Action, Role[]> = {
  "panel.access":             ["OWNER", "MANAGER", "RECEPTIONIST", "BARBER", "ADMIN"],
  "staff.manage":             ["OWNER", "ADMIN"],
  "services.manage":          ["OWNER", "MANAGER", "ADMIN"],
  "barbers.manage":           ["OWNER", "MANAGER", "ADMIN"],
  "appointments.viewAll":     ["OWNER", "MANAGER", "RECEPTIONIST", "ADMIN"],
  "appointments.viewOwn":     ["OWNER", "MANAGER", "RECEPTIONIST", "BARBER", "ADMIN"],
  "appointments.create":      ["OWNER", "MANAGER", "RECEPTIONIST", "ADMIN"],
  "appointments.cancel":      ["OWNER", "MANAGER", "RECEPTIONIST", "BARBER", "ADMIN"],
  "appointments.changeStatus":["OWNER", "MANAGER", "RECEPTIONIST", "BARBER", "ADMIN"],
  "clients.manage":           ["OWNER", "MANAGER", "RECEPTIONIST", "ADMIN"],
  "reports.view":             ["OWNER", "MANAGER", "ADMIN"],
  "settings.manage":          ["OWNER", "ADMIN"],
};

export function can(role: Role | undefined | null, action: Action): boolean {
  if (!role) return false;
  return MATRIX[action].includes(role);
}

/** Etiqueta legible para mostrar en chips/badges. */
export const ROLE_LABEL: Record<Role, string> = {
  OWNER:        "Owner",
  MANAGER:      "Manager",
  RECEPTIONIST: "Recepción",
  BARBER:       "Barbero",
  CLIENT:       "Cliente",
  ADMIN:        "Owner", // alias deprecated
};
