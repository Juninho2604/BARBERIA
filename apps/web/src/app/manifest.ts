import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business-info";

/**
 * PWA manifest. Permite "Añadir a Inicio" en iOS/Android con icono real
 * (no screenshot) y arranca como aplicación standalone sin barra del
 * navegador.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BUSINESS.name,
    short_name: BUSINESS.shortName,
    description: BUSINESS.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    orientation: "portrait-primary",
    icons: [
      {
        // Next auto-genera /icon a partir de app/icon.tsx → 32×32.
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        // Next auto-genera /apple-icon → 180×180. PWA acepta este tamaño
        // como icono general también.
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["lifestyle", "business"],
    lang: "es",
  };
}
