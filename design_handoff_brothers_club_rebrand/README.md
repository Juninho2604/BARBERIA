# Handoff: Brothers Club — Rebranding (Landing Page)

## Overview
Rediseño de marca completo del sitio de **Brothers Club Barbershop** (barbería). Es un
*rebranding* de la landing existente (https://barberia-coral.vercel.app): conserva la
**esencia minimalista** y la **paleta original** (negro cálido + blanco hueso, sin color
estridente) pero renueva tipografía, logo/sello, layout y el tratamiento de las fotos
(usadas como fondos inmersivos y paneles editoriales).

La página es one-page con scroll: nav fijo → hero → manifiesto → galería "El Espacio" →
lista de servicios → "Visítanos" (fachada) → CTA → footer.

## About the Design Files
Los archivos de este bundle son **referencias de diseño hechas en HTML/CSS/JS** — un
prototipo que muestra el aspecto e interacciones deseadas, **no código de producción para
copiar tal cual**. La tarea es **recrear este diseño en el entorno del repositorio existente**
(por lo que vi, probablemente Next.js/React, ya que el original corre en Vercel) usando sus
patrones, componentes y convenciones. Si aún no hay un sistema de componentes, replica la
estructura con el framework que ya use el proyecto.

Dos formas de leerlo:
- **`rebrand.html`** — archivo único autocontenido (CSS/JS/imágenes embebidas). Ábrelo en el
  navegador para ver el resultado final y todas las interacciones.
- **Carpeta `source/`** — el mismo diseño separado en archivos legibles (`app.css`, `app.js`,
  `tweaks-app.jsx`). **Usa estos para leer el CSS y la lógica**, son mucho más fáciles de seguir
  que el HTML empaquetado.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciado e interacciones son finales.
Recrear la UI con fidelidad de píxel usando las librerías/patrones del codebase. Las únicas
partes con datos de relleno son la dirección, horario y contacto de la sección *Visítanos*
(ver "Contenido / Copy").

---

## Design Tokens

### Colores
| Token | Hex | Uso |
|---|---|---|
| `--ink` | `#0a0a0b` | Fondo base (negro cálido) |
| `--ink-2` | `#050506` | Negro más profundo para capas/degradados |
| `--panel` | `#131315` | Superficies elevadas |
| `--bone` | `#f1ede4` | Texto principal (blanco hueso cálido) |
| `--bone-dim` | `#c3bdb1` | Texto secundario |
| `--muted` | `#807b70` | Texto terciario / meta / etiquetas |
| `--line` | `rgba(241,237,228,0.13)` | Líneas/hairlines sutiles |
| `--line-2` | `rgba(241,237,228,0.26)` | Líneas con más contraste |
| `--accent` | `#f1ede4` (mono por defecto) | Acento — ver nota |

> **Nota sobre el acento:** por defecto es monocromático (= `--bone`), para no perder la paleta.
> El prototipo permite alternarlo opcionalmente a latón `#b9925a` o petróleo `#4d7a82` (color
> sacado de la fachada). Implementa solo el mono salvo que se pida lo contrario.

### Tipografía
Dos familias de Google Fonts:
- **`Bodoni Moda`** (serif display, alto contraste) → titulares, nombres de servicio, precios,
  wordmark, monograma. Pesos 400–700, con itálica.
- **`Hanken Grotesk`** (sans) → cuerpo, etiquetas, botones, nav, meta. Pesos 300–700.

| Rol | Familia | Tamaño (clamp) | Peso | Tracking | Notas |
|---|---|---|---|---|---|
| H1 hero | Bodoni Moda | `clamp(3.4rem, 11vw, 9.6rem)` | 500 | `-0.015em` | line-height `.96`; 2ª línea en itálica |
| H2 sección | Bodoni Moda | `clamp(2.1rem … 6rem)` según sección | 500 | `-0.015em` | line-height `.96` |
| Nombre servicio | Bodoni Moda | `clamp(1.3rem, 2.4vw, 2rem)` | 500 | — | |
| Precio | Bodoni Moda | `clamp(1.2rem, 2vw, 1.7rem)` | 500 | — | |
| Lead / intro | Hanken Grotesk | `clamp(1rem, 1.35vw, 1.2rem)` | 300 | — | color `--bone-dim`, max 46ch |
| Cuerpo | Hanken Grotesk | ~1rem | 400 | `0.005em` | line-height `1.55` |
| Eyebrow / label | Hanken Grotesk | `0.72rem` | 600 | `0.42em` UPPER | con guion `34px×1px` antes (y después si centrado) |
| Botón | Hanken Grotesk | `0.74rem` | 600 | `0.22em` UPPER | padding `1.15em 2em` |
| Nav links | Hanken Grotesk | `0.78rem` | 500 | `0.12em` UPPER | underline animado en hover |

### Espaciado / layout
- Padding lateral global: `--pad = clamp(20px, 5vw, 88px)`
- Ancho máximo de contenido: `--maxw = 1320px` (centrado)
- Padding vertical de secciones: `clamp(80px, 12vh, 170px)`
- Easing estándar: `cubic-bezier(.22,.61,.36,1)` (usado en casi todas las transiciones)
- Sin border-radius en ningún elemento — bordes rectos, estética editorial. Botones y figuras
  son rectangulares. (No introducir esquinas redondeadas.)

---

## Screens / Views
Es una sola página. Secciones en orden:

### 1. Nav (fijo)
- **Layout:** `position:fixed`, full-width, `display:flex` `space-between`, padding
  `1.6rem var(--pad)`. Transparente sobre el hero.
- **Estado scrolled** (al pasar `scrollY > 40`): añade clase `.scrolled` → padding baja a
  `1rem var(--pad)`, fondo `rgba(8,8,9,.72)` con `backdrop-filter: blur(18px) saturate(120%)`,
  borde inferior `--line`.
- **Izquierda — marca:** "Brothers Club" en Bodoni 600 `1.18rem` (`white-space:nowrap`) +
  etiqueta "Barbershop" en Hanken `0.56rem`/600/`0.34em`/upper color `--muted`, alineadas a baseline.
- **Derecha — links:** Servicios · El Espacio · Visítanos (Hanken upper, underline animado en
  hover) + botón sólido "Reservar →".
- **Responsive (<860px):** ocultar los links de texto, dejar solo marca + botón Reservar.

### 2. Hero
- **Layout:** `min-height:100svh`, flex column, contenido alineado abajo
  (`justify-content:flex-end`), padding inferior `clamp(48px,7vh,96px)`.
- **Fondo:** foto `portrait.jpg` (barbero + cliente en espejo) full-bleed, `object-fit:cover`,
  `object-position:center 30%`, filtro `grayscale(.18) contrast(1.02) brightness(.82)`,
  altura `120%` (para parallax). Encima, dos degradados superpuestos:
  - `linear-gradient(180deg, rgba(8,8,9,.55), rgba(8,8,9,.12) 32%, rgba(8,8,9,.55) 70%, var(--ink) 100%)`
  - `linear-gradient(95deg, rgba(8,8,9,.75), rgba(8,8,9,.18) 55%, transparent)`
- **Sello (arriba-derecha):** SVG circular giratorio (texto en `textPath`:
  "BROTHERS CLUB · BARBERSHOP · EST. 2026 ·") con monograma **BC** en Bodoni al centro.
  Animación `spin 26s linear infinite`. 128×128px. Ocultar <860px.
- **Contenido:** eyebrow "Barbershop · Est. 2026" → H1 "Tu corte,<br><em>a tu hora.</em>"
  (2ª línea en itálica) → lead (copy abajo) → 2 botones: "Reservar cita →" (sólido) y
  "Ver servicios" (ghost).
- **Indicador "Scroll ↓"** abajo-derecha, `writing-mode:vertical-rl`.

### 3. Manifiesto
- Centrado, max-width contenido. Eyebrow centrado "El oficio" → H2 grande
  (`clamp(2.1rem,5.5vw,4.6rem)`, max 18ch) → párrafo (max 54ch, `--bone-dim`, peso 300) →
  una línea vertical decorativa `1px × 64px` color `--line-2` debajo.

### 4. El Espacio (galería)
- **Encabezado:** flex con H2 "Un lugar hecho para quedarse." a la izquierda y un lead a la
  derecha (`align-items:flex-end`, wrap).
- **Galería:** CSS grid `repeat(12, 1fr)`, `grid-auto-rows: clamp(60px,9vw,118px)`,
  `gap: clamp(14px,1.6vw,26px)`. Tres figuras:
  - `fig--a` → `grid-column:1/6; grid-row:span 6` — foto **workstation** (estación/sillón).
  - `fig--b` → `grid-column:6/13; grid-row:span 4` — foto **coffee** (café + planta).
  - `fig--c` → `grid-column:6/13; grid-row:span 4` — foto **cut-detail** (degradado nuca).
- **Cada figura:** imagen `object-fit:cover` con filtro `grayscale(.2) contrast(1.02) brightness(.92)`.
  En hover: `transform:scale(1.05)` + filtro a `grayscale(0) brightness(1)` (transición 1.1s).
  `figcaption` abajo con degradado `linear-gradient(0deg, rgba(6,6,7,.85), transparent)`,
  título en Bodoni `1.25rem` + número/etiqueta (ej. "01 / Estilo") en Hanken `0.62rem`/`0.28em`.
- **Variante "inmersiva"** (clase `photos-immersive` en body): la galería pasa a `display:block`
  y cada figura se vuelve full-width alta (`clamp(360px,72vh,760px)`) apiladas. (Tweak opcional.)
- **Responsive (<760px):** galería apilada, figuras `clamp(280px,52vh,460px)`.

### 5. Servicios
- Encabezado: eyebrow "Servicios" → H2 "Lo que hacemos." → lead "Precios fijos. Sin sorpresas…".
- **Lista** (`.svc-list`): borde superior `--line`. Cada fila `.svc` es un `<a>` a la reserva,
  `display:grid; grid-template-columns: auto 1fr auto auto; align-items:center; gap:1.6rem`,
  padding vertical `clamp(1.3rem,2.4vw,2.1rem)`, borde inferior `--line`. Columnas:
  número (Bodoni, `--muted`, "01"…"10") · nombre (Bodoni) · meta (duración, Hanken `--muted`) ·
  precio (Bodoni). Más un "Reservar →" que aparece en hover.
- **Hover de fila:** `padding-left` aumenta a `clamp(14px,2vw,32px)` y un pseudo-elemento de
  fondo (`--accent` a 6% opacidad) crece de 0 a 100% ancho (transición .5s). El "Reservar →"
  pasa de opacidad 0 a 1 deslizándose.
- **Datos de servicios** (orden, nombre, precio, duración) — implementar como data, no hardcode:
  | # | Nombre | Precio | Duración |
  |---|---|---|---|
  | 01 | Royal Package | $115 | 1 h |
  | 02 | Haircut | $49 | 30 min |
  | 03 | King Shave | $45 | 30 min |
  | 04 | Balding Head Shave | $50 | 30 min |
  | 05 | Beard Trim | $25 | 30 min |
  | 06 | Black Mask | $20 | 5 min |
  | 07 | Nourishing / Purifying Detox Mask | $20 | 15 min |
  | 08 | Ear Wax | $15 | 5 min |
  | 09 | Nose Wax | $15 | 5 min |
  | 10 | Eyebrow Wax | $15 | 5 min |
- Botón "Reservar ahora →" centrado al final.
- **Responsive (<680px):** grid a 3 columnas (número, nombre+meta, precio); ocultar "Reservar →".

### 6. Visítanos
- **Layout:** `min-height:92svh`, flex centrado vertical. Fondo foto **storefront.jpg**
  (`object-position:center 38%`, filtro `contrast(1.05) brightness(.7)`, altura 118%) con
  degradados: `linear-gradient(90deg, rgba(6,6,7,.92), rgba(6,6,7,.55) 48%, transparent)` +
  `linear-gradient(0deg, var(--ink), transparent 40%)`.
- **Tarjeta** (max 560px, izquierda): eyebrow "Visítanos" → H2 "Pásate por el club." →
  grid 2×2 de info (Dirección / Horario / Reservas / Contacto: clave en Hanken `0.64rem`/upper
  `--muted`, valor en Bodoni `1.05rem`) → botón ghost "Cómo llegar →".

### 7. CTA
- `min-height:70svh`, centrado, texto centrado. Fondo foto **cut-detail.jpg**
  (`grayscale(.3) brightness(.4)`) con viñeta radial
  `radial-gradient(120% 100% at 50% 50%, transparent, rgba(8,8,9,.55) 70%, var(--ink))`.
- Eyebrow centrado "Sin cuenta necesaria" → H2 "¿Listo?<br>Reserva tu cita."
  (`clamp(2.6rem,7vw,6rem)`) → botón sólido "Reservar online →".

### 8. Footer
- Borde superior `--line`. Bloque superior flex `space-between`: a la izquierda marca
  "Brothers Club" en Bodoni `2.2rem` + "Barbershop · Est. 2026"; a la derecha columnas de
  links (Navegar / Síguenos). Bloque inferior con borde superior: "© 2026 Brothers Club
  Barbershop" y "Reserva online" (Hanken `0.7rem`/upper/`--muted`).

---

## Interactions & Behavior
- **Scroll reveal:** elementos con `[data-reveal]` empiezan en `opacity:0; translateY(26px)` y
  pasan a visibles al entrar en viewport (IntersectionObserver, threshold `0.12`,
  `rootMargin: 0px 0px -8% 0px`). `[data-delay="1|2|3"]` escalona `0.1/0.2/0.3s`. Transición
  `1s` con el easing estándar. Respeta `prefers-reduced-motion` (muestra todo sin animar).
- **Nav scrolled:** toggle de clase según `scrollY > 40` (ver Nav).
- **Parallax:** elementos `[data-parallax="<speed>"]` (hero `.18`, visit `.12`, cta `.1`)
  desplazan su `<img>` interno con `translate3d(0, offset, 0)` según la posición del centro del
  elemento respecto al viewport, vía `requestAnimationFrame` en scroll. Desactivado con
  `prefers-reduced-motion`.
- **Sello:** rotación CSS infinita (26s). Desactivada con reduced-motion.
- **Hovers:** botones (sólido↔ghost se invierten; flecha `→` se desplaza 5px), filas de
  servicio (fondo + padding), figuras de galería (zoom + desaturar a color), nav links
  (underline). Todas con el easing estándar.
- **Smooth scroll** entre anclas (`html { scroll-behavior:smooth }`) — los links del nav
  apuntan a `#servicios`, `#espacio`, `#visitanos`, `#reservar`.
- **Grano de película opcional:** body con clase `.grain` aplica un overlay SVG de ruido fijo
  (`opacity:.05; mix-blend-mode:overlay`).

## State Management
La landing es estática (sin estado de datos). Lo único dinámico:
- Render de la lista de servicios a partir del array de datos (ver tabla).
- Toggle de clase del nav según scroll.
- IntersectionObserver para reveals + rAF para parallax.

En el codebase real, los CTAs "Reservar" deben enrutar al flujo de reserva existente
(`/reservar`). El panel de "Tweaks" del prototipo (`source/tweaks-app.jsx`) es solo una
herramienta de exploración de diseño — **no portarlo a producción**; sirve para ver variantes
de fuente, acento, tratamiento de foto, grano y titular.

## Assets
Fotos del cliente (mismas que el sitio actual, reutilizadas). En este bundle van en
`source/media/`:
- `portrait.jpg` — barbero + cliente frente al espejo (1024×682) → fondo del hero.
- `workstation.jpg` — estación/sillón con herramientas (vertical) → galería fig A.
- `coffee.jpg` — cafetera + planta (vertical) → galería fig B.
- `cut-detail.jpg` — degradado en la nuca (vertical) → galería fig C + fondo CTA.
- `storefront.jpg` — fachada "Brothers Club Barbershop" (vertical) → fondo Visítanos.

Usar los originales en alta resolución del repo. No hay iconos; las flechas son el carácter "→".

## Contenido / Copy
Todo en español. Los textos exactos están en el HTML. **Placeholders a reemplazar** en
*Visítanos*: Dirección ("Av. Principal 1024, Local 3 · Florida"), Horario
("Lun–Sáb 9:00–20:00, Dom cerrado"), Contacto ("hola@brothersclub.co"). Sustituir por los
datos reales del negocio.

## Files
- `rebrand.html` — prototipo final autocontenido (referencia visual + interacciones).
- `source/app.css` — todos los estilos y tokens (fuente de verdad legible).
- `source/app.js` — render de servicios + scroll reveal + nav + parallax.
- `source/tweaks-app.jsx` + `source/tweaks-panel.jsx` — panel de exploración (NO producción).
- `source/media/` — las 5 fotos.
