import Image from "next/image";

/**
 * CTA band — centrado, full-bleed, foto `cut-detail.jpg` muy desaturada al
 * fondo con viñeta radial. Eyebrow + H2 grande + botón sólido al flujo de
 * reserva real (`/reservar`).
 *
 * El handoff lo llama "id=reservar" para anclas in-page; aquí no lo usamos
 * como ancla porque el botón va a `/reservar` directamente.
 */
export function CTA() {
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
          Sin cuenta necesaria
        </p>
        <h2 className="bc-display" data-reveal data-delay="1">
          ¿Listo?
          <br />
          Reserva tu cita.
        </h2>
        <a
          className="bc-btn bc-btn--solid"
          href="/reservar"
          data-reveal
          data-delay="2"
        >
          Reservar online <span className="arw">→</span>
        </a>
      </div>
    </section>
  );
}
