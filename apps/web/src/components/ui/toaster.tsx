"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Wrapper de Sonner con la estética Brothers Club aplicada.
 * Toasts dark, sin border-radius, Hanken Grotesk. Posición top-right en
 * desktop, bottom-center en mobile (default de sonner).
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      duration={4000}
      visibleToasts={4}
      closeButton
      richColors={false}
      toastOptions={{
        style: {
          background: "var(--color-surface)",
          color: "var(--color-fg)",
          border: "1px solid var(--color-line)",
          borderRadius: 0,
          fontFamily: "var(--font-sans)",
          fontSize: "0.82rem",
        },
        classNames: {
          title: "tracking-tight",
          description: "text-xs text-[color:var(--color-fg-muted)]",
          closeButton: "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]",
        },
      }}
    />
  );
}
