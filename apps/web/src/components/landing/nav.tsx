"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Nav fija. Transparente sobre el hero; al pasar `scrollY > 40` añade
 * fondo grafito translúcido + blur + borde inferior (clase `bc-nav--scrolled`).
 *
 * Por decisión del cliente, el logo se mantiene igual (SVG combinado-inverso
 * del manual de marca). El handoff mostraba un wordmark tipográfico en este
 * lugar; lo reemplazamos por el SVG oficial.
 *
 * En móvil (<860px) ocultamos los links de texto (vía CSS) y dejamos solo
 * logo + botón Reservar.
 */
export function Nav() {
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
      <a
        href="#top"
        aria-label="Brothers Club Barbershop — inicio"
        className="bc-nav__brand"
      >
        <Image
          src="/brand/logo-combinado-inverso.svg"
          alt="Brothers Club Barbershop"
          width={1125}
          height={411}
          priority
          className="h-7 w-auto sm:h-8"
        />
      </a>

      <div className="bc-nav__links">
        <a href="#servicios" className="bc-nav__link">
          Servicios
        </a>
        <a href="#espacio" className="bc-nav__link">
          El Espacio
        </a>
        <a href="#visitanos" className="bc-nav__link">
          Visítanos
        </a>
        <a href="/reservar" className="bc-btn bc-btn--solid bc-nav__cta">
          Reservar <span className="arw">→</span>
        </a>
      </div>
    </nav>
  );
}
