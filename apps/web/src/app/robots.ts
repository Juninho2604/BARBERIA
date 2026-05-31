import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business-info";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/reservar"],
        // El panel admin no debe indexarse aunque esté detrás de auth —
        // cualquier URL filtrada a Google daría pistas innecesarias.
        disallow: ["/admin", "/admin/", "/login"],
      },
    ],
    sitemap: `${BUSINESS.baseUrl}/sitemap.xml`,
  };
}
