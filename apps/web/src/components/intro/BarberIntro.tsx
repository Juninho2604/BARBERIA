'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * BarberIntro — intro 3D "gira para entrar".
 * Carga un modelo real de silla de barbero (`/models/barber-chair.glb`) flotando
 * en el espacio. Al completar `unlockTurns` vueltas arrastrando, hace un dolly de
 * cámara y llama a onEnter().
 *
 * Notas de render:
 *  - El GLB trae materiales PBR (Leather / Metal / Plastic) con baseColor,
 *    metallic-roughness y normal maps. RoomEnvironment (PMREM) alimenta los
 *    reflejos del cromo.
 *  - El modelo viene en Z-up y en unidades grandes (~1000): se reorienta a Y-up,
 *    se recentra en el origen y se escala a una altura objetivo.
 *  - Sombras suaves PCF + shadowCatcher en el suelo.
 *  - El anillo de progreso muestra primero la descarga del .glb (3.7 MB) y luego
 *    el avance del giro.
 */
export default function BarberIntro({
  onEnter,
  unlockTurns = 1,
}: {
  onEnter?: () => void;
  unlockTurns?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const root = rootRef.current!;

    const STAR_COLOR = 0xf1ede4; // bone (brand v2)
    const TARGET_HEIGHT = 3.0; // altura del modelo en unidades de escena
    const FLOAT_Y = 1.4; // centro vertical del modelo flotando

    // ---------- RENDERER ----------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const CAM_Z = 6.4;
    camera.position.set(0, 1.55, CAM_Z);
    camera.lookAt(0, FLOAT_Y, 0);

    // ---------- ENVIRONMENT (reflejos cromados) ----------
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    const disposables: Array<{ dispose: () => void }> = [];

    // ---------- WRAP DE LA SILLA (se rellena al cargar el GLB) ----------
    const chairWrap = new THREE.Group(); // rota en Y con el arrastre
    chairWrap.position.y = FLOAT_Y;
    scene.add(chairWrap);
    let model: THREE.Object3D | null = null;
    let modelBottom = -0.1; // se recalcula al cargar; sitúa el shadowCatcher
    let logoPlanes: THREE.Mesh[] = [];
    let logoAssets: { tex: THREE.Texture; geo: THREE.BufferGeometry; mat: THREE.Material } | null = null;

    // ---------- SUELO INVISIBLE PARA SOMBRA ----------
    const floorGeo = new THREE.CircleGeometry(8, 64);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    disposables.push(floorGeo, floorMat);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.25;
    floor.receiveShadow = true;
    scene.add(floor);

    // ---------- ESTRELLAS (FONDO) ----------
    const starGeo = new THREE.BufferGeometry();
    disposables.push(starGeo);
    const N = 900;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 14 + Math.random() * 26;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(ph) * Math.cos(th);
      positions[i * 3 + 1] = r * Math.cos(ph);
      positions[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
      color: STAR_COLOR,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });
    disposables.push(starMat);
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---------- LUCES (paleta neutra, brand monocromática) ----------
    scene.add(new THREE.HemisphereLight(0xcfcfcf, 0x0a0a0a, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(5, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xececec, 1.2);
    rim.position.set(-6, 3, -7);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x1a1a1a, 0.5));

    // ---------- INTERACCIÓN ----------
    const TARGET = Math.PI * 2 * unlockTurns;
    const R = 54, CIRC = 2 * Math.PI * R;
    let total = 0, vel = 0, dragging = false, lastX = 0, unlocked = false;
    let ready = false; // true cuando el GLB ya cargó
    let transitionT = 0, transitioning = false, raf = 0;
    const t0 = performance.now();

    const setProgress = (p: number) => {
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(CIRC * (1 - Math.min(Math.max(p, 0), 1)));
    };
    const px = (e: PointerEvent | TouchEvent) =>
      'touches' in e ? e.touches[0]!.clientX : (e as PointerEvent).clientX;

    const onDown = (e: PointerEvent | TouchEvent) => { if (!ready) return; dragging = true; lastX = px(e); vel = 0; };
    const onMove = (e: PointerEvent | TouchEvent) => {
      if (!dragging || unlocked || !ready) return;
      const x = px(e); const d = (x - lastX) * 0.011; lastX = x;
      chairWrap.rotation.y += d; vel = d; total += Math.abs(d);
      const p = total / TARGET; setProgress(p);
      if (labelRef.current && p > 0.04 && p < 0.97) {
        labelRef.current.textContent = 'Seguí girando';
        if (subRef.current) subRef.current.textContent = Math.round(p * 100) + '%';
      }
      if (p >= 1) unlock();
    };
    const onUp = () => { dragging = false; };

    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      transitioning = true;
      if (labelRef.current) labelRef.current.textContent = '';
      if (subRef.current) subRef.current.textContent = '';
      root.style.setProperty('--ui-op', '0');
      setTimeout(() => {
        root.style.opacity = '0';
        root.style.pointerEvents = 'none';
        setTimeout(() => onEnterRef.current?.(), 600);
      }, 260);
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);

    const resize = () => {
      const w = root.clientWidth, h = root.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    resize();

    // ---------- CARGA DEL MODELO ----------
    if (labelRef.current) labelRef.current.textContent = 'Cargando';
    if (subRef.current) subRef.current.textContent = '0%';

    const loader = new GLTFLoader();
    let disposed = false;
    loader.load(
      '/models/barber-chair.glb',
      (gltf) => {
        if (disposed) return;
        const root3d = gltf.scene;

        // El modelo ya viene Y-up: no hace falta reorientar el eje.
        root3d.updateMatrixWorld(true);

        // Recentrar + escalar a altura objetivo.
        const box = new THREE.Box3().setFromObject(root3d);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const s = TARGET_HEIGHT / (size.y || 1);
        root3d.scale.setScalar(s);
        root3d.position.set(-center.x * s, -center.y * s, -center.z * s);
        modelBottom = FLOAT_Y - (size.y * s) / 2;
        floor.position.y = modelBottom - 0.05;

        // Sombras + realce de reflejos.
        root3d.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            const m = mat as THREE.MeshStandardMaterial;
            if (m && 'envMapIntensity' in m) {
              m.envMapIntensity = 1.15;
              m.needsUpdate = true;
            }
          }
        });

        model = root3d;
        chairWrap.add(root3d);

        // Logo en el espaldar (cara delantera y trasera).
        // Cargamos el SVG como CanvasTexture y lo aplicamos a dos planos
        // hijos del `chairWrap` (rotan junto a la silla). El SVG inverso
        // tiene paths blancos sobre transparente → se ve como un grabado
        // sobre el cuero negro del respaldo.
        const logoImg = new Image();
        logoImg.onload = () => {
          if (disposed) return;
          const sw = 1024;
          const aspect = 1125 / 411;
          const sh = Math.round(sw / aspect);
          const cnv = document.createElement('canvas');
          cnv.width = sw;
          cnv.height = sh;
          const ctx = cnv.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(logoImg, 0, 0, sw, sh);

          const tex = new THREE.CanvasTexture(cnv);
          tex.colorSpace = THREE.SRGBColorSpace;
          try { tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); } catch { /* noop */ }
          tex.needsUpdate = true;

          const planeW = 0.62;
          const planeH = planeW / aspect;
          const planeGeo = new THREE.PlaneGeometry(planeW, planeH);
          const planeMat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
            opacity: 0.95,
          });

          // Cara trasera del respaldo (visible desde +Z)
          const planeBack = new THREE.Mesh(planeGeo, planeMat);
          planeBack.position.set(0, 0.55, 0.42);
          chairWrap.add(planeBack);

          // Cara delantera del respaldo (visible desde -Z)
          const planeFront = new THREE.Mesh(planeGeo, planeMat);
          planeFront.position.set(0, 0.55, -0.42);
          planeFront.rotation.y = Math.PI;
          chairWrap.add(planeFront);

          logoPlanes = [planeBack, planeFront];
          logoAssets = { tex, geo: planeGeo, mat: planeMat };
        };
        logoImg.onerror = () => { /* sin logo si falla */ };
        logoImg.src = '/brand/logo-combinado-inverso.svg';

        // Listo: el anillo pasa a medir el giro.
        ready = true;
        total = 0;
        setProgress(0);
        if (labelRef.current) labelRef.current.textContent = 'Gírala para entrar';
        if (subRef.current) subRef.current.textContent = 'Arrastra con el dedo';
      },
      (ev) => {
        if (ev.total > 0) {
          const p = ev.loaded / ev.total;
          setProgress(p);
          if (subRef.current) subRef.current.textContent = Math.round(p * 100) + '%';
        }
      },
      () => {
        if (labelRef.current) labelRef.current.textContent = 'No se pudo cargar';
        if (subRef.current) subRef.current.textContent = 'Pulsa “Saltar intro”';
      },
    );

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = (performance.now() - t0) / 1000;
      if (!dragging && !unlocked) chairWrap.rotation.y += 0.0028;
      if (!dragging && Math.abs(vel) > 0.0001 && !unlocked && ready) {
        chairWrap.rotation.y += vel;
        total += Math.abs(vel);
        vel *= 0.94;
        setProgress(total / TARGET);
        if (total / TARGET >= 1) unlock();
      }
      chairWrap.position.y = FLOAT_Y + Math.sin(t * 0.9) * 0.04;
      stars.rotation.y += 0.0004;
      if (transitioning) {
        transitionT = Math.min(transitionT + 0.02, 1);
        const e = transitionT * transitionT * (3 - 2 * transitionT);
        camera.position.z = CAM_Z + (2.1 - CAM_Z) * e;
        chairWrap.scale.setScalar(1 + 0.18 * e);
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      if (model) {
        model.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of mats) {
            const m = mat as THREE.MeshStandardMaterial;
            m.map?.dispose();
            m.normalMap?.dispose();
            m.roughnessMap?.dispose();
            m.metalnessMap?.dispose();
            m.aoMap?.dispose();
            m.emissiveMap?.dispose();
            m.dispose();
          }
        });
      }
      // Limpia los planos del logo y su CanvasTexture.
      logoPlanes.forEach((p) => p.removeFromParent());
      if (logoAssets) {
        logoAssets.tex.dispose();
        logoAssets.geo.dispose();
        logoAssets.mat.dispose();
      }
      envRT.dispose();
      pmrem.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [unlockTurns]);

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a0b',
        transition: 'opacity .7s ease',
        // @ts-expect-error CSS var
        '--ui-op': 1,
      }}
    >
      <style>{`@keyframes barber-spin { to { transform: rotate(360deg); } }`}</style>

      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}
      />

      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingBottom: 54,
          pointerEvents: 'none', opacity: 'var(--ui-op)' as unknown as number, transition: 'opacity .5s ease',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        <div style={{ position: 'relative', width: 64, height: 64, display: 'grid', placeItems: 'center' }}>
          <svg width="64" height="64" viewBox="0 0 118 118" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="59" cy="59" r="54" fill="none" stroke="rgba(233,226,210,.18)" strokeWidth="2" />
            <circle
              ref={ringRef}
              cx="59" cy="59" r="54" fill="none" stroke="#f1ede4" strokeWidth="4"
              strokeLinecap="round" strokeDasharray="339.3" strokeDashoffset="339.3"
              style={{ transition: 'stroke-dashoffset .12s linear' }}
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: 14, color: '#e9e2d2', animation: 'barber-spin 3.4s linear infinite' }}>↻</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div ref={labelRef} style={{ fontSize: 10, letterSpacing: '.26em', textTransform: 'uppercase', color: '#e9e2d2' }}>Cargando</div>
          <div ref={subRef} style={{ marginTop: 6, fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: '#9c968a' }}>0%</div>
        </div>
      </div>

      {/* Botón "Saltar intro" — discreto, esquina inferior derecha */}
      <button
        type="button"
        onClick={() => onEnterRef.current?.()}
        style={{
          position: 'absolute', bottom: 22, right: 22,
          background: 'transparent',
          border: '1px solid rgba(233,226,210,.18)',
          color: 'rgba(233,226,210,.6)',
          padding: '6px 12px',
          fontSize: 10,
          letterSpacing: '.22em',
          textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          cursor: 'pointer',
          borderRadius: 4,
        }}
      >
        Saltar intro
      </button>
    </div>
  );
}
