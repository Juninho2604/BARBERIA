import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { api } from "@/lib/api";
import { BookingFlow } from "@/components/booking/flow";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("reservarTitle") };
}

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("booking");

  const [services, barbers] = await Promise.all([
    api.listServices().catch(() => []),
    api.listBarbers().catch(() => []),
  ]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[color:var(--color-bg)]">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
        >
          {t("back")}
        </Link>
        <p className="mt-10 text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          {t("header")}
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-[color:var(--color-fg-muted)]">
          {t("subtitle")}
        </p>

        {services.length === 0 || barbers.length === 0 ? (
          <p className="mt-12 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-[color:var(--color-fg-muted)]">
            {t("configEmpty")}
          </p>
        ) : (
          <BookingFlow services={services} barbers={barbers} />
        )}
      </div>
    </main>
  );
}
