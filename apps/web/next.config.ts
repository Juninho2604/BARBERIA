import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const BOOKSY = "https://booksy.com https://*.booksy.com";

// CSP completa en modo report-only: el widget de Booksy no se pudo probar
// contra el real, así que primero se observan las violaciones (llegan a
// /api/csp-report y quedan en los logs del contenedor api) y luego se
// pasa a enforcing. 'unsafe-inline' en script-src es necesario sin nonces
// (Next inyecta scripts inline de hidratación).
function cspReportOnly(extra: { script?: string; connect?: string; frame?: string }) {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${extra.script ?? ""}`.trim(),
    `style-src 'self' 'unsafe-inline' ${extra.script ?? ""}`.trim(),
    "img-src 'self' data: blob: https:",
    `font-src 'self' data: ${extra.script ?? ""}`.trim(),
    `connect-src 'self' blob: data: ${extra.connect ?? ""}`.trim(),
    `frame-src ${extra.frame ?? "'none'"}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "report-uri /api/csp-report",
  ].join("; ");
}

// Lo que se puede aplicar ya sin riesgo de romper Booksy.
const CSP_ENFORCED = "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@barberia/shared"],

  // `standalone` empaqueta el server.js + node_modules realmente usados en
  // `.next/standalone/`. Es lo que copia el Dockerfile a la imagen runner —
  // ~5x más pequeño que copiar el repo entero.
  output: "standalone",

  // En monorepo necesitamos que Next sepa que el root real es 2 niveles
  // arriba (workspace root). Sin esto, el trace de archivos asume el
  // CWD del comando y deja fuera `packages/shared`.
  outputFileTracingRoot: path.join(__dirname, "../.."),

  // Cache de imágenes en /_next/image — 1 año para SVG/JPG en /public
  // (no cambian sin redeploy).
  images: {
    minimumCacheTTL: 31536000,
  },

  async headers() {
    const privateHeaders = [
      { key: "Content-Security-Policy", value: CSP_ENFORCED },
      { key: "Content-Security-Policy-Report-Only", value: cspReportOnly({}) },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Cache-Control", value: "no-store" },
    ];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP_ENFORCED },
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly({ script: BOOKSY, connect: BOOKSY, frame: BOOKSY }),
          },
        ],
      },
      { source: "/admin", headers: privateHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/login", headers: privateHeaders },
    ];
  },
};

// `withNextIntl` envuelve la config para inyectar el plugin que resuelve
// `src/i18n/request.ts` y registra los locales en el build.
export default withNextIntl(nextConfig);
