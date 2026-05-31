import { BUSINESS } from "./business-info";

/**
 * Helpers de formato — fuente única. Antes `formatPrice` estaba duplicado
 * en 8 archivos con variantes inconsistentes (toFixed(0) vs toFixed(2)).
 * Las fechas usaban `toLocaleString("es-ES", ...)` con timezone hardcoded
 * en 11 sitios distintos. Esto centraliza ambas cosas.
 */

const LOCALE = "es-ES";

/** Formato monetario simple: $115. Sin centavos por convención (precios enteros USD). */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString(LOCALE, { maximumFractionDigits: 0 })}`;
}

/** "1 h 30 min" / "30 min". */
export function formatDuration(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const rest = min % 60;
    return rest === 0 ? `${h} h` : `${h} h ${rest} min`;
  }
  return `${min} min`;
}

/** Fecha solo (lun 27 may 2026). */
export function formatDate(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: BUSINESS.timezone,
  });
}

/** Fecha con hora (lun 27 may 2026 · 14:30). */
export function formatDateTime(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(LOCALE, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS.timezone,
  });
}

/** Solo la hora (14:30). */
export function formatTime(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS.timezone,
  });
}

/** Día completo legible (lunes 27 de mayo). Para encabezados. */
export function formatDayLabel(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: BUSINESS.timezone,
  });
}

/** Hora-minuto formato HH:MM con leading zero. Para grids del calendario. */
export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
