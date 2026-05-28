'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy + ssr:false: three.js sólo se carga en el cliente.
const BarberIntro = dynamic(() => import('./BarberIntro'), { ssr: false });

const STORAGE_KEY = 'barber_intro_seen';

export function IntroGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // sessionStorage puede fallar (modo incógnito muy estricto). Seguimos sin marca.
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setShowIntro(true);
  }, []);

  const onEnter = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* noop */
    }
    setShowIntro(false);
  };

  return (
    <>
      {/* La landing siempre vive en el DOM (SEO + fallback si WebGL falla). */}
      {children}
      {showIntro && <BarberIntro onEnter={onEnter} />}
    </>
  );
}
