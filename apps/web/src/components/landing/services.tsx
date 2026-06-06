import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Link } from "@/i18n/navigation";
import type { ServiceDto } from "@/lib/types";

/**
 * Servicios — menú editorial AGRUPADO POR CATEGORÍA.
 *
 * Decisiones de diseño (post feedback cliente):
 *  - SIN precios en la landing (los precios viven en el flujo de reserva).
 *  - Agrupado por `service.description` que actúa como categoría
 *    (Signature treatment / Hair & beard / Spa & skin / Wax).
 *  - 2 columnas en desktop, 1 en mobile — compacto, no hace la página
 *    excesivamente larga.
 *  - Cada item linkea a /reservar (locale-aware via @/i18n/navigation).
 */
function formatDuration(min: number, label: string) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const rest = min % 60;
    return rest === 0 ? `${h} h` : `${h} h ${rest} ${label}`;
  }
  return `${min} ${label}`;
}

// El description del seed termina en "." — lo normalizamos antes de matchear.
const CATEGORY_KEY: Record<string, string> = {
  "Signature treatment": "signatureTreatment",
  "Hair & beard": "hairAndBeard",
  "Spa & skin boosters": "spaSkin",
  "Wax services": "wax",
};

function categorize(services: ServiceDto[]): Array<{ key: string; raw: string; items: ServiceDto[] }> {
  const map = new Map<string, { key: string; raw: string; items: ServiceDto[] }>();
  // Orden estable: respeta el primer item de cada categoría que aparece.
  for (const s of services) {
    const raw = (s.description ?? "").replace(/\.$/, "").trim();
    const key = CATEGORY_KEY[raw] ?? "other";
    if (!map.has(raw || "other")) {
      map.set(raw || "other", { key, raw, items: [] });
    }
    map.get(raw || "other")!.items.push(s);
  }
  return Array.from(map.values());
}

export async function Services() {
  const t = await getTranslations("services");
  const tCats = await getTranslations("services.categories");
  let services: ServiceDto[] = [];
  let loadError = false;
  try {
    services = await api.listServices();
  } catch {
    loadError = true;
  }

  const groups = categorize(services);

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
        ) : groups.length === 0 ? (
          <p className="bc-lead">{t("empty")}</p>
        ) : (
          <div className="bc-svc-grid">
            {groups.map((g, gi) => {
              const label = g.key === "other" && g.raw ? g.raw : tCats(g.key);
              return (
                <div
                  key={g.raw || g.key}
                  className="bc-svc-group"
                  data-reveal
                  data-delay={Math.min(gi, 2) || undefined}
                >
                  <p className="bc-svc-group__title">{label}</p>
                  <ul className="bc-svc-group__list">
                    {g.items.map((s) => (
                      <li key={s.id}>
                        <Link href="/reservar" className="bc-svc-item">
                          <span className="bc-svc-item__name">{s.name}</span>
                          <span className="bc-svc-item__meta">
                            {formatDuration(s.durationMinutes, "min")}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
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
