import { defineRouting } from "next-intl/routing";

/**
 * Config de routing i18n.
 *
 * Locales soportados: en (default), es.
 *
 * localePrefix "as-needed" → la URL del locale default NO lleva prefijo
 * (`/` y `/reservar` son inglés), las demás sí (`/es`, `/es/reservar`).
 * Mejor UX para la audiencia mayoritaria (Orlando FL) sin sacrificar el
 * branding en español para la otra mitad del mercado.
 */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
