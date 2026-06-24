/**
 * Información del negocio — fuente única para Visítanos, JSON-LD,
 * manifest, sitemap y futuras integraciones (mapas, Google Business).
 *
 * Cuando el cliente confirme dirección/horario/email reales, actualizar
 * SOLO este archivo y todo lo demás los recoge.
 */
export const BUSINESS = {
  name: "Brothers Club Barbershop",
  shortName: "Brothers Club",
  tagline: "Barbershop · Est. 2026",
  description:
    "Brothers Club Barbershop en Orlando, FL. Cortes clásicos y modernos, ambiente editorial. Reserva online en menos de un minuto.",

  address: {
    streetAddress: "7900 S Orange Blossom Trail, Suite 150",
    addressLocality: "Orlando",
    addressRegion: "FL",
    postalCode: "32809",
    addressCountry: "US",
    /** Línea libre para mostrar en UI (con saltos). */
    display: "7900 S Orange Blossom Trail\nSuite 150 · Orlando, FL 32809",
  },

  /** Coords aprox del 7900 S Orange Blossom Trail, Orlando FL 32809.
      TODO(cliente): si querés precisión exacta para Google Maps, abrí
      la ubicación en maps.google.com, click derecho en el pin del
      local y "copiar coordenadas" → reemplazar acá. */
  geo: {
    latitude: 28.4607,
    longitude: -81.4084,
  },

  contact: {
    email: "brothersclub2025@gmail.com",
    /** TODO(cliente): teléfono cuando lo tengan disponible. */
    phone: null as string | null,
  },

  /** Links reales de redes. TODO(cliente): TikTok y WhatsApp cuando los tengan. */
  social: {
    instagram: "https://www.instagram.com/brothersclubbarbers" as string | null,
    tiktok: null as string | null,
    whatsapp: null as string | null,
  },

  /** Horario de atención. Formato Schema.org openingHoursSpecification.
      Lun – Sáb · 9:00 – 20:00 · Dom · 10:00 – 18:00 */
  hours: {
    display: "Lun – Sáb · 9:00 – 20:00\nDom · 10:00 – 18:00",
    spec: [
      {
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "20:00",
      },
      {
        dayOfWeek: ["Sunday"],
        opens: "10:00",
        closes: "18:00",
      },
    ],
  },

  priceRange: "$$",

  /** Zona horaria IANA del negocio. CRÍTICA: todos los formateos de
      fechas/horas en el frontend usan esto para que admin y cliente
      vean la misma hora sin importar dónde estén. */
  timezone: "America/New_York",

  /** URL canónica del sitio. Configurable via env. */
  baseUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://brothersclubbarbers.com",
} as const;

export type BusinessInfo = typeof BUSINESS;
