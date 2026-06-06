import { useTranslations } from "next-intl";

/**
 * Manifiesto — sección centrada con eyebrow, H2 grande y párrafo lead.
 * Línea vertical decorativa al final. Sin foto.
 */
export function Manifiesto() {
  const t = useTranslations("manifesto");
  return (
    <section className="bc-section bc-manifesto">
      <div className="bc-wrap">
        <p className="bc-eyebrow is-center" data-reveal>
          {t("eyebrow")}
        </p>
        <h2 className="bc-display" data-reveal data-delay="1">
          {t("title")}
        </h2>
        <p data-reveal data-delay="2">
          {t("body")}
        </p>
        <div className="bc-rule" data-reveal data-delay="2" />
      </div>
    </section>
  );
}
