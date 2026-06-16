import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import type { ServiceDto } from "@/lib/types";

/**
 * Servicios — menú editorial flat en 2 columnas (desktop), 1 col mobile.
 *
 * Decisiones de diseño:
 *  - SIN precios en la landing (los precios viven solo en /reservar).
 *    La landing es discovery, no checkout.
 *  - SIN descripciones (también solo en /reservar, donde ayudan a
 *    decidir). En landing van solo nombre + duración → compacto.
 *  - Sin grouping por categoría: el catálogo nuevo del cliente tiene
 *    descripciones únicas por servicio (no actúan como categoría).
 *  - Cada item linkea a /reservar (locale-aware).
 */
function formatDuration(min: number, label: string) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const rest = min % 60;
    return rest === 0 ? `${h} h` : `${h} h ${rest} ${label}`;
  }
  return `${min} ${label}`;
}

export async function Services() {
  const t = await getTranslations("services");
  let services: ServiceDto[] = [];
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
          <ul className="bc-svc-flat">
            {services.map((s, i) => (
              <li
                key={s.id}
                data-reveal
                data-delay={Math.min(i % 4, 3) || undefined}
              >
                <Link href="/reservar" className="bc-svc-item">
                  <span className="bc-svc-item__name">{s.name}</span>
                  <span className="bc-svc-item__meta">
                    {formatDuration(s.durationMinutes, "min")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
