import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BUSINESS } from "@/lib/business-info";

/** Redes configuradas en business-info. Solo se renderizan las que tienen
 *  URL real (evita links muertos a "#"). */
const SOCIALS: { key: keyof typeof BUSINESS.social; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "whatsapp", label: "WhatsApp" },
];

/**
 * Footer — bloque superior con logo a la izquierda y dos columnas
 * de links a la derecha. Bloque inferior con copyright y enlace
 * a la reserva.
 */
export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="bc-footer">
      <div className="bc-footer__top">
        <div className="bc-footer__brand">
          <Image
            src="/brand/logo-combinado-inverso.svg"
            alt="Brothers Club Barbershop"
            width={1125}
            height={411}
            className="h-10 w-auto"
          />
        </div>
        <div className="bc-footer__cols">
          <div className="bc-footer__col">
            <h4>{t("navigate")}</h4>
            <a href="#servicios">{t("links.services")}</a>
            <a href="#espacio">{t("links.space")}</a>
            <a href="#visitanos">{t("links.visit")}</a>
            <Link href="/reservar">{t("links.book")}</Link>
          </div>
          <div className="bc-footer__col">
            <h4>{t("follow")}</h4>
            {SOCIALS.map(({ key, label }) => {
              const url = BUSINESS.social[key];
              if (!url) return null;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bc-footer__bot">
        <span>{t("copyright", { year })}</span>
        <Link href="/reservar">
          <span>{t("bookOnline")}</span>
        </Link>
      </div>
    </footer>
  );
}
