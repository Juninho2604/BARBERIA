"use client";

import { useEffect } from "react";

/**
 * Error boundary global (Next 15 convention). Captura cualquier throw en
 * server/client components y muestra UI estilizada en lugar de pantalla
 * en blanco con stack trace.
 *
 * Reportar el error a Sentry/PostHog cuando los enchufemos.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: integrar Sentry/PostHog para tracking.
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-bg)] px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        — Error —
      </p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
        Algo no salió bien.
      </h1>
      <p className="mt-4 max-w-md text-[color:var(--color-fg-muted)]">
        Hemos registrado el problema. Intenta de nuevo en un momento o
        vuelve al inicio.
      </p>
      {error.digest && (
        <p className="mt-3 text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
          Ref · {error.digest}
        </p>
      )}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bc-btn bc-btn--solid"
        >
          Reintentar <span className="arw">→</span>
        </button>
        <a href="/" className="bc-btn bc-btn--ghost">
          Volver al inicio
        </a>
      </div>
    </main>
  );
}
