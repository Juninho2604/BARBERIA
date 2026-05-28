import { api } from "@/lib/api";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDuration(min: number) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const rest = min % 60;
    return rest === 0 ? `${h} h` : `${h} h ${rest} min`;
  }
  return `${min} min`;
}

export async function Services() {
  const services = await api.listServices().catch(() => []);

  return (
    <section
      id="servicios"
      className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
    >
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — Servicios —
        </p>
        <h2 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
          Lo que hacemos.
        </h2>
        <p className="mt-4 max-w-xl text-[color:var(--color-fg-muted)]">
          Precios fijos. Sin sorpresas. Reserva el que necesites.
        </p>

        {services.length === 0 ? (
          <p className="mt-16 text-[color:var(--color-fg-muted)]">
            Estamos preparando el catálogo. Vuelve en un momento.
          </p>
        ) : (
          <ul className="mt-16 divide-y divide-[color:var(--color-border)] border-y border-[color:var(--color-border)]">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-baseline justify-between gap-6 py-6"
              >
                <div>
                  <p className="text-lg font-normal text-[color:var(--color-fg)]">
                    {s.name}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                    {formatPrice(s.priceCents)} · {formatDuration(s.durationMinutes)}
                  </p>
                </div>
                <a
                  href="/reservar"
                  className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                >
                  Reservar
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-16">
          <a
            href="/reservar"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90"
          >
            Reservar ahora
          </a>
        </div>
      </div>
    </section>
  );
}
