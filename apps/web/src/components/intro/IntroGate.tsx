'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy + ssr:false: three.js sólo se carga en el cliente.
const BarberIntro = dynamic(() => import('./BarberIntro'), { ssr: false });

const STORAGE_KEY = 'barber_intro_seen';

type Phase = 'cover' | 'intro' | 'done';

/**
 * IntroGate — gate de la intro 3D.
 *
 * Truco anti-flash: en el primer paint (SSR + hidratación) renderiza un
 * overlay opaco con el fondo de la intro, de modo que la landing nunca se
 * ve por debajo. En `useEffect` decide qué hacer:
 *  - Repeat visitor / reduced-motion → ocultar el overlay (no monta WebGL).
 *  - Primera visita → montar `BarberIntro`; el overlay queda detrás como
 *    fallback hasta que el canvas tenga su primer frame.
 */
export function IntroGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('cover');

  useEffect(() => {
    let skip = false;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY)) skip = true;
    } catch {
      // sessionStorage puede fallar (modo incógnito muy estricto). Seguimos.
    }
    if (!skip && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      skip = true;
    }
    setPhase(skip ? 'done' : 'intro');
  }, []);

  const onEnter = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* noop */
    }
    setPhase('done');
  };

  return (
    <>
      {/* La landing siempre vive en el DOM (SEO + fallback si WebGL falla). */}
      {children}
      {phase !== 'done' && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'radial-gradient(120% 80% at 50% 64%, #1c140f 0%, #0c0908 42%, #050403 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {phase === 'intro' && <BarberIntro onEnter={onEnter} />}
    </>
  );
}
