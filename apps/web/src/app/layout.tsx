import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
import { BUSINESS } from "@/lib/business-info";
import "./globals.css";

// Tipografía oficial post-rebrand (design handoff v1).
// Bodoni Moda — serif display de alto contraste (titulares, nombres,
// precios, monograma). Hanken Grotesk — sans neutra (cuerpo, etiquetas,
// botones, nav).
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans-brand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.baseUrl),
  title: {
    default: `${BUSINESS.name} — Reserva tu cita`,
    template: `%s · ${BUSINESS.shortName}`,
  },
  description: BUSINESS.description,
  applicationName: BUSINESS.shortName,
  authors: [{ name: BUSINESS.name }],
  keywords: [
    "barbería",
    "barbershop",
    "brothers club",
    "florida",
    "reserva online",
    "fade",
    "barba",
    "shave",
  ],
  category: "lifestyle",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: BUSINESS.baseUrl,
    siteName: BUSINESS.name,
    title: `${BUSINESS.name} — Reserva tu cita`,
    description: BUSINESS.description,
    // /opengraph-image.tsx genera el 1200×630 con la estética editorial.
    // Next 15 lo detecta automáticamente y añade el meta tag.
  },
  twitter: {
    card: "summary_large_image",
    title: `${BUSINESS.name} — Reserva tu cita`,
    description: BUSINESS.description,
  },
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
  alternates: {
    canonical: "/",
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
    <html lang="es" className={`${bodoni.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  );
}
