import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * El Espacio — galería editorial en grid 12-col asimétrico.
 * En móvil (<760px) la galería pasa a stack vertical.
 */
const FIGS = [
  { src: "/photos/workstation.jpg", key: "workstation", class: "bc-fig--a" },
  { src: "/photos/coffee.jpg",      key: "coffee",      class: "bc-fig--b" },
  { src: "/photos/cut-detail.jpg",  key: "cut",         class: "bc-fig--c" },
] as const;

export function Local() {
  const t = useTranslations("local");
  return (
    <section className="bc-section" id="espacio">
      <div className="bc-wrap">
        <div className="bc-espacio__head">
          <div>
            <p className="bc-eyebrow" data-reveal>
              {t("eyebrow")}
            </p>
            <h2 className="bc-display" data-reveal data-delay="1">
              {t("title")}
            </h2>
          </div>
          <p className="bc-lead" data-reveal data-delay="2">
            {t("lead")}
          </p>
        </div>

        <div className="bc-gallery">
          {FIGS.map((f, i) => {
            const title = t(`figs.${f.key}.title`);
            const label = t(`figs.${f.key}.label`);
            return (
              <figure
                key={f.src}
                className={`bc-fig ${f.class}`}
                data-reveal
                data-delay={i > 0 ? String(i) : undefined}
              >
                <Image
                  src={f.src}
                  alt={title}
                  fill
                  sizes="(min-width: 760px) 50vw, 100vw"
                  className="bc-fig__img"
                />
                <figcaption>
                  <span className="bc-fig__t">{title}</span>
                  <span className="bc-fig__n">{label}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
