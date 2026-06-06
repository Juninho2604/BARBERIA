import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business-info";

/**
 * Sitemap con ambos locales. EN va sin prefijo (default,
 * `localePrefix: "as-needed"`), ES va bajo `/es`. Google indexa los dos
 * y los enlaza vía `alternates` (hreflang) — esto manda a las versiones
 * correctas según el idioma del navegador del usuario.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = BUSINESS.baseUrl;
  const entries: MetadataRoute.Sitemap = [];

  // Landing en/es
  entries.push({
    url: `${base}/`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 1.0,
    alternates: {
      languages: {
        en: `${base}/`,
        es: `${base}/es`,
        "x-default": `${base}/`,
      },
    },
  });
  entries.push({
    url: `${base}/es`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 1.0,
    alternates: {
      languages: {
        en: `${base}/`,
        es: `${base}/es`,
        "x-default": `${base}/`,
      },
    },
  });

  // Reservar en/es
  entries.push({
    url: `${base}/reservar`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
    alternates: {
      languages: {
        en: `${base}/reservar`,
        es: `${base}/es/reservar`,
        "x-default": `${base}/reservar`,
      },
    },
  });
  entries.push({
    url: `${base}/es/reservar`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
    alternates: {
      languages: {
        en: `${base}/reservar`,
        es: `${base}/es/reservar`,
        "x-default": `${base}/reservar`,
      },
    },
  });

  return entries;
}
