/**
 * UI primitives compartidas en el panel admin y el flujo de reserva.
 * Antes Field / Stat / Row / Notice se reimplementaban en cada página
 * (~7 archivos), con divergencia leve. Centralizar acá los hace
 * consistentes.
 */
import type { ReactNode } from "react";

/** Wrapper de input con label uppercase tracked, estilo brand. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-2 block text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Card grande con label superior + valor display (KPIs en /admin y /clients).
 *  `size: lg` para los del resumen home (p-8, text-5xl). Default md. */
export function Stat({
  label,
  value,
  size = "md",
}: {
  label: string;
  value: number | string;
  size?: "md" | "lg";
}) {
  const padding = size === "lg" ? "p-8" : "p-6";
  const valueText = size === "lg" ? "text-5xl mt-4" : "text-3xl mt-3";
  const labelText =
    size === "lg"
      ? "text-xs uppercase tracking-[0.22em]"
      : "text-[0.65rem] uppercase tracking-[0.22em]";
  return (
    <div className={`bg-[color:var(--color-bg)] ${padding}`}>
      <p className={`${labelText} text-[color:var(--color-fg-muted)]`}>{label}</p>
      <p className={`${valueText} font-light tracking-tight`}>{value}</p>
    </div>
  );
}

/** Fila label/value de un dl horizontal con border-bottom. */
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[color:var(--color-border)] py-3">
      <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        {label}
      </dt>
      <dd className="text-right text-[color:var(--color-fg)]">{value}</dd>
    </div>
  );
}

/** Banner inline para mensajes de aviso / error en formularios. */
export function Notice({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "error";
  className?: string;
}) {
  const toneStyles =
    tone === "error"
      ? "border-[color:var(--color-fg-muted)] bg-[color:var(--color-bg)] text-[color:var(--color-fg)]"
      : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg-muted)]";
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-[var(--radius-md)] border ${toneStyles} px-4 py-3 text-sm ${className ?? ""}`}
    >
      {children}
    </p>
  );
}
