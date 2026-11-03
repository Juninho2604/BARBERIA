"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BUSINESS } from "@/lib/business-info";

/**
 * Meta Pixel para las campañas de Facebook/Instagram. Solo se monta en el
 * layout público: el panel admin guarda los tokens de sesión en
 * localStorage y no debe cargar scripts de terceros.
 *
 * Es el snippet oficial de Meta, pero inicializado desde un efecto: así el
 * PageView se registra también en las navegaciones del lado del cliente
 * (cambio de idioma, ir a /reservar), que el snippet por sí solo no ve.
 */

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let initializedId: string | null = null;

function ensureMetaPixel(pixelId: string) {
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as Fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq ??= fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }
  if (initializedId !== pixelId) {
    window.fbq("init", pixelId);
    initializedId = pixelId;
  }
}

/** Evento personalizado; no hace nada si el pixel no está configurado. */
export function trackMetaCustom(event: string, params?: Record<string, unknown>) {
  if (!BUSINESS.meta.pixelId || !window.fbq) return;
  window.fbq("trackCustom", event, params);
}

export function MetaPixel() {
  const pixelId = BUSINESS.meta.pixelId;
  const pathname = usePathname();

  useEffect(() => {
    if (!pixelId) return;
    ensureMetaPixel(pixelId);
    window.fbq?.("track", "PageView");
  }, [pixelId, pathname]);

  if (!pixelId) return null;
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element -- píxel de seguimiento de Meta, no una imagen de contenido */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        alt=""
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
