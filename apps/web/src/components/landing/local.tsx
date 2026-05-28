import Image from "next/image";

/**
 * Galería silente — tres fotos verticales del local en tira, sin títulos
 * ni captions. Funciona como ritmo visual entre el hero y los servicios,
 * no como sección expositiva.
 */
const PHOTOS = [
  { src: "/photos/workstation.jpg", alt: "Carrito vintage y sillón de barbero" },
  { src: "/photos/coffee.jpg", alt: "Cafetera y planta junto a la entrada" },
  { src: "/photos/cut-detail.jpg", alt: "Detalle de un fade sobre cabello rizado" },
];

export function Local() {
  return (
    <section
      aria-label="El espacio"
      className="border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          {PHOTOS.map((p) => (
            <div
              key={p.src}
              className="relative aspect-[2/3] overflow-hidden bg-[color:var(--color-surface)]"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width: 1024px) 360px, 100vw"
                className="object-cover transition duration-700 hover:scale-[1.02]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
