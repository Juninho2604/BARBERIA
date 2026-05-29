import type { Metadata } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
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
  title: "Brothers Club Barbershop — Reserva tu cita",
  description:
    "Brothers Club: cortes clásicos y modernos. Reserva online en menos de un minuto.",
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
