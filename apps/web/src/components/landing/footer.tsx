import Image from "next/image";

/**
 * Footer — bloque superior con logo (decisión del cliente: mantenemos el
 * SVG de la marca) a la izquierda y dos columnas de links a la derecha.
 * Bloque inferior con copyright y enlace a la reserva.
 */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bc-footer">
      <div className="bc-footer__top">
        <div className="bc-footer__brand">
          <Image
            src="/brand/logo-combinado-inverso.svg"
            alt="Brothers Club Barbershop"
            width={1125}
            height={411}
            className="h-10 w-auto"
          />
        </div>
        <div className="bc-footer__cols">
          <div className="bc-footer__col">
            <h4>Navegar</h4>
            <a href="#servicios">Servicios</a>
            <a href="#espacio">El Espacio</a>
            <a href="#visitanos">Visítanos</a>
            <a href="/reservar">Reservar</a>
          </div>
          <div className="bc-footer__col">
            <h4>Síguenos</h4>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="TikTok">TikTok</a>
            <a href="#" aria-label="WhatsApp">WhatsApp</a>
          </div>
        </div>
      </div>
      <div className="bc-footer__bot">
        <span>© {year} Brothers Club Barbershop</span>
        <a href="/reservar">
          <span>Reserva online</span>
        </a>
      </div>
    </footer>
  );
}
