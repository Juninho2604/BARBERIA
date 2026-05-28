import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Textura atmosférica de fondo — retrato espejo muy desaturado
          + gradiente grafito para que el wordmark y el copy se lean
          impecables sin perder atmósfera. */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/photos/portrait.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-[0.18]"
        />
        <div className="absolute inset-0 bg-[color:var(--color-bg)]/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--color-bg)] via-transparent to-[color:var(--color-bg)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-32 sm:pt-24 sm:pb-40">
        {/* Logo horizontal blanco sobre grafito (versión inverso de la guía).
            Llena el ancho del hero para que respire como wordmark editorial. */}
        <Image
          src="/brand/logo-combinado-inverso.svg"
          alt="Brothers Club Barbershop · since 2026"
          width={1125}
          height={411}
          priority
          className="mx-auto block h-auto w-full max-w-4xl"
        />

        <h1 className="mt-16 max-w-3xl text-balance text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">
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
            href="/reservar"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90"
          >
            Reservar cita
          </a>
          <a
            href="#servicios"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--color-fg)] transition hover:bg-[color:var(--color-surface)]"
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}
