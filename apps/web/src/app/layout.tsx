import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { BUSINESS } from "@/lib/business-info";
import "./globals.css";

/**
 * Root layout. Provee `<html>` + `<body>` y la metadata canónica.
 *
 * `lang="en"` por default (audiencia mayoritaria Orlando FL). La versión
 * en español vive bajo `/es/...`. Google detecta el contenido en español
 * vía `hreflang` (configurado en `[locale]/layout.tsx`) — no es ideal
 * que `<html lang>` no cambie con la URL, pero Next 15 no permite
 * cambiar el atributo desde un layout anidado sin re-render del root.
 *
 * Las rutas /admin y /login viven fuera del segmento [locale] y heredan
 * directamente este layout — quedan en español sin traducciones.
 */
// Fuentes servidas desde el repo (variables, subset latin, licencia OFL).
// Con next/font/google el build las descargaba de Google en cada deploy y
// fallaba de forma intermitente cuando Google devolvía una URL sin
// extensión (TypeError en el loader de next/font).
const bodoni = localFont({
  src: [
    { path: "../fonts/bodoni-moda-latin.woff2", weight: "400 700", style: "normal" },
    { path: "../fonts/bodoni-moda-italic-latin.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

const hanken = localFont({
  src: "../fonts/hanken-grotesk-latin.woff2",
  weight: "300 700",
  variable: "--font-sans-brand",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.baseUrl),
  title: {
    default: `${BUSINESS.name} — Book your cut`,
    template: `%s · ${BUSINESS.shortName}`,
  },
  description: BUSINESS.description,
  applicationName: BUSINESS.shortName,
  authors: [{ name: BUSINESS.name }],
  keywords: [
    "barbershop",
    "barbería",
    "brothers club",
    "orlando",
    "orlando fl",
    "florida",
    "haircut",
    "fade",
    "shave",
    "beard trim",
    "online booking",
    "reserva online",
  ],
  category: "lifestyle",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // respeta safe-area en iPhone con notch
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodoni.variable} ${hanken.variable}`}>
      <body>
        {/* Skip-to-content (WCAG 2.4.1) — invisible hasta focus. El texto
            es estático aquí porque vive fuera del provider de i18n; en
            español queda "Saltar al contenido" como segunda opción, pero
            como prioridad es accesibilidad, lo dejamos en inglés
            (idioma del root). */}
        <a href="#main-content" className="bc-skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
