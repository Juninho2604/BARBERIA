"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useModal } from "@/lib/use-modal";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Acción destructiva (ej. cancelar cita, desactivar staff). Cambia el
   *  estilo del botón de confirmar para advertir. */
  destructive?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

const ConfirmCtx = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

/**
 * Reemplazo accesible del `window.confirm()` nativo. Mantiene la estética
 * editorial Brothers Club, soporta teclado (Escape cancela, Enter
 * confirma), aria-modal, focus trap básico.
 *
 * Uso:
 *   const confirm = useConfirm();
 *   const ok = await confirm({ title: "¿Cancelar cita?", destructive: true });
 *   if (ok) { ... }
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...opts, resolve });
      }),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {pending && <ConfirmDialog pending={pending} onClose={close} />}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const fn = useContext(ConfirmCtx);
  if (!fn) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return fn;
}

function ConfirmDialog({
  pending,
  onClose,
}: {
  pending: PendingConfirm;
  onClose: (ok: boolean) => void;
}) {
  const ref = useModal(true, () => onClose(false));
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  // Auto-focus el botón Cancelar por defecto (más seguro que Confirmar).
  useEffect(() => {
    const t = window.setTimeout(() => {
      ref.current?.focus();
    }, 10);
    return () => window.clearTimeout(t);
  }, [ref]);

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmBtnRef.current?.click();
      }
    },
    [],
  );

  return (
    <div
      className="bc-modal-backdrop is-center"
      onClick={() => onClose(false)}
      role="presentation"
    >
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={pending.description ? "confirm-desc" : undefined}
        tabIndex={-1}
        onKeyDown={onKey}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 outline-none"
      >
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — Confirmar —
        </p>
        <h2 id="confirm-title" className="mt-4 text-2xl font-light tracking-tight">
          {pending.title}
        </h2>
        {pending.description && (
          <p id="confirm-desc" className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
            {pending.description}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
          >
            {pending.cancelLabel ?? "Cancelar"}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onClose(true)}
            className={`rounded-[var(--radius-md)] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] transition ${
              pending.destructive
                ? "border border-[color:var(--color-fg)] bg-transparent text-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)] hover:text-[color:var(--color-bg)]"
                : "bg-[color:var(--color-fg)] text-[color:var(--color-bg)] hover:opacity-90"
            }`}
          >
            {pending.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
