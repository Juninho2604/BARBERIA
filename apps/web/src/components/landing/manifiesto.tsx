import { useTranslations } from "next-intl";

/**
 * Manifiesto — la historia de origen del Brothers Club (provista por
 * el cliente en junio 2026).
 *
 * Estructura editorial en 5 piezas con ritmo tipográfico distinto para
 * que las ~200 palabras no se lean como pared de texto:
 *   1. Eyebrow tracked uppercase
 *   2. Opening — H2 Bodoni display (hook)
 *   3. Párrafo cuerpo (Hanken)
 *   4. Pull-quote italic Bodoni con accent line vertical (la "misión")
 *   5. Párrafo cuerpo (Hanken)
 *   6. Cierre italic Bodoni centrado, más íntimo
 *
 * El nombre `Manifiesto` se mantiene para no romper imports; el
 * contenido es ahora la historia de origen.
 */
export function Manifiesto() {
  const t = useTranslations("manifesto");
  return (
    <section className="bc-section bc-manifesto bc-story">
      <div className="bc-wrap">
        <p className="bc-eyebrow is-center" data-reveal>
          {t("eyebrow")}
        </p>
        <h2 className="bc-display" data-reveal data-delay="1">
          {t("opening")}
        </h2>
        <div className="bc-story__body">
          <p data-reveal data-delay="2">{t("p1")}</p>
          <blockquote className="bc-story__quote" data-reveal data-delay="2">
            {t("quote")}
          </blockquote>
          <p data-reveal data-delay="3">{t("p2")}</p>
          <p className="bc-story__closing" data-reveal data-delay="3">
            {t("closing")}
          </p>
        </div>
        <div className="bc-rule" data-reveal data-delay="3" />
      </div>
    </section>
  );
}
