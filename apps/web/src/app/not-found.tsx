import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — No encontrado",
  robots: { index: false, follow: false },
};

/**
 * 404 personalizado. Next 15 convention: archivos `not-found.tsx`
 * sustituyen el 404 default genérico.
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-bg)] px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        — 404 —
      </p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
        No encontramos esa página.
      </h1>
      <p className="mt-4 max-w-md text-[color:var(--color-fg-muted)]">
        Es posible que el enlace esté roto o haya cambiado. Volvé al
        inicio o reserva tu cita directamente.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <a href="/" className="bc-btn bc-btn--solid">
          Inicio <span className="arw">→</span>
        </a>
        <a href="/reservar" className="bc-btn bc-btn--ghost">
          Reservar cita
        </a>
      </div>
    </main>
  );
}
