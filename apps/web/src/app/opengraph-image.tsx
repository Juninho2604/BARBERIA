import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Brothers Club Barbershop — Reserva online";

/**
 * OG card que aparece cuando se comparte el link en WhatsApp, Twitter,
 * Telegram, iMessage, etc. Mantiene la estética editorial: grafito de
 * fondo, monograma "BC" arriba, wordmark + tagline + CTA.
 *
 * Sin esto, el preview en redes es genérico (favicon a baja resolución).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0b",
          color: "#f1ede4",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          fontFamily: "serif",
        }}
      >
        {/* Sello arriba a la derecha */}
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <div
            style={{
              width: 110,
              height: 110,
              border: "1.5px solid rgba(241,237,228,0.26)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: -2,
            }}
          >
            BC
          </div>
        </div>

        {/* Bloque principal */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 18,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#807b70",
              marginBottom: 24,
            }}
          >
            ─── Barbershop · Est. 2026
          </div>
          <div
            style={{
              fontSize: 132,
              lineHeight: 1,
              letterSpacing: -3,
              fontWeight: 500,
              fontStyle: "italic",
              color: "#f1ede4",
              display: "flex",
            }}
          >
            Tu corte,
          </div>
          <div
            style={{
              fontSize: 132,
              lineHeight: 1.05,
              letterSpacing: -3,
              fontWeight: 500,
              fontStyle: "italic",
              color: "#c3bdb1",
              display: "flex",
            }}
          >
            a tu hora.
          </div>
        </div>

        {/* Footer del card */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontFamily: "sans-serif",
            fontSize: 18,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#c3bdb1",
          }}
        >
          <div>brothers club barbershop</div>
          <div>Reservar online →</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
