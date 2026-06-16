import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
};

// `withNextIntl` envuelve la config para inyectar el plugin que resuelve
// `src/i18n/request.ts` y registra los locales en el build.
export default withNextIntl(nextConfig);
