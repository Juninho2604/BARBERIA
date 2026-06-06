import Image from "next/image";
import { useTranslations } from "next-intl";
import { BUSINESS } from "@/lib/business-info";

/**
 * Visítanos — sección full-bleed con fondo `storefront.jpg`, parallax sutil
 * (0.12) y doble degradado lateral. Tarjeta a la izquierda con info-grid
 * 2×2 (Dirección · Horario · Reservas · Contacto) + botón "Cómo llegar".
 *
 * Datos del negocio vienen de `lib/business-info.ts` (estables entre
 * locales). Etiquetas y CTAs vienen de los mensajes i18n.
 */

function googleMapsUrl(): string {
  const { latitude, longitude } = BUSINESS.geo;
  const q = encodeURIComponent(
    `${BUSINESS.address.streetAddress}, ${BUSINESS.address.addressLocality}`,
  );
  return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=&query=${latitude},${longitude}`;
}

export function Visitanos() {
  const t = useTranslations("visitanos");
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
            {t("eyebrow")}
          </p>
          <h2 className="bc-display" data-reveal data-delay="1">
            {t("title")}
          </h2>
          <div className="bc-info-grid">
            <div data-reveal data-delay="1">
              <div className="k">{t("labels.address")}</div>
              <address className="v" style={{ fontStyle: "normal", whiteSpace: "pre-line" }}>
                {BUSINESS.address.display}
              </address>
            </div>
            <div data-reveal data-delay="1">
              <div className="k">{t("labels.hours")}</div>
              <div className="v" style={{ whiteSpace: "pre-line" }}>
                {BUSINESS.hours.display}
              </div>
            </div>
            <div data-reveal data-delay="2">
              <div className="k">{t("labels.bookings")}</div>
              <div className="v">{t("bookingsValue")}</div>
            </div>
            <div data-reveal data-delay="2">
              <div className="k">{t("labels.contact")}</div>
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
            {t("directions")} <span className="arw">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
