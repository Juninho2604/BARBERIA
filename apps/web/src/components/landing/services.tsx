import { api } from "@/lib/api";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function Services() {
  const services = await api.listServices().catch(() => []);

  return (
    <section
      id="servicios"
      className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
          Servicios
        </h2>
        <p className="mt-3 max-w-xl text-[color:var(--color-fg-muted)]">
          Precios fijos. Sin sorpresas. Reserva el que necesites.
        </p>

        {services.length === 0 ? (
          <p className="mt-12 text-[color:var(--color-fg-muted)]">
            Estamos preparando el catálogo. Vuelve en un momento.
          </p>
        ) : (
          <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--color-border)] sm:grid-cols-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-baseline justify-between bg-[color:var(--color-surface-muted)] p-6"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                    {s.durationMinutes} min
                  </p>
                </div>
                <p className="font-[family-name:var(--font-display)] text-xl text-[color:var(--color-accent)]">
                  {formatPrice(s.priceCents)}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12">
          <a
            href="/reservar"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-accent)] px-6 py-3 font-medium text-[color:var(--color-accent-fg)] transition hover:brightness-110"
          >
            Reservar ahora
          </a>
        </div>
      </div>
    </section>
  );
}
