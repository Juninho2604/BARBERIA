"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "./lang-switcher";

/**
 * Nav fija. Transparente sobre el hero; al pasar `scrollY > 40` añade
 * fondo grafito translúcido + blur + borde inferior (clase `bc-nav--scrolled`).
 *
 * El logo es el SVG combinado-inverso del manual de marca.
 *
 * En móvil (<860px) ocultamos los links de texto (vía CSS) pero el
 * LangSwitcher se queda visible — es una decisión crítica del usuario.
 */
export function Nav() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`bc-nav ${scrolled ? "bc-nav--scrolled" : ""}`}>
      <Link
        href="/#top"
        aria-label="Brothers Club Barbershop"
        className="bc-nav__brand"
      >
        <Image
          src="/brand/logo-combinado-inverso.svg"
          alt="Brothers Club Barbershop"
          width={1125}
          height={411}
          priority
          className="bc-nav__logo h-16 w-auto sm:h-20 md:h-24 lg:h-28"
        />
      </Link>

      <div className="bc-nav__links">
        <a href="#servicios" className="bc-nav__link">
          {t("services")}
        </a>
        <a href="#espacio" className="bc-nav__link">
          {t("space")}
        </a>
        <a href="#visitanos" className="bc-nav__link">
          {t("visit")}
        </a>
        <LangSwitcher />
        <Link href="/reservar" className="bc-btn bc-btn--solid bc-nav__cta">
          {t("book")} <span className="arw">→</span>
        </Link>
      </div>
    </nav>
  );
}
