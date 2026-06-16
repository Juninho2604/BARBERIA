import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { BUSINESS } from "@/lib/business-info";
import { routing } from "@/i18n/routing";

/**
 * Layout localizado. Sólo cubre las rutas públicas (landing + booking).
 * Admin/login viven fuera del segmento `[locale]` y se quedan en
 * español (operador es bilingüe).
 *
 * No re-renderiza `<html>` ni `<body>` — el root layout ya los provee.
 * Aquí solo envolvemos en `<NextIntlClientProvider>` para que los
 * componentes cliente puedan usar `useTranslations()` y `useLocale()`.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "metadata" });
  // Para SEO: hreflang alternativos apuntan al canónico de cada locale.
  // `localePrefix: "as-needed"` → EN no lleva prefijo, ES sí.
  const isDefault = locale === routing.defaultLocale;
  const path = isDefault ? "/" : `/${locale}`;
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: path,
      languages: {
        en: "/",
        es: "/es",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
      url: `${BUSINESS.baseUrl}${path}`,
      siteName: BUSINESS.name,
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Habilita SSG por locale — sin esto los componentes server quedan
  // en modo dinámico aunque el contenido sea estático.
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
