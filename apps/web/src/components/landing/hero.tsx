import Image from "next/image";
import { Seal } from "./seal";

/**
 * Hero — `min-height: 100svh`, contenido alineado abajo. Foto
 * `portrait.jpg` (barbero + cliente en espejo) full-bleed con parallax
 * sutil (controlado por `LandingEffects` vía `[data-parallax]`).
 *
 * El sello giratorio (NUEVO elemento decorativo) va arriba-derecha y se
 * oculta en móvil. El logo SVG vive en el nav, no en el hero — aquí el
 * protagonista visual es el H1 "Tu corte, a tu hora." en Bodoni Moda.
 */
export function Hero() {
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
          Barbershop · Est. 2026
        </p>
        <h1 className="bc-display bc-hero__title" data-reveal data-delay="1">
          Tu corte,
          <br />
          <em>a tu hora.</em>
        </h1>
        <p className="bc-lead bc-hero__sub" data-reveal data-delay="2">
          Reserva online en menos de un minuto. Elige barbero, servicio y la
          hora que te encaje. Sin llamadas, sin esperas.
        </p>
        <div className="bc-hero__cta" data-reveal data-delay="3">
          <a className="bc-btn bc-btn--solid" href="/reservar">
            Reservar cita <span className="arw">→</span>
          </a>
          <a className="bc-btn bc-btn--ghost" href="#servicios">
            Ver servicios
          </a>
        </div>
      </div>

      <div className="bc-hero__scroll" aria-hidden="true">
        Scroll ↓
      </div>
    </section>
  );
}
