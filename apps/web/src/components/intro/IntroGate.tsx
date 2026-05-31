'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy + ssr:false: three.js sólo se carga en el cliente.
const BarberIntro = dynamic(() => import('./BarberIntro'), { ssr: false });

const STORAGE_KEY = 'barber_intro_seen';

type Phase = 'cover' | 'intro' | 'done';

/**
 * Detección de WebGL. Sin esto, navegadores que no soportan WebGL (Safari
 * con WebGL desactivado, browsers de kiosko, modo low-end) entran a
 * `BarberIntro` y el `new WebGLRenderer()` tira excepción → el overlay
 * cover queda eternamente cubriendo la landing.
 */
function detectWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const ctx =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!ctx;
  } catch {
    return false;
  }
}

/**
 * IntroGate — gate de la intro 3D.
 *
 * Anti-flash: en el primer paint (SSR + hidratación) renderiza un overlay
 * opaco con el fondo de la intro, de modo que la landing nunca se ve por
 * debajo. En `useEffect` decide qué hacer:
 *  - Sin WebGL → ocultar overlay y mostrar landing directo.
 *  - Repeat visitor / reduced-motion / save-data → ocultar overlay sin
 *    montar WebGL (ahorra 3.7 MB de GLB en conexiones lentas).
 *  - Primera visita con WebGL → montar `BarberIntro`.
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
    // prefers-reduced-data o connection.saveData → no descargamos 3.7 MB.
    if (!skip) {
      type ConnLike = { saveData?: boolean; effectiveType?: string };
      const conn = (navigator as { connection?: ConnLike }).connection;
      if (conn?.saveData) skip = true;
      if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') skip = true;
    }
    // Sin WebGL: no podemos renderizar la silla. Saltamos directo.
    if (!skip && !detectWebGL()) skip = true;

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
            background: '#0a0a0b',
            pointerEvents: 'none',
          }}
        />
      )}
      {phase === 'intro' && <BarberIntro onEnter={onEnter} />}
    </>
  );
}
