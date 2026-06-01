import Image from "next/image";
import { BUSINESS } from "@/lib/business-info";

/**
 * Visítanos — sección full-bleed con fondo `storefront.jpg`, parallax sutil
 * (0.12) y doble degradado lateral. Tarjeta a la izquierda con info-grid
 * 2×2 (Dirección · Horario · Reservas · Contacto) + botón "Cómo llegar".
 *
 * Datos vienen de `lib/business-info.ts` — actualizar ahí cuando el
 * cliente confirme dirección/horario/email reales.
 */

function googleMapsUrl(): string {
  const { latitude, longitude } = BUSINESS.geo;
  const q = encodeURIComponent(
    `${BUSINESS.address.streetAddress}, ${BUSINESS.address.addressLocality}`,
  );
  return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=&query=${latitude},${longitude}`;
}

export function Visitanos() {
  const mapsUrl = googleMapsUrl();
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
              <address className="v" style={{ fontStyle: "normal", whiteSpace: "pre-line" }}>
                {BUSINESS.address.display}
              </address>
            </div>
            <div data-reveal data-delay="1">
              <div className="k">Horario</div>
              <div className="v" style={{ whiteSpace: "pre-line" }}>
                {BUSINESS.hours.display}
              </div>
            </div>
            <div data-reveal data-delay="2">
              <div className="k">Reservas</div>
              <div className="v">Online, 24/7</div>
            </div>
            <div data-reveal data-delay="2">
              <div className="k">Contacto</div>
              <div className="v">
                {BUSINESS.contact.email && (
                  <a
                    href={`mailto:${BUSINESS.contact.email}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {BUSINESS.contact.email}
                  </a>
                )}
                {BUSINESS.contact.phone && (
                  <>
                    <br />
                    <a
                      href={`tel:${BUSINESS.contact.phone}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {BUSINESS.contact.phone}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
          <a
            className="bc-btn bc-btn--ghost"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
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
