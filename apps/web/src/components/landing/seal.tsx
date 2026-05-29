/**
 * Sello giratorio editorial — texto curvo "BROTHERS CLUB · BARBERSHOP · EST. 2026"
 * con monograma "BC" al centro. Elemento decorativo NUEVO (no reemplaza el
 * logo, lo acompaña). Spin 26s lineal infinito (CSS), desactivado con
 * `prefers-reduced-motion`.
 */
export function Seal() {
  return (
    <div className="bc-seal">
      <svg viewBox="0 0 128 128" aria-hidden="true">
        <defs>
          <path
            id="bc-seal-path"
            d="M64,64 m-49,0 a49,49 0 1,1 98,0 a49,49 0 1,1 -98,0"
          />
        </defs>
        <text className="bc-seal__text">
          <textPath href="#bc-seal-path" startOffset="0">
            {"BROTHERS CLUB · BARBERSHOP · EST. 2026 · "}
          </textPath>
        </text>
      </svg>
      <span className="bc-seal__mono">BC</span>
    </div>
  );
}
