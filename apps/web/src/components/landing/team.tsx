import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import type { BarberDto } from "@/lib/types";

/**
 * Nuestro equipo — retratos grandes de los barberos, entre la historia
 * (Manifiesto) y el espacio (Local). Solo se muestran los que tienen
 * photoUrl configurado desde /admin; si nadie tiene foto todavía, la
 * sección entera se omite (evita un bloque vacío/roto en producción).
 */
export async function Team() {
  const t = await getTranslations("team");
  let barbers: BarberDto[] = [];
  try {
    barbers = await api.listBarbers();
  } catch {
    return null;
  }

  const withPhoto = barbers.filter((b) => b.photoUrl);
  if (withPhoto.length === 0) return null;

  return (
    <section className="bc-section" id="equipo">
      <div className="bc-wrap">
        <header className="bc-team__head">
          <p className="bc-eyebrow is-center" data-reveal>
            {t("eyebrow")}
          </p>
          <h2 className="bc-display" data-reveal data-delay="1">
            {t("title")}
          </h2>
          <p className="bc-lead" data-reveal data-delay="2">
            {t("lead")}
          </p>
        </header>

        <ul className="bc-team__grid">
          {withPhoto.map((b, i) => (
            <li
              key={b.id}
              className="bc-team__card"
              data-reveal
              data-delay={Math.min(i % 4, 3) || undefined}
            >
              <div className="bc-team__photo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element -- URL dinámica (admin), no un asset local optimizable en build */}
                <img src={b.photoUrl!} alt={b.name} className="bc-team__photo" loading="lazy" />
              </div>
              <p className="bc-team__name">{b.name}</p>
              {b.bio && <p className="bc-team__bio">{b.bio}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
