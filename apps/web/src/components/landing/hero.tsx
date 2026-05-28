export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 sm:pt-32 sm:pb-40">
        <p className="font-[family-name:var(--font-sans)] text-sm uppercase tracking-[0.3em] text-[color:var(--color-accent)]">
          Barbería
        </p>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl leading-[1.05] sm:text-7xl">
          Tu corte,
          <br />
          a tu hora.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-[color:var(--color-fg-muted)]">
          Reserva online en menos de un minuto. Elige barbero, servicio y la
          hora que te encaje. Sin llamadas, sin esperas.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a
            href="#reservar"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-accent)] px-6 py-3 font-medium text-[color:var(--color-accent-fg)] transition hover:brightness-110"
          >
            Reservar cita
          </a>
          <a
            href="#servicios"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-6 py-3 font-medium text-[color:var(--color-fg)] transition hover:bg-[color:var(--color-surface)]"
          >
            Ver servicios
          </a>
        </div>
      </div>

      {/* Glow decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-20%] h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--color-accent)" }}
      />
    </section>
  );
}
