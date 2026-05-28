// Placeholder: estos servicios saldrán del API en M3/M6. Por ahora son demo.
const demoServices = [
  { name: "Corte clásico", duration: 30, priceCents: 1500 },
  { name: "Corte + barba", duration: 45, priceCents: 2200 },
  { name: "Arreglo de barba", duration: 20, priceCents: 1000 },
  { name: "Afeitado tradicional", duration: 40, priceCents: 1800 },
];

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function Services() {
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

        <ul className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-lg)] bg-[color:var(--color-border)] sm:grid-cols-2">
          {demoServices.map((s) => (
            <li
              key={s.name}
              className="flex items-baseline justify-between bg-[color:var(--color-surface-muted)] p-6"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                  {s.duration} min
                </p>
              </div>
              <p className="font-[family-name:var(--font-display)] text-xl text-[color:var(--color-accent)]">
                {formatPrice(s.priceCents)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
