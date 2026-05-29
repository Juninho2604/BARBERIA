import Image from "next/image";

/**
 * Visítanos — sección full-bleed con fondo `storefront.jpg`, parallax sutil
 * (0.12) y doble degradado lateral. Tarjeta a la izquierda con info-grid
 * 2×2 (Dirección · Horario · Reservas · Contacto) + botón "Cómo llegar".
 *
 * Los datos son placeholders del handoff — el cliente debe sustituirlos
 * con dirección, horario y email reales antes de producción.
 */
export function Visitanos() {
  return (
    <section className="bc-visit" id="visitanos">
      <div className="bc-visit__bg" data-parallax="0.12">
        <Image
          src="/photos/storefront.jpg"
          alt=""
          fill
          sizes="100vw"
          className="bc-visit__bg-img"
        />
      </div>

      <div className="bc-visit__inner">
        <div className="bc-visit__card">
          <p className="bc-eyebrow" data-reveal>
            Visítanos
          </p>
          <h2 className="bc-display" data-reveal data-delay="1">
            Pásate por el club.
          </h2>
          <div className="bc-info-grid">
            <div data-reveal data-delay="1">
              <div className="k">Dirección</div>
              <div className="v">
                Av. Principal 1024
                <br />
                Local 3 · Florida
              </div>
            </div>
            <div data-reveal data-delay="1">
              <div className="k">Horario</div>
              <div className="v">
                Lun – Sáb · 9:00 – 20:00
                <br />
                Dom · Cerrado
              </div>
            </div>
            <div data-reveal data-delay="2">
              <div className="k">Reservas</div>
              <div className="v">Online, 24/7</div>
            </div>
            <div data-reveal data-delay="2">
              <div className="k">Contacto</div>
              <div className="v">hola@brothersclub.co</div>
            </div>
          </div>
          <a
            className="bc-btn bc-btn--ghost"
            href="/reservar"
            data-reveal
            data-delay="2"
          >
            Cómo llegar <span className="arw">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
