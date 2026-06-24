"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Switcher de idioma. Muestra bandera + código (`🇺🇸 EN` / `🇪🇸 ES`) con el
 * activo destacado. Banderas como SVG inline (NO emoji): los emoji de
 * bandera no renderizan en Windows/Chrome — muestran "US"/"ES" en texto.
 * El SVG garantiza la bandera en todas las plataformas. Convención del
 * cliente: bandera de USA para inglés, bandera de España para español.
 *
 * El switch usa `next-intl` para preservar el path actual al cambiar de
 * locale (estás en /es/reservar → click "EN" → /reservar; estás en / →
 * click "ES" → /es).
 *
 * Persistencia: next-intl guarda la elección en cookie `NEXT_LOCALE`
 * que el middleware respeta en siguientes visitas.
 */

/** Bandera de USA simplificada (barras + cantón azul con estrellas). */
function FlagUS() {
  return (
    <svg
      className="bc-lang__flag"
      viewBox="0 0 20 14"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="20" height="14" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} y={y} width="20" height="1" fill="#b22234" />
      ))}
      <rect width="9" height="7" fill="#3c3b6e" />
      {[1.4, 4, 6.6].map((cx) =>
        [1.4, 3.6, 5.6].map((cy) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.5" fill="#fff" />
        )),
      )}
    </svg>
  );
}

/** Bandera de España (rojo–amarillo–rojo). */
function FlagES() {
  return (
    <svg
      className="bc-lang__flag"
      viewBox="0 0 20 14"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="20" height="14" fill="#c60b1e" />
      <rect y="3.5" width="20" height="7" fill="#ffc400" />
    </svg>
  );
}

const FLAGS: Record<string, () => React.ReactElement> = {
  en: FlagUS,
  es: FlagES,
};
export function LangSwitcher() {
  const t = useTranslations("langSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(target: string) {
    if (target === locale || isPending) return;
    startTransition(() => {
      router.replace(pathname, { locale: target as "en" | "es" });
    });
  }

  return (
    <div
      className="bc-lang"
      role="group"
      aria-label={t("aria")}
      title={t("tooltip")}
    >
      {routing.locales.map((l, i) => {
        const Flag = FLAGS[l];
        return (
          <span key={l} className="bc-lang__item-wrap">
            {i > 0 && <span className="bc-lang__sep" aria-hidden="true">/</span>}
            <button
              type="button"
              onClick={() => switchTo(l)}
              aria-pressed={l === locale}
              className={`bc-lang__item ${l === locale ? "is-active" : ""}`}
              disabled={isPending}
            >
              {Flag && <Flag />}
              <span>{l.toUpperCase()}</span>
            </button>
          </span>
        );
      })}
    </div>
  );
}
