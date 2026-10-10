import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { BookLink } from "@/components/booksy/booksy";
import type { ServiceDto } from "@/lib/types";

/**
 * Servicios — menú editorial flat en 2 columnas (desktop), 1 col mobile.
 *
 * Decisiones de diseño:
 *  - SIN precios ni descripciones: viven en Booksy, donde se reserva.
 *    En landing van solo nombre + duración → compacto.
 *  - Sin grouping por categoría: el catálogo nuevo del cliente tiene
 *    descripciones únicas por servicio (no actúan como categoría).
 *  - Cada item abre la ventana de reserva de Booksy.
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
  const th = await getTranslations("heroes");
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
            <BookLink className="underline-offset-4 hover:underline">
              {t("loadErrorLink")}
            </BookLink>
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
                <BookLink className="bc-svc-item">
                  <span className="bc-svc-item__name">{s.name}</span>
                  <span className="bc-svc-item__meta">
                    {formatDuration(s.durationMinutes, "min")}
                  </span>
                </BookLink>
              </li>
            ))}
          </ul>
        )}

        <p className="bc-services__note" data-reveal>
          {t("complimentary")}
        </p>

        <aside className="bc-heroes" data-reveal aria-label={th("eyebrow")}>
          <div className="bc-heroes__badge">{th("badge")}</div>
          <div className="bc-heroes__body">
            <p className="bc-heroes__eyebrow">{th("eyebrow")}</p>
            <p className="bc-heroes__text">{th("text")}</p>
            <p className="bc-heroes__note">{th("note")}</p>
          </div>
        </aside>

        <div className="bc-services__foot" data-reveal>
          <BookLink className="bc-btn bc-btn--solid">
            {t("footerCta")} <span className="arw">→</span>
          </BookLink>
        </div>
      </div>
    </section>
  );
}
