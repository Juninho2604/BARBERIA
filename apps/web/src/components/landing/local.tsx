import Image from "next/image";

/**
 * El Espacio — galería editorial en grid 12-col asimétrico (design handoff):
 *  - fig--a (cols 1/6, span 6 rows) → workstation
 *  - fig--b (cols 6/13, span 4 rows) → coffee
 *  - fig--c (cols 6/13, span 4 rows) → cut-detail
 *
 * Cada foto en grayscale tenue + brillo bajo; en hover vuelve a color con
 * leve zoom (controlado por `.bc-fig:hover`). Captions con título Bodoni y
 * número/etiqueta Hanken sobre degradado de abajo a arriba.
 *
 * En móvil (<760px) la galería pasa a stack vertical.
 */
const FIGS = [
  { src: "/photos/workstation.jpg", title: "La estación", number: "01 / Estilo",   class: "bc-fig--a" },
  { src: "/photos/coffee.jpg",      title: "La espera",   number: "02 / Café",    class: "bc-fig--b" },
  { src: "/photos/cut-detail.jpg",  title: "El acabado",  number: "03 / Detalle", class: "bc-fig--c" },
];

export function Local() {
  return (
    <section className="bc-section" id="espacio">
      <div className="bc-wrap">
        <div className="bc-espacio__head">
          <div>
            <p className="bc-eyebrow" data-reveal>
              El espacio
            </p>
            <h2 className="bc-display" data-reveal data-delay="1">
              Un lugar hecho para quedarse.
            </h2>
          </div>
          <p className="bc-lead" data-reveal data-delay="2">
            Material profesional, café recién hecho y una silla con tu nombre.
            El detalle está en cada esquina.
          </p>
        </div>

        <div className="bc-gallery">
          {FIGS.map((f, i) => (
            <figure
              key={f.src}
              className={`bc-fig ${f.class}`}
              data-reveal
              data-delay={i > 0 ? String(i) : undefined}
            >
              <Image
                src={f.src}
                alt={f.title}
                fill
                sizes="(min-width: 760px) 50vw, 100vw"
                className="bc-fig__img"
              />
              <figcaption>
                <span className="bc-fig__t">{f.title}</span>
                <span className="bc-fig__n">{f.number}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
