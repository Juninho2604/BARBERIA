/**
 * Punto único de tokens de diseño para uso en TypeScript.
 *
 * Los valores reales viven como CSS variables en `src/app/globals.css` bajo
 * el bloque `@theme`. Aquí sólo se exponen los **nombres** (referencias
 * `var(--...)`) para que los componentes puedan consumirlos desde JS sin
 * duplicar valores.
 *
 * Para cambiar la paleta o tipografía, edita `globals.css`. Este archivo
 * sólo cambia si añades/quitas un token.
 */

export const tokens = {
  color: {
    bg: "var(--color-bg)",
    surface: "var(--color-surface)",
    surfaceMuted: "var(--color-surface-muted)",
    fg: "var(--color-fg)",
    fgMuted: "var(--color-fg-muted)",
    accent: "var(--color-accent)",
    accentFg: "var(--color-accent-fg)",
    border: "var(--color-border)",
  },
  font: {
    sans: "var(--font-sans)",
    display: "var(--font-display)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
  },
} as const;
