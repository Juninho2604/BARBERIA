/**
 * Brothers Club — tokens de marca.
 *
 * Fuente: GUIA_DE_MARCA v4 final del cliente (v1 = 2026-05-28).
 * Los assets vectoriales viven en `/public/brand/`.
 *
 * Este archivo expone los valores literales (hex / nombres) para usarlos
 * desde TS cuando hace falta (ej. canvas/three.js). Para CSS, los mismos
 * colores se reflejan como variables en `globals.css`.
 */

export const brand = {
  name: 'Brothers Club',
  tagline: 'since 2026',
  fullName: 'Brothers Club Barbershop',

  /** Paleta monocromática editorial — sin colores cálidos ni acentos saturados. */
  color: {
    grafito: '#0F0F0F',     // texto principal — "BROTHERS"
    grisOscuro: '#5A5A5A',  // texto secundario — "CLUB" / "SINCE 2026"
    grisClaro: '#9A9A9A',   // líneas accent, dividers
    blancoRoto: '#ECECEC',  // fondo principal
  },

  /** Tipografía oficial — Google Fonts: Jost. */
  font: {
    family: 'Jost',
    weights: {
      display: 500, // "BROTHERS" — Medium
      light: 300,   // "CLUB" / "SINCE 2026" — Light
    },
    tracking: {
      normal: '0em',
      wide: '0.072em', // +72 (tracking de "CLUB" y "SINCE 2026")
    },
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
