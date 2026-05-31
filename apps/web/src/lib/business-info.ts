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
    "Brothers Club: cortes clásicos y modernos. Reserva online en menos de un minuto.",

  /** TODO(cliente): reemplazar dirección real. */
  address: {
    streetAddress: "Av. Principal 1024",
    addressLocality: "Florida",
    addressRegion: "FL",
    postalCode: "00000",
    addressCountry: "US",
    /** Línea libre para mostrar en UI. */
    display: "Av. Principal 1024\nLocal 3 · Florida",
  },

  /** TODO(cliente): confirmar geo coords (Google Maps → click derecho → copiar coords). */
  geo: {
    latitude: 25.7617,
    longitude: -80.1918,
  },

  /** TODO(cliente): confirmar email/teléfono reales. */
  contact: {
    email: "hola@brothersclub.co",
    phone: null as string | null,
  },

  /** TODO(cliente): links reales. */
  social: {
    instagram: null as string | null,
    tiktok: null as string | null,
    whatsapp: null as string | null,
  },

  /** Horario de atención. Formato Schema.org openingHours. */
  hours: {
    display: "Lun – Sáb · 9:00 – 20:00\nDom · Cerrado",
    /** Para JSON-LD openingHoursSpecification. */
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
    ],
  },

  priceRange: "$$",

  /** URL canónica del sitio. Configurable via env para evitar hardcode. */
  baseUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://barberia-coral.vercel.app",
} as const;

export type BusinessInfo = typeof BUSINESS;
