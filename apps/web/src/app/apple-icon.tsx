import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — versión 180×180 del monograma BC. Se usa cuando un
 * usuario hace "Añadir a inicio" en iPhone/iPad. Sin esto, el icono que
 * aparece en el home screen es un screenshot de la web (feo y desalineado).
 */
export default function AppleIcon() {
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
          fontSize: 110,
          letterSpacing: -4,
        }}
      >
        BC
      </div>
    ),
    { ...size },
  );
}
