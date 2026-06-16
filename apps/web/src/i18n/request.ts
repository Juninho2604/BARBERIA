import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Resolve mensajes + locale por request (server-side). next-intl pasa
 * `requestLocale` (lo que sale del segmento [locale] del URL). Si no
 * matchea ninguno conocido, caemos al default — esto cubre URLs
 * malformadas y previews de OG sin locale.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
