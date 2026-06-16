import { defineRouting } from "next-intl/routing";

/**
 * Config de routing i18n.
 *
 * Locales soportados: en (default), es.
 *
 * localePrefix "as-needed" → la URL del locale default NO lleva prefijo
 * (`/` y `/reservar` son inglés), las demás sí (`/es`, `/es/reservar`).
 *
 * localeDetection: false → el middleware NO mira `Accept-Language`.
 * Decisión del cliente: la entrada por defecto al sitio es inglés sin
 * excepciones (audiencia Orlando FL). El usuario llega a español solo
 * si: (1) clickea el switcher ES (queda guardado en cookie NEXT_LOCALE
 * para siguientes visitas), o (2) entra directo a una URL /es/...
 * Sin esto, un Safari con español prioritario rebotaba siempre a /es.
 */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

