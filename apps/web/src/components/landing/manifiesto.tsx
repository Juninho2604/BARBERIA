/**
 * Manifiesto — sección centrada con eyebrow, H2 grande y párrafo lead.
 * Línea vertical decorativa al final. Sin foto.
 */
export function Manifiesto() {
  return (
    <section className="bc-section bc-manifesto">
      <div className="bc-wrap">
        <p className="bc-eyebrow is-center" data-reveal>
          El oficio
        </p>
        <h2 className="bc-display" data-reveal data-delay="1">
          No es solo un corte. Es la hora que reservas para ti.
        </h2>
        <p data-reveal data-delay="2">
          Cuchilla, tijera y tiempo. En Brothers Club cada visita es un ritual
          sin prisa: el respaldo reclinado, la toalla caliente y un acabado que
          se nota. Te vas como entraste, pero mejor.
        </p>
        <div className="bc-rule" data-reveal data-delay="2" />
      </div>
    </section>
  );
}
