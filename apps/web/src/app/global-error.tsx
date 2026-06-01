"use client";

import { useEffect } from "react";

/**
 * Global error — captura errores DENTRO del layout raíz (el `error.tsx`
 * normal no puede atrapar esos). Next 15 lo usa como último recurso.
 *
 * Reemplaza el `<html>` y `<body>` enteros, así que tiene que ser
 * standalone (no hereda layout). Mantenemos estilos inline mínimos
 * para que se vea decente sin depender de Tailwind/globals.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          background: "#0a0a0b",
          color: "#f1ede4",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.72rem",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#989284",
              marginBottom: "1rem",
            }}
          >
            — Error crítico —
          </p>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            La aplicación se detuvo.
          </h1>
          <p
            style={{
              marginTop: "1rem",
              color: "#c3bdb1",
              maxWidth: "32rem",
              marginInline: "auto",
            }}
          >
            Reintenta o vuelve al inicio. Si el problema persiste, escríbenos.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.65rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#989284",
              }}
            >
              Ref · {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: "1em 2em",
              background: "#f1ede4",
              color: "#0a0a0b",
              border: "none",
              fontSize: "0.74rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
