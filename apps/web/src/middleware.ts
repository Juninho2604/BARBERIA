import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Middleware de detección de locale para next-intl.
 *
 * Estrategia:
 *  - Negotiation por `Accept-Language` cuando no hay cookie → respeta la
 *    preferencia del navegador.
 *  - Cookie `NEXT_LOCALE` persiste la elección manual (cuando el usuario
 *    aprieta el switcher).
 *  - URL sin prefijo → default (en). `/es/...` → spanish.
 *
 * El matcher EXCLUYE rutas que no deben localizarse:
 *  - /admin/** y /login   → panel interno, queda en español
 *  - /api/**              → endpoints del backend (proxy via Nginx)
 *  - assets estáticos     → /_next, archivos con extensión
 *  - metadata files       → /sitemap.xml, /robots.txt, /manifest.webmanifest,
 *                           /icon, /apple-icon, /opengraph-image
 */
export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api|admin|login|_next|_vercel|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|icon|apple-icon|opengraph-image|.*\\..*).*)",
  ],
};
