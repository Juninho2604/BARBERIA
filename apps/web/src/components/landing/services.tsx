import { api } from "@/lib/api";

/**
 * Servicios — lista editorial numerada (handoff). Cada fila es un `<a>` al
 * flujo de reserva real (`/reservar`). Hover: padding-left aumenta, fondo
 * de `--bone` al 6% crece de 0→100%, "Reservar →" entra desde la izquierda.
 *
 * Datos vienen de la API (mismos que ya muestra el sitio); soft-fail a [].
 * El precio se formatea sin decimales (los del cliente son enteros USD).
 */
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

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export async function Services() {
  const services = await api.listServices().catch(() => []);

  return (
    <section className="bc-section" id="servicios">
      <div className="bc-wrap">
        <header className="bc-services__head">
          <p className="bc-eyebrow" data-reveal>
            Servicios
          </p>
          <h2 className="bc-display" data-reveal data-delay="1">
            Lo que hacemos.
          </h2>
          <p className="bc-lead" data-reveal data-delay="2">
            Precios fijos. Sin sorpresas. Reserva el que necesites.
          </p>
        </header>

        {services.length === 0 ? (
          <p className="bc-lead">
            Estamos preparando el catálogo. Vuelve en un momento.
          </p>
        ) : (
          <div className="bc-svc-list">
            {services.map((s, i) => (
              <a
                key={s.id}
                href="/reservar"
                className="bc-svc"
                data-reveal
                data-delay={Math.min(i % 3, 2) || undefined}
              >
                <span className="bc-svc__no">{pad2(i + 1)}</span>
                <span className="bc-svc__name">{s.name}</span>
                <span className="bc-svc__meta">{formatDuration(s.durationMinutes)}</span>
                <span className="bc-svc__price">{formatPrice(s.priceCents)}</span>
                <span className="bc-svc__go">Reservar →</span>
              </a>
            ))}
          </div>
        )}

        <div className="bc-services__foot" data-reveal>
          <a className="bc-btn bc-btn--solid" href="/reservar">
            Reservar ahora <span className="arw">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
