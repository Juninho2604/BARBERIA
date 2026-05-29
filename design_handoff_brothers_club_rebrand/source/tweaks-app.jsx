/* ============ Brothers Club — Tweaks island ============ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "displayFont": "Bodoni Moda",
  "accent": "Mono",
  "photos": "Framed",
  "grain": true,
  "headline": "Tu corte,|a tu hora."
}/*EDITMODE-END*/;

const FONT_MAP = {
  "Bodoni Moda": "'Bodoni Moda', Georgia, serif",
  "Cormorant": "'Cormorant Garamond', Georgia, serif",
  "Playfair": "'Playfair Display', Georgia, serif"
};
const ACCENT_MAP = {
  "Mono": "#f1ede4",
  "Brass": "#b9925a",
  "Petrol": "#4d7a82"
};
const HEADLINES = {
  "Tu corte, a tu hora.": "Tu corte,|a tu hora.",
  "El club del buen corte.": "El club del|buen corte.",
  "Entra, relájate, sal mejor.": "Entra, relájate,|sal mejor."
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--serif', FONT_MAP[t.displayFont] || FONT_MAP['Bodoni Moda']);
    root.style.setProperty('--accent', ACCENT_MAP[t.accent] || ACCENT_MAP['Mono']);
    document.body.classList.toggle('photos-immersive', t.photos === 'Immersive');
    document.body.classList.toggle('grain', !!t.grain);
    const h = document.getElementById('heroTitle');
    if (h && t.headline) {
      const parts = String(t.headline).split('|');
      h.innerHTML = parts[0] + (parts[1] ? '<br><em>' + parts[1] + '</em>' : '');
    }
  }, [t]);

  // current headline label for the select
  const headlineLabel = Object.keys(HEADLINES).find(k => HEADLINES[k] === t.headline) || Object.keys(HEADLINES)[0];

  return (
    <TweaksPanel>
      <TweakSection label="Tipografía" />
      <TweakSelect label="Fuente display" value={t.displayFont}
        options={["Bodoni Moda", "Cormorant", "Playfair"]}
        onChange={(v) => setTweak('displayFont', v)} />

      <TweakSection label="Marca" />
      <TweakColor label="Acento" value={ACCENT_MAP[t.accent]}
        options={[ACCENT_MAP.Mono, ACCENT_MAP.Brass, ACCENT_MAP.Petrol]}
        onChange={(v) => {
          const name = Object.keys(ACCENT_MAP).find(k => ACCENT_MAP[k] === v) || 'Mono';
          setTweak('accent', name);
        }} />

      <TweakSection label="Fotografía" />
      <TweakRadio label="Tratamiento" value={t.photos}
        options={["Framed", "Immersive"]}
        onChange={(v) => setTweak('photos', v)} />
      <TweakToggle label="Grano de película" value={t.grain}
        onChange={(v) => setTweak('grain', v)} />

      <TweakSection label="Copy" />
      <TweakSelect label="Titular" value={headlineLabel}
        options={Object.keys(HEADLINES)}
        onChange={(v) => setTweak('headline', HEADLINES[v])} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<App />);
