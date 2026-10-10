import Image from "next/image";
import { useTranslations } from "next-intl";
import { BookLink } from "@/components/booksy/booksy";

/**
 * CTA band — centrado, full-bleed, foto `cut-detail.jpg` muy desaturada
 * con viñeta radial. Botón sólido al flujo de reserva real.
 */
export function CTA() {
  const t = useTranslations("cta");
  return (
    <section className="bc-cta">
      <div className="bc-cta__bg" data-parallax="0.1">
        <Image
          src="/photos/cut-detail.jpg"
          alt=""
          fill
          sizes="100vw"
          className="bc-cta__bg-img"
        />
      </div>

      <div className="bc-cta__inner">
        <p className="bc-eyebrow is-center" data-reveal>
          {t("eyebrow")}
        </p>
        <h2 className="bc-display" data-reveal data-delay="1">
          {t("titleLine1")}
          <br />
          {t("titleLine2")}
        </h2>
        <BookLink className="bc-btn bc-btn--solid" data-reveal data-delay="2">
          {t("button")} <span className="arw">→</span>
        </BookLink>
      </div>
    </section>
  );
}
