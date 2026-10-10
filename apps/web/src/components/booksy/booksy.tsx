"use client";

import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { useLocale } from "next-intl";
import { BUSINESS } from "@/lib/business-info";
import { routing } from "@/i18n/routing";

/**
 * Integración con el widget de Booksy (`booksy.com/widget/code.js`).
 *
 * El script de Booksy genera su propio botón genérico. Para mantener el
 * diseño de la marca, ese botón vive en un contenedor fuera de pantalla y
 * nuestros botones le hacen `.click()`: Booksy abre su ventana de reserva
 * como si el cliente hubiera pulsado su botón.
 *
 * No dependemos de nombres de clase internos de Booksy: el disparador es
 * el primer `a`/`button` que el script cree dentro del contenedor. Si el
 * script lo inserta directamente en `<body>`, lo reubicamos dentro del
 * contenedor (solo nodos que mencionan "booksy", para no tocar portales
 * de Next u otros).
 *
 * El contenedor usa `position: fixed` fuera de pantalla sin transform,
 * opacity ni clip-path: así una ventana `position: fixed` que Booksy cree
 * dentro de él sigue posicionándose respecto al viewport y se ve.
 */

const HOST_PREFIX = "booksy-widget-host-";
const ADOPT_WINDOW_MS = 4000;

function scriptSrc(lang: string) {
  const { id, country } = BUSINESS.booksy;
  const qs = new URLSearchParams({ id, country, lang });
  return `https://booksy.com/widget/code.js?${qs.toString()}`;
}

function ensureBooksy(lang: string) {
  const hostId = HOST_PREFIX + lang;
  if (document.getElementById(hostId)) return;

  const host = document.createElement("div");
  host.id = hostId;
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "1px",
    height: "1px",
    overflow: "hidden",
    // `fixed` crea un stacking context: sin z-index alto, una ventana de
    // Booksy creada aquí dentro queda tapada por el nav y las secciones.
    zIndex: "2147483000",
  });

  const observer = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement) || node.id.startsWith(HOST_PREFIX)) return;
        if (!node.outerHTML.toLowerCase().includes("booksy")) return;
        if (!node.matches("a, button") && !node.querySelector("a, button")) return;
        host.appendChild(node);
      });
    }
  });
  observer.observe(document.body, { childList: true });

  const script = document.createElement("script");
  script.src = scriptSrc(lang);
  script.async = true;
  const stop = () => window.setTimeout(() => observer.disconnect(), ADOPT_WINDOW_MS);
  script.addEventListener("load", stop);
  script.addEventListener("error", () => observer.disconnect());

  host.appendChild(script);
  document.body.appendChild(host);
}

function findTrigger(lang: string): HTMLElement | null {
  const selector = "a, button, [role='button']";
  const own = document.getElementById(HOST_PREFIX + lang);
  const fromOwn = own?.querySelector<HTMLElement>(selector);
  if (fromOwn) return fromOwn;
  // Si Booksy solo se inicializa una vez por página, el host del primer
  // idioma cargado es el único con botón: lo usamos como respaldo.
  for (const host of document.querySelectorAll<HTMLElement>(`[id^='${HOST_PREFIX}']`)) {
    const el = host.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}

/** Abre la ventana de Booksy. Devuelve false si el widget aún no cargó. */
export function openBooksy(lang: string): boolean {
  const trigger = findTrigger(lang);
  if (!trigger) return false;
  trigger.click();
  return true;
}

/** Carga el script de Booksy una vez por idioma. Va en el layout público. */
export function BooksyLoader() {
  const locale = useLocale();
  useEffect(() => {
    ensureBooksy(locale);
  }, [locale]);
  return null;
}

function bookingPath(locale: string) {
  return locale === routing.defaultLocale ? "/reservar" : `/${locale}/reservar`;
}

/**
 * Link de reserva con el estilo que se le pase. Si Booksy ya cargó, abre
 * su ventana sin salir de la página; si no (o con ctrl/cmd+click), sigue
 * el href a /reservar, que abre Booksy en cuanto esté listo.
 */
export function BookLink({
  onClick,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const locale = useLocale();
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (openBooksy(locale)) e.preventDefault();
  }
  return <a {...props} href={bookingPath(locale)} onClick={handleClick} />;
}

type LauncherState = "loading" | "ready" | "failed";
const LAUNCHER_TIMEOUT_MS = 10000;

/**
 * Contenido de /reservar: intenta abrir Booksy automáticamente en cuanto
 * su script termina de cargar, y deja un botón visible para reabrirlo.
 */
export function BooksyLauncher({
  openLabel,
  loadingLabel,
  failedText,
  profileLabel,
}: {
  openLabel: string;
  loadingLabel: string;
  failedText: string;
  profileLabel: string;
}) {
  const locale = useLocale();
  const [state, setState] = useState<LauncherState>("loading");

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (openBooksy(locale)) {
        setState("ready");
        window.clearInterval(timer);
      } else if (Date.now() - started > LAUNCHER_TIMEOUT_MS) {
        setState("failed");
        window.clearInterval(timer);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [locale]);

  const profileUrl = BUSINESS.booksy.profileUrl;

  return (
    <div className="mt-12">
      <button
        type="button"
        className="bc-btn bc-btn--solid"
        disabled={state === "loading"}
        onClick={() => {
          if (!openBooksy(locale)) setState("failed");
        }}
      >
        {state === "loading" ? loadingLabel : openLabel}
        {state !== "loading" && <span className="arw">→</span>}
      </button>

      {state === "failed" && (
        <div className="mt-8 max-w-xl rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-sm leading-relaxed text-[color:var(--color-fg-muted)]">
          <p>{failedText}</p>
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block uppercase tracking-[0.22em] text-[color:var(--color-fg)] underline-offset-4 hover:underline"
            >
              {profileLabel} →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
