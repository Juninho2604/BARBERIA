import { BUSINESS } from "@/lib/business-info";

/**
 * JSON-LD Schema.org `HairSalon` (subtipo de LocalBusiness más específico
 * que `BarberShop`). Permite a Google mostrar horario, dirección, teléfono
 * y rating en el Knowledge Panel + Maps + búsqueda local.
 *
 * Crítico para SEO local de una barbería: sin esto, una búsqueda de
 * "barbershop florida" no muestra Brothers Club como local-pack rich card.
 *
 * Datos vienen de `lib/business-info.ts` — al actualizar dirección/horario
 * reales, este componente recoge automáticamente.
 */
export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: BUSINESS.name,
    description: BUSINESS.description,
    url: BUSINESS.baseUrl,
    image: `${BUSINESS.baseUrl}/opengraph-image`,
    priceRange: BUSINESS.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.address.streetAddress,
      addressLocality: BUSINESS.address.addressLocality,
      addressRegion: BUSINESS.address.addressRegion,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.latitude,
      longitude: BUSINESS.geo.longitude,
    },
    openingHoursSpecification: BUSINESS.hours.spec.map((s) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: s.dayOfWeek,
      opens: s.opens,
      closes: s.closes,
    })),
    ...(BUSINESS.contact.email ? { email: BUSINESS.contact.email } : {}),
    ...(BUSINESS.contact.phone ? { telephone: BUSINESS.contact.phone } : {}),
    sameAs: [
      BUSINESS.social.instagram,
      BUSINESS.social.tiktok,
      BUSINESS.social.whatsapp,
    ].filter(Boolean),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios",
      // Los servicios reales se cargan dinámicamente — para JSON-LD
      // listamos categorías genéricas. Mejora futura: leer del API.
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Corte de cabello" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Afeitado clásico" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Arreglo de barba" } },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD necesita JSON crudo. React lo escapa por defecto si
      // ponemos children, lo que rompe el parsing de Google. Usamos
      // dangerouslySetInnerHTML con valor controlado (no input de usuario).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
