import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Helpers de navegación locale-aware. Sustituyen a `next/link` y
 * `next/navigation` en componentes que cambian de ruta — preservan el
 * locale del usuario sin tener que reconstruir la URL a mano.
 *
 * Ej.: <Link href="/reservar"> en /es → renderiza "/es/reservar".
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
