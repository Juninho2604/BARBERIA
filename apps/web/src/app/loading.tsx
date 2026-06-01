/**
 * Loading state global (Next 15 convention) — se muestra mientras un
 * server component está fetcheando. Antes mostrábamos pantalla en blanco;
 * ahora vemos al menos el monograma y un texto claro.
 */
export default function Loading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-bg)] px-6 py-16 text-center"
    >
      <div
        className="flex h-20 w-20 items-center justify-center border border-[color:var(--color-line-2)]"
        style={{ borderRadius: "50%" }}
      >
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          BC
        </span>
      </div>
      <p className="mt-8 text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        Cargando…
      </p>
    </main>
  );
}
