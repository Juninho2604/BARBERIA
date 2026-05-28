import type { Metadata } from "next";
import { Inter, Jost, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Jost — tipografía oficial de Brothers Club.
// Display 500 (BROTHERS) y Light 300 (CLUB / SINCE 2026).
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brothers Club Barbershop — Reserva tu cita",
  description:
    "Brothers Club: cortes clásicos y modernos. Reserva online en menos de un minuto.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
