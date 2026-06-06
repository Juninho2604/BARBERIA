import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Seal } from "./seal";

/**
 * Hero — `min-height: 100svh`, contenido alineado abajo. Foto
 * `portrait.jpg` full-bleed con parallax sutil. Sello giratorio en
 * top-right (oculto en mobile). El protagonista visual es el H1 en
 * Bodoni Moda.
 */
export function Hero() {
  const t = useTranslations("hero");
  return (
    <section id="top" className="bc-hero">
      <div className="bc-hero__bg" data-parallax="0.18">
        <Image
          src="/photos/portrait.jpg"
          alt=""
          fill
          sizes="100vw"
          priority
          className="bc-hero__bg-img"
        />
      </div>

      <div className="bc-hero__seal" data-reveal>
        <Seal />
      </div>

      <div className="bc-hero__inner">
        <p className="bc-eyebrow bc-hero__eyebrow" data-reveal>
          {t("eyebrow")}
        </p>
        <h1 className="bc-display bc-hero__title" data-reveal data-delay="1">
          {t("titleLine1")}
          <br />
          <em>{t("titleLine2")}</em>
        </h1>
        <p className="bc-lead bc-hero__sub" data-reveal data-delay="2">
          {t("sub")}
        </p>
        <div className="bc-hero__cta" data-reveal data-delay="3">
          <Link className="bc-btn bc-btn--solid" href="/reservar">
            {t("bookCta")} <span className="arw">→</span>
          </Link>
          <a className="bc-btn bc-btn--ghost" href="#servicios">
            {t("seeServices")}
          </a>
        </div>
      </div>

      <div className="bc-hero__scroll" aria-hidden="true">
        {t("scroll")} ↓
      </div>
    </section>
  );
}
