"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Switcher de idioma. UI lenguaje-agnóstica: muestra `ES | EN` con el
 * activo destacado. Los códigos ISO son universales — un hablante de
 * cualquiera de los dos idiomas entiende qué hace al ver "ES" y "EN".
 *
 * El switch usa `next-intl` para preservar el path actual al cambiar de
 * locale (estás en /es/reservar → click "EN" → /reservar; estás en / →
 * click "ES" → /es).
 *
 * Persistencia: next-intl guarda la elección en cookie `NEXT_LOCALE`
 * que el middleware respeta en siguientes visitas.
 */
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
      {routing.locales.map((l, i) => (
        <span key={l} className="bc-lang__item-wrap">
          {i > 0 && <span className="bc-lang__sep" aria-hidden="true">/</span>}
          <button
            type="button"
            onClick={() => switchTo(l)}
            aria-pressed={l === locale}
            className={`bc-lang__item ${l === locale ? "is-active" : ""}`}
            disabled={isPending}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
