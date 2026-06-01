import type { Role } from "./schemas/auth.js";

/**
 * Matriz de permisos compartida entre web y api. Define qué puede hacer cada
 * rol. Mantener esto en `@barberia/shared` evita drift entre los guards del
 * cliente (que ocultan UI) y los del servidor (que rechazan request).
 *
 * El backend Fastify la consume vía `requireAction(action)` middleware.
 * El frontend Next la usa para filtrar nav, ocultar botones y redirigir.
 *
 * Regla: si añades una acción, también añade el role list correspondiente
 * y el guard server-side donde aplique.
 */
export type Action =
  | "panel.access"               // entra al panel admin
  | "staff.manage"               // ver, invitar, cambiar rol, desactivar staff
  | "services.manage"            // CRUD de servicios
  | "barbers.manage"             // CRUD de barberos + horarios + time-off
  | "appointments.viewAll"       // ver TODAS las citas
  | "appointments.viewOwn"       // ver sus propias citas (barbero)
  | "appointments.create"        // reservar a mano (recepción)
  | "appointments.cancel"        // cancelar
  | "appointments.changeStatus"  // confirmar / completar / no-show
  | "clients.manage"             // ver lista de clientes + notas
  | "reports.view"               // dashboard de ingresos / métricas
  | "settings.manage";           // configuración del local

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

/** Etiquetas legibles para badges/UI. */
export const ROLE_LABEL: Record<Role, string> = {
  OWNER:        "Owner",
  MANAGER:      "Manager",
  RECEPTIONIST: "Recepción",
  BARBER:       "Barbero",
  CLIENT:       "Cliente",
  ADMIN:        "Owner", // legacy alias
};
