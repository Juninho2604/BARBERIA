import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon dinámico — monograma "BC" en blanco roto sobre grafito.
 * Generado por Next 15 en build via @vercel/og (Satori).
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0b",
          color: "#f1ede4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: -1,
        }}
      >
        BC
      </div>
    ),
    { ...size },
  );
}
