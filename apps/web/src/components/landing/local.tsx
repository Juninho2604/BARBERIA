import Image from "next/image";

const GRID = [
  {
    src: "/photos/storefront.jpg",
    alt: "Fachada de Brothers Club Barbershop",
    caption: "La fachada",
  },
  {
    src: "/photos/workstation.jpg",
    alt: "Sillón, carrito vintage de herramientas y radio Layrite",
    caption: "Cada herramienta",
  },
  {
    src: "/photos/coffee.jpg",
    alt: "Cafetera y planta — esquina de bienvenida",
    caption: "Café mientras esperas",
  },
  {
    src: "/photos/cut-detail.jpg",
    alt: "Detalle de un fade sobre cabello rizado",
    caption: "Precisión",
  },
];

export function Local() {
  return (
    <section
      id="el-espacio"
      className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — El espacio —
        </p>
        <h2 className="mt-4 max-w-2xl text-4xl font-light leading-[1.05] tracking-tight sm:text-5xl">
          Editorial, masculino,
          <br />
          sin prisa.
        </h2>
        <p className="mt-4 max-w-xl text-[color:var(--color-fg-muted)]">
          Un local pensado al detalle. Tu corte empieza desde que cruzas la puerta.
        </p>

        {/* Hero del local — retrato del corte en el espejo (formato horizontal) */}
        <figure className="mt-16 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)]">
          <div className="relative aspect-[3/2] w-full">
            <Image
              src="/photos/portrait.jpg"
              alt="Cliente sentado en el sillón, barbero peinando — reflejo en espejo"
              fill
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
              priority={false}
            />
          </div>
          <figcaption className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-5 py-4 text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
            Cada corte, una conversación.
          </figcaption>
        </figure>

        {/* Grid 4×1 (desktop) / 2×2 (mobile) */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {GRID.map((p) => (
            <figure
              key={p.src}
              className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)]"
            >
              <div className="relative aspect-[2/3] w-full">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 1024px) 256px, 50vw"
                  className="object-cover transition duration-500 hover:scale-[1.02]"
                />
              </div>
              <figcaption className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-3 text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                — {p.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
