import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Link } from "@/i18n/navigation";

/**
 * Servicios — lista editorial numerada (handoff). Cada fila es un `<Link>`
 * al flujo de reserva real (locale-aware via @/i18n/navigation).
 *
 * Datos vienen de la API (mismos que el resto del sitio); soft-fail
 * distingue error vs vacío.
 */
function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDuration(min: number, unit: string) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const rest = min % 60;
    return rest === 0 ? `${h} h` : `${h} h ${rest} ${unit}`;
  }
  return `${min} ${unit}`;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export async function Services() {
  const t = await getTranslations("services");
  // Distinguir error vs vacío: el catch silencioso hacía que un backend
  // caído se viera igual que "no hay servicios". Ahora trackeamos el
  // estado explícito.
  let services: Awaited<ReturnType<typeof api.listServices>> = [];
  let loadError = false;
  try {
    services = await api.listServices();
  } catch {
    loadError = true;
  }

  return (
    <section className="bc-section" id="servicios">
      <div className="bc-wrap">
        <header className="bc-services__head">
          <p className="bc-eyebrow" data-reveal>
            {t("eyebrow")}
          </p>
          <h2 className="bc-display" data-reveal data-delay="1">
            {t("title")}
          </h2>
          <p className="bc-lead" data-reveal data-delay="2">
            {t("lead")}
          </p>
        </header>

        {loadError ? (
          <p className="bc-lead">
            {t("loadErrorBefore")}
            <Link href="/reservar" className="underline-offset-4 hover:underline">
              {t("loadErrorLink")}
            </Link>
            {t("loadErrorAfter")}
          </p>
        ) : services.length === 0 ? (
          <p className="bc-lead">{t("empty")}</p>
        ) : (
          <div className="bc-svc-list">
            {services.map((s, i) => (
              <Link
                key={s.id}
                href="/reservar"
                className="bc-svc"
                data-reveal
                data-delay={Math.min(i % 3, 2) || undefined}
              >
                <span className="bc-svc__no">{pad2(i + 1)}</span>
                <span className="bc-svc__name">{s.name}</span>
                <span className="bc-svc__meta">{formatDuration(s.durationMinutes, "min")}</span>
                <span className="bc-svc__price">{formatPrice(s.priceCents)}</span>
                <span className="bc-svc__go">{t("rowCta")}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="bc-services__foot" data-reveal>
          <Link className="bc-btn bc-btn--solid" href="/reservar">
            {t("footerCta")} <span className="arw">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
