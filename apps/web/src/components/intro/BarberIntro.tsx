'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * BarberIntro — intro 3D "gira para entrar".
 * Silla de barbero realista (cuero negro + cromo pulido) flotando en el espacio.
 * Al completar `unlockTurns` vueltas arrastrando, hace un dolly de cámara y llama a onEnter().
 *
 * Notas de render:
 *  - MeshPhysicalMaterial para el cuero con clearcoat + sheen (brillo de roce).
 *  - Cromo metalness=1 + roughness baja + RoomEnvironment para reflejos.
 *  - Sombras suaves PCF + shadowCatcher en el suelo.
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

    // ---------- PALETA ----------
    const COL = {
      leather: 0x0d0e10,       // cuero negro profundo
      leatherSeam: 0x040506,   // costuras / canales
      chrome: 0xdde1e6,        // cromo brillante
      brushed: 0x9aa0a6,       // metal cepillado
      bronze: 0x3b3e43,        // anillos oscuros
      star: 0xe9e2d2,
    };

    // ---------- RENDERER ----------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const CAM_Z = 6.4;
    camera.position.set(0, 1.55, CAM_Z);
    camera.lookAt(0, 1.55, 0);

    // ---------- ENVIRONMENT (reflejos cromados) ----------
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    // ---------- MATERIALES ----------
    const leather = new THREE.MeshPhysicalMaterial({
      color: COL.leather,
      roughness: 0.48,
      metalness: 0.0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.55,
      sheen: 0.35,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(0x4a3b25),
      envMapIntensity: 0.55,
    });
    const leatherSeam = new THREE.MeshStandardMaterial({
      color: COL.leatherSeam,
      roughness: 0.78,
      metalness: 0.0,
      envMapIntensity: 0.3,
    });
    const chrome = new THREE.MeshStandardMaterial({
      color: COL.chrome,
      roughness: 0.16,
      metalness: 1.0,
      envMapIntensity: 1.45,
    });
    const brushed = new THREE.MeshStandardMaterial({
      color: COL.brushed,
      roughness: 0.42,
      metalness: 0.9,
      envMapIntensity: 0.85,
    });
    const bronze = new THREE.MeshStandardMaterial({
      color: COL.bronze,
      roughness: 0.55,
      metalness: 0.7,
      envMapIntensity: 0.55,
    });

    const disposables: Array<THREE.BufferGeometry | THREE.Material> = [
      leather, leatherSeam, chrome, brushed, bronze,
    ];

    // ---------- HELPERS ----------
    function box(w: number, h: number, d: number, mat: THREE.Material, segs = 1) {
      const g = new THREE.BoxGeometry(w, h, d, segs, segs, segs);
      disposables.push(g);
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }
    function cyl(rt: number, rb: number, h: number, s: number, mat: THREE.Material) {
      const g = new THREE.CylinderGeometry(rt, rb, h, s);
      disposables.push(g);
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }
    function sphere(r: number, mat: THREE.Material) {
      const g = new THREE.SphereGeometry(r, 24, 18);
      disposables.push(g);
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      return m;
    }
    function torus(r: number, t: number, mat: THREE.Material) {
      const g = new THREE.TorusGeometry(r, t, 12, 96);
      disposables.push(g);
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      return m;
    }

    // Pillow: abomba un Box -> cuero relleno (ya estaba en el original; ajusto subdivisiones)
    function pillow(
      w: number, h: number, d: number, t: number,
      mat: THREE.Material, bias?: { top?: number },
    ) {
      const top = bias?.top ?? 0;
      const g = new THREE.BoxGeometry(w, h, d, 28, 28, 28);
      disposables.push(g);
      const p = g.attributes.position as THREE.BufferAttribute;
      const hw = w / 2, hh = h / 2, hd = d / 2;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) / hw, y = p.getY(i) / hh, z = p.getZ(i) / hd;
        const sx = x * Math.sqrt(1 - y * y / 2 - z * z / 2 + y * y * z * z / 3);
        const sy = y * Math.sqrt(1 - z * z / 2 - x * x / 2 + z * z * x * x / 3);
        const sz = z * Math.sqrt(1 - x * x / 2 - y * y / 2 + x * x * y * y / 3);
        let nx = x + (sx - x) * t, ny = y + (sy - y) * t, nz = z + (sz - z) * t;
        if (top) ny += (1 - y * y) * (1 - x * x) * (1 - z * z) * top * (y > 0 ? 1 : 0.25);
        p.setXYZ(i, nx * hw, ny * hh, nz * hd);
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }

    // Cojín capitoné — pequeños hoyuelos en una rejilla sobre la cara superior.
    function tuftedCushion(
      w: number, h: number, d: number, mat: THREE.Material,
      rows = 3, cols = 3, depthAmt = 0.06,
    ) {
      const g = new THREE.BoxGeometry(w, h, d, 56, 24, 56);
      disposables.push(g);
      const p = g.attributes.position as THREE.BufferAttribute;
      const hw = w / 2, hh = h / 2, hd = d / 2;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const nx = x / hw, ny = y / hh, nz = z / hd;
        // Abombado general
        const sx = nx * Math.sqrt(1 - ny * ny / 2 - nz * nz / 2 + ny * ny * nz * nz / 3);
        const sy = ny * Math.sqrt(1 - nz * nz / 2 - nx * nx / 2 + nz * nz * nx * nx / 3);
        const sz = nz * Math.sqrt(1 - nx * nx / 2 - ny * ny / 2 + nx * nx * ny * ny / 3);
        const t = 0.5;
        let fx = nx + (sx - nx) * t, fy = ny + (sy - ny) * t, fz = nz + (sz - nz) * t;
        // Hoyuelos en la cara frontal del respaldo (la "alta" del cojín)
        if (ny > 0.55) {
          const u = (x / hw + 1) / 2;
          const v = (z / hd + 1) / 2;
          const su = Math.sin(u * Math.PI * cols);
          const sv = Math.sin(v * Math.PI * rows);
          fy -= Math.abs(su * sv) * depthAmt / hh;
        }
        p.setXYZ(i, fx * hw, fy * hh, fz * hd);
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }

    // ---------- SILLA ----------
    const chair = new THREE.Group();

    // Base — pedestal grueso con anillo bronze y disco cromado superior
    const base = cyl(0.88, 0.98, 0.13, 64, brushed);
    base.position.y = 0.065;
    chair.add(base);
    const baseGroove = cyl(0.86, 0.86, 0.018, 64, bronze);
    baseGroove.position.y = 0.105;
    chair.add(baseGroove);
    const baseDisc = cyl(0.78, 0.86, 0.05, 64, chrome);
    baseDisc.position.y = 0.155;
    chair.add(baseDisc);

    // Hidráulico — cilindro doble (camisa + plunger) con anillos
    const pumpOuter = cyl(0.22, 0.26, 0.42, 32, chrome);
    pumpOuter.position.y = 0.38;
    chair.add(pumpOuter);
    const pumpInner = cyl(0.145, 0.145, 0.74, 32, chrome);
    pumpInner.position.y = 0.92;
    chair.add(pumpInner);
    for (const y of [0.28, 0.45, 0.66, 0.86, 1.08, 1.22]) {
      const r = cyl(0.151, 0.151, 0.012, 32, bronze);
      r.position.y = y;
      chair.add(r);
    }

    // Palanca de bombeo
    const lever = cyl(0.022, 0.022, 0.42, 16, chrome);
    lever.rotation.z = Math.PI / 2;
    lever.position.set(0.36, 0.40, 0);
    chair.add(lever);
    const leverKnob = sphere(0.05, chrome);
    leverKnob.position.set(0.58, 0.40, 0);
    chair.add(leverKnob);
    const leverMount = cyl(0.045, 0.05, 0.06, 16, brushed);
    leverMount.rotation.z = Math.PI / 2;
    leverMount.position.set(0.22, 0.40, 0);
    chair.add(leverMount);

    // Soporte del asiento (plato circular brushed + aro cromado)
    const seatPlate = cyl(0.46, 0.46, 0.06, 32, brushed);
    seatPlate.position.y = 1.32;
    chair.add(seatPlate);
    const seatRim = torus(0.46, 0.02, chrome);
    seatRim.rotation.x = Math.PI / 2;
    seatRim.position.y = 1.34;
    chair.add(seatRim);

    // Asiento — pillow abombado con leve top + costura perimetral oscura
    const seat = pillow(0.9, 0.24, 0.82, 0.5, leather, { top: 0.07 });
    seat.position.y = 1.50;
    chair.add(seat);
    // Costura (toro fino) marcando el filo superior del cojín del asiento
    {
      const g = new THREE.TorusGeometry(0.44, 0.006, 8, 96);
      disposables.push(g);
      const stitch = new THREE.Mesh(g, leatherSeam);
      stitch.rotation.x = Math.PI / 2;
      stitch.scale.set(1, 0.9, 1);
      stitch.position.y = 1.49;
      chair.add(stitch);
    }

    // Respaldo
    const backPivot = new THREE.Group();
    backPivot.position.set(0, 1.62, -0.36);
    backPivot.rotation.x = 0.20;
    chair.add(backPivot);

    const back = tuftedCushion(0.78, 1.14, 0.24, leather, 3, 3, 0.07);
    back.position.set(0, 0.58, 0.07);
    backPivot.add(back);
    // Trim trasero metálico (estructura interna)
    const backTrim = box(0.82, 1.18, 0.04, brushed);
    backTrim.position.set(0, 0.58, -0.09);
    backPivot.add(backTrim);
    // Costura central vertical del respaldo
    {
      const g = new THREE.BoxGeometry(0.012, 1.0, 0.02);
      disposables.push(g);
      const stitch = new THREE.Mesh(g, leatherSeam);
      stitch.position.set(0, 0.58, 0.20);
      backPivot.add(stitch);
    }

    // Brazo cromado y headrest
    const headJoint = sphere(0.045, chrome);
    headJoint.position.set(0, 1.18, 0.02);
    backPivot.add(headJoint);
    const headArm = cyl(0.018, 0.018, 0.36, 16, chrome);
    headArm.position.set(0, 1.36, 0.02);
    backPivot.add(headArm);
    const headrest = pillow(0.42, 0.26, 0.18, 0.65, leather, { top: 0.06 });
    headrest.position.set(0, 1.62, 0.08);
    backPivot.add(headrest);

    // Reposabrazos: cojín + 2 postes verticales cromados + riel inferior
    for (const x of [-0.55, 0.55]) {
      const arm = pillow(0.18, 0.13, 0.7, 0.7, leather);
      arm.position.set(x, 1.78, 0.02);
      chair.add(arm);
      const postA = cyl(0.025, 0.025, 0.34, 16, chrome);
      postA.position.set(x, 1.55, 0.30);
      chair.add(postA);
      const postB = cyl(0.025, 0.025, 0.34, 16, chrome);
      postB.position.set(x, 1.55, -0.20);
      chair.add(postB);
      const rail = cyl(0.018, 0.018, 0.54, 16, chrome);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(x, 1.38, 0.04);
      chair.add(rail);
    }

    // Footrest: placa cromada + soportes diagonales + barra clásica
    const footPlate = box(0.66, 0.045, 0.22, chrome);
    footPlate.position.set(0, 0.78, 0.78);
    chair.add(footPlate);
    const footPlateLip = box(0.7, 0.018, 0.26, brushed);
    footPlateLip.position.set(0, 0.76, 0.78);
    chair.add(footPlateLip);
    for (const x of [-0.26, 0.26]) {
      const rail = cyl(0.018, 0.018, 0.96, 16, chrome);
      rail.position.set(x, 1.06, 0.60);
      rail.rotation.x = -0.46;
      chair.add(rail);
    }
    const footBar = cyl(0.024, 0.024, 0.66, 16, chrome);
    footBar.rotation.z = Math.PI / 2;
    footBar.position.set(0, 0.62, 1.05);
    chair.add(footBar);

    // Suspensión: el grupo entero queda flotando
    chair.position.y = -1.20;
    const chairWrap = new THREE.Group();
    chairWrap.add(chair);
    scene.add(chairWrap);

    // ---------- SUELO INVISIBLE PARA SOMBRA ----------
    {
      const g = new THREE.CircleGeometry(8, 64);
      disposables.push(g);
      const m = new THREE.ShadowMaterial({ opacity: 0.45 });
      disposables.push(m);
      const floor = new THREE.Mesh(g, m);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.25;
      floor.receiveShadow = true;
      scene.add(floor);
    }

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
      color: COL.star,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.7,
    });
    disposables.push(starMat);
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---------- LUCES ----------
    scene.add(new THREE.HemisphereLight(0x6f86c9, 0x0a0806, 0.35));
    const key = new THREE.DirectionalLight(0xfff0db, 2.2);
    key.position.set(5, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0005;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5c79ff, 1.5);
    rim.position.set(-6, 3, -7);
    scene.add(rim);
    const warm = new THREE.PointLight(0xff7a3c, 0.7, 30);
    warm.position.set(2, 2, 4);
    scene.add(warm);
    scene.add(new THREE.AmbientLight(0x1a1814, 0.45));

    // ---------- INTERACCIÓN ----------
    const TARGET = Math.PI * 2 * unlockTurns;
    const R = 54, CIRC = 2 * Math.PI * R;
    let total = 0, vel = 0, dragging = false, lastX = 0, unlocked = false;
    let transitionT = 0, transitioning = false, raf = 0;
    const t0 = performance.now();

    const setProgress = (p: number) => {
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(CIRC * (1 - Math.min(p, 1)));
    };
    const px = (e: PointerEvent | TouchEvent) =>
      'touches' in e ? e.touches[0]!.clientX : (e as PointerEvent).clientX;

    const onDown = (e: PointerEvent | TouchEvent) => { dragging = true; lastX = px(e); vel = 0; };
    const onMove = (e: PointerEvent | TouchEvent) => {
      if (!dragging || unlocked) return;
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

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = (performance.now() - t0) / 1000;
      if (!dragging && !unlocked) chairWrap.rotation.y += 0.0028;
      if (!dragging && Math.abs(vel) > 0.0001 && !unlocked) {
        chairWrap.rotation.y += vel;
        total += Math.abs(vel);
        vel *= 0.94;
        setProgress(total / TARGET);
        if (total / TARGET >= 1) unlock();
      }
      chair.position.y = -1.20 + Math.sin(t * 0.9) * 0.04;
      stars.rotation.y += 0.0004;
      if (transitioning) {
        transitionT = Math.min(transitionT + 0.02, 1);
        const e = transitionT * transitionT * (3 - 2 * transitionT);
        camera.position.z = CAM_Z + (2.1 - CAM_Z) * e;
        chair.scale.setScalar(1 + 0.18 * e);
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
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
        background: 'radial-gradient(120% 80% at 50% 64%, #1c140f 0%, #0c0908 42%, #050403 100%)',
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
          alignItems: 'center', justifyContent: 'center', gap: 18,
          pointerEvents: 'none', opacity: 'var(--ui-op)' as unknown as number, transition: 'opacity .5s ease',
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        <div style={{ position: 'relative', width: 118, height: 118, display: 'grid', placeItems: 'center' }}>
          <svg width="118" height="118" viewBox="0 0 118 118" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="59" cy="59" r="54" fill="none" stroke="rgba(233,226,210,.18)" strokeWidth="2" />
            <circle
              ref={ringRef}
              cx="59" cy="59" r="54" fill="none" stroke="#ff5a1f" strokeWidth="3"
              strokeLinecap="round" strokeDasharray="339.3" strokeDashoffset="339.3"
              style={{ transition: 'stroke-dashoffset .12s linear' }}
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: 22, color: '#e9e2d2', animation: 'barber-spin 3.4s linear infinite' }}>↻</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div ref={labelRef} style={{ fontSize: 11, letterSpacing: '.26em', textTransform: 'uppercase', color: '#e9e2d2' }}>Gírala para entrar</div>
          <div ref={subRef} style={{ marginTop: 8, fontSize: 9.5, letterSpacing: '.22em', textTransform: 'uppercase', color: '#9c968a' }}>Arrastra con el dedo</div>
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
