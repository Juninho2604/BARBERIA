"use client";

import { useEffect } from "react";

/**
 * Effects — activa scroll reveal + parallax sutil para elementos con
 * los atributos `data-reveal` y `data-parallax`. Replica el comportamiento
 * del prototipo del design handoff (app.js).
 *
 * - `[data-reveal]` → opacity/translate inicial vía CSS; se le añade
 *   `.is-in` al entrar en viewport (IntersectionObserver). `[data-delay="1|2|3"]`
 *   escalonan 0.1/0.2/0.3s.
 * - `[data-parallax="0.18"]` → desplaza la `<img>` interna en `translate3d`
 *   con la velocidad indicada según la posición del centro respecto al viewport.
 *
 * Respeta `prefers-reduced-motion`: muestra reveals sin animar y desactiva
 * el parallax.
 */
export function LandingEffects() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- scroll reveal ----------
    const reveals = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (en.isIntersecting) {
              en.target.classList.add("is-in");
              io.unobserve(en.target);
            }
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      reveals.forEach((el) => io.observe(el));
    }

    // ---------- parallax ----------
    if (reduce) return;
    const parallaxNodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]"),
    );
    if (parallaxNodes.length === 0) return;

    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      for (const node of parallaxNodes) {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) continue;
        const speed = parseFloat(node.dataset.parallax || "0.15");
        const center = rect.top + rect.height / 2;
        const offset = (center - vh / 2) * speed * -1;
        const img = node.querySelector<HTMLImageElement>("img");
        if (img) img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}
