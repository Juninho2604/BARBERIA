/**
 * Brothers Club — tokens de marca.
 *
 * Fuente: design handoff v1 (2026-05-29) — paleta cálida monocromática
 * (ink + bone) + tipografía Bodoni Moda (serif) / Hanken Grotesk (sans).
 * Los assets vectoriales viven en `/public/brand/`.
 *
 * Este archivo expone los valores literales (hex / nombres) para usarlos
 * desde TS cuando hace falta (ej. canvas/three.js). Para CSS, los mismos
 * colores se reflejan como variables en `globals.css`.
 */

export const brand = {
  name: 'Brothers Club',
  tagline: 'Barbershop · Est. 2026',
  fullName: 'Brothers Club Barbershop',

  /** Paleta cálida monocromática — ink (negro cálido) + bone (blanco hueso). */
  color: {
    ink:      '#0a0a0b', // fondo base
    ink2:     '#050506', // negro más profundo (gradients)
    panel:    '#131315', // superficies elevadas
    bone:     '#f1ede4', // texto principal
    boneDim:  '#c3bdb1', // texto secundario
    muted:    '#807b70', // texto terciario / meta
    line:     'rgba(241,237,228,0.13)',
    line2:    'rgba(241,237,228,0.26)',
  },

  /** Tipografía oficial post-rebrand. */
  font: {
    serif: 'Bodoni Moda', // titulares, nombres, precios, monograma
    sans:  'Hanken Grotesk', // cuerpo, etiquetas, botones, nav
  },

  /** Logos vectoriales (SVG en /public/brand/). */
  logos: {
    horizontalPrincipal: '/brand/logo-horizontal-principal.svg',
    combinadoPrincipal:  '/brand/logo-combinado-principal.svg',
    combinadoNegro:      '/brand/logo-combinado-negro.svg',
    combinadoInverso:    '/brand/logo-combinado-inverso.svg',
  },

  /** Asset de referencia — solo para consulta humana, no enlazar en producción. */
  guide: '/brand/guia-de-marca.pdf',
} as const;

export type Brand = typeof brand;
