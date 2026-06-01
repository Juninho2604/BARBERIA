"use client";

import { useEffect, useRef } from "react";

/**
 * Hook de comportamiento estándar para modales accesibles:
 *  - Bloquea scroll del body mientras está abierto.
 *  - Cierra con Escape.
 *  - Auto-focus al contenido cuando se abre.
 *
 * Trampa de foco completa (tab cycling) queda fuera del scope — la
 * mayoría de modales del admin tienen pocos elementos focusables y
 * dejar Tab seguir natural es aceptable. Si más adelante hace falta,
 * podemos meter `focus-trap-react` o equivalente.
 */
export function useModal(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    html.setAttribute("data-modal-open", "true");

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    // Auto-focus el contenedor para que SR + teclado entren al modal.
    const t = window.setTimeout(() => {
      ref.current?.focus();
    }, 10);

    return () => {
      html.removeAttribute("data-modal-open");
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return ref;
}
