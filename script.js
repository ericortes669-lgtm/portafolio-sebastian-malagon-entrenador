document.getElementById("year").textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(pointer: coarse)").matches;

/* ---------- Mobile nav ---------- */
const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Cursor glow ---------- */
const glow = document.querySelector(".cursor-glow");
if (glow && !isTouch) {
  let gx = window.innerWidth / 2, gy = window.innerHeight / 2;
  let tx = gx, ty = gy;
  window.addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; });
  function loopGlow() {
    gx += (tx - gx) * 0.15;
    gy += (ty - gy) * 0.15;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(loopGlow);
  }
  requestAnimationFrame(loopGlow);
}

/* ---------- Tilt cards (real 3D via CSS custom properties) ---------- */
if (!isTouch) {
  document.querySelectorAll(".tilt").forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty("--tilt-x", (px * 10).toFixed(2) + "deg");
      card.style.setProperty("--tilt-y", (py * -10).toFixed(2) + "deg");
    });
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

/* ---------- Magnetic buttons ---------- */
if (!isTouch) {
  document.querySelectorAll(".magnetic").forEach(btn => {
    btn.addEventListener("mousemove", e => {
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
    });
    btn.addEventListener("mouseleave", () => { btn.style.transform = "translate(0,0)"; });
  });
}

/* ---------- Animated counters ---------- */
const counters = document.querySelectorAll(".stat-number");
if (counters.length) {
  const animateCounter = el => {
    const target = parseFloat(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const duration = 1100;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  counters.forEach(c => io.observe(c));
}

/* ================================================================
   Experiencia narrativa: figura humana de partículas guiada por scroll
   ================================================================
   No existe un modelo 3D humano realista aquí (eso requiere un archivo
   .glb modelado en un programa como Blender, que no puedo generar).
   En su lugar, la silueta se construye por código: miles de puntos
   distribuidos dentro de volúmenes simples (cabeza, torso, brazos,
   piernas) que se "ensamblan" cuando el usuario hace scroll — una
   figura estilizada hecha de datos, coherente con el concepto de
   evaluación y medición de la marca.
================================================================= */
(function initStory() {
  const story = document.querySelector(".story");
  const canvas = document.getElementById("story-canvas");
  if (!story || !canvas) return;

  const overlays = Array.from(story.querySelectorAll(".story-overlay"));
  const dots = Array.from(story.querySelectorAll(".story-progress span"));
  const STATES = overlays.length; // 7

  function setActiveState(stateIndex) {
    overlays.forEach(el => {
      el.classList.toggle("active", Number(el.dataset.state) === stateIndex);
    });
    dots.forEach(d => {
      d.classList.toggle("active", Number(d.dataset.dot) === stateIndex);
    });
  }
  setActiveState(1);

  let three = null;
  try {
    if (typeof THREE !== "undefined") three = initThree();
  } catch (err) {
    three = null;
  }
  if (!three) {
    story.classList.add("no-webgl");
  }

  /* ---------- Control de scroll (sticky nativo + matemática de progreso) ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = story.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      let progress = total > 0 ? (-rect.top) / total : 0;
      progress = Math.min(1, Math.max(0, progress));

      story.classList.toggle("scrolled", progress > 0.01);

      const raw = progress * STATES;
      const stateIndex = Math.min(STATES, Math.floor(raw) + 1);
      setActiveState(stateIndex);

      if (three) three.update(progress);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Escena Three.js ---------- */
  function initThree() {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.3, 8);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0x2f4a7a, 0.6);
    scene.add(ambient);
    const key = new THREE.PointLight(0x8fb8ff, 1.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight(0x2f7bff, 1.4, 14);
    rim.position.set(-4, -1, -3);
    scene.add(rim);

    /* ---- Generador procedural de la silueta humana ---- */
    const mobile = window.matchMedia("(max-width:760px)").matches;
    const scale = mobile ? 0.4 : 1;

    function sampleCapsule(a, b, r0, r1, count, out) {
      const A = new THREE.Vector3(...a);
      const B = new THREE.Vector3(...b);
      const dir = new THREE.Vector3().subVectors(B, A).normalize();
      const arbitrary = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(dir, arbitrary).normalize();
      const up2 = new THREE.Vector3().crossVectors(dir, right).normalize();
      for (let i = 0; i < count; i++) {
        const t = Math.random();
        const r = (r0 + (r1 - r0) * t) * (0.75 + Math.random() * 0.25);
        const ang = Math.random() * Math.PI * 2;
        const center = new THREE.Vector3().lerpVectors(A, B, t);
        const p = center
          .addScaledVector(right, Math.cos(ang) * r)
          .addScaledVector(up2, Math.sin(ang) * r * 0.75);
        out.push(p.x, p.y, p.z);
      }
    }
    function sampleSphereShell(center, radius, count, out) {
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = radius * (0.85 + Math.random() * 0.18);
        out.push(
          center[0] + r * Math.sin(phi) * Math.cos(theta),
          center[1] + r * Math.sin(phi) * Math.sin(theta) * 0.85,
          center[2] + r * Math.cos(phi) * 0.85
        );
      }
    }

    const target = [];
    sampleSphereShell([0, 2.12, 0], 0.3, Math.round(140 * scale), target);
    sampleCapsule([0, 1.82, 0], [0, 0.95, 0], 0.4, 0.3, Math.round(480 * scale), target);
    sampleCapsule([0, 0.95, 0], [0, 0.68, 0], 0.3, 0.22, Math.round(150 * scale), target);
    sampleCapsule([0.4, 1.78, 0], [0.6, 1.28, -0.05], 0.13, 0.1, Math.round(110 * scale), target);
    sampleCapsule([-0.4, 1.78, 0], [-0.6, 1.28, -0.05], 0.13, 0.1, Math.round(110 * scale), target);
    sampleCapsule([0.6, 1.28, -0.05], [0.64, 0.76, -0.05], 0.1, 0.07, Math.round(110 * scale), target);
    sampleCapsule([-0.6, 1.28, -0.05], [-0.64, 0.76, -0.05], 0.1, 0.07, Math.round(110 * scale), target);
    sampleCapsule([0.18, 0.66, 0], [0.2, -0.55, 0.05], 0.19, 0.14, Math.round(170 * scale), target);
    sampleCapsule([-0.18, 0.66, 0], [-0.2, -0.55, 0.05], 0.19, 0.14, Math.round(170 * scale), target);
    sampleCapsule([0.2, -0.55, 0.05], [0.19, -1.85, 0.02], 0.13, 0.09, Math.round(170 * scale), target);
    sampleCapsule([-0.2, -0.55, 0.05], [-0.19, -1.85, 0.02], 0.13, 0.09, Math.round(170 * scale), target);
    sampleCapsule([0.19, -1.85, 0.02], [0.19, -1.9, 0.3], 0.09, 0.06, Math.round(60 * scale), target);
    sampleCapsule([-0.19, -1.85, 0.02], [-0.19, -1.9, 0.3], 0.09, 0.06, Math.round(60 * scale), target);

    const count = target.length / 3;
    const start = new Float32Array(target.length);
    const current = new Float32Array(target.length);
    const delays = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 4.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      start[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      start[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6 + 0.4;
      start[i * 3 + 2] = r * Math.cos(phi) * 0.6;
      delays[i] = Math.random() * 0.55;
      current[i * 3] = start[i * 3];
      current[i * 3 + 1] = start[i * 3 + 1];
      current[i * 3 + 2] = start[i * 3 + 2];
    }

    const geo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(current, 3);
    geo.setAttribute("position", posAttr);
    const colors = new Float32Array(target.length);
    const colorAttr = new THREE.BufferAttribute(colors, 3);
    geo.setAttribute("color", colorAttr);

    const mat = new THREE.PointsMaterial({
      size: mobile ? 0.05 : 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geo, mat);
    group.add(points);

    const baseColor = new THREE.Color(0x4a6a9a);
    const activeColor = new THREE.Color(0x6fa3ff);
    const scanColor = new THREE.Color(0xdfeeff);

    function resize() {
      const w = canvas.clientWidth || canvas.parentElement.clientWidth;
      const h = canvas.clientHeight || canvas.parentElement.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    /* ---- Arrastre manual para rotar (sin depender de OrbitControls) ---- */
    let dragging = false, lastX = 0, dragRotation = 0;
    canvas.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", e => {
      if (!dragging) return;
      dragRotation += (e.clientX - lastX) * 0.006;
      lastX = e.clientX;
    });
    window.addEventListener("pointerup", () => { dragging = false; });

    let autoT = 0;
    let currentProgress = 0;

    function update(progress) {
      currentProgress = progress;
    }

    function frame() {
      autoT += reduceMotion ? 0 : 0.012;
      const p = currentProgress;
      const stateFloat = p * STATES;

      // 1) formación de partículas (progreso 0 -> 1 durante el estado 1)
      const formAmount = Math.min(1, stateFloat / 1);
      // 2) línea de escaneo activa durante el estado 2 (índice 1..2)
      const scanLocal = Math.min(1, Math.max(0, stateFloat - 1));
      const scanActive = stateFloat >= 1 && stateFloat < 2;
      const scanY = -2.6 + scanLocal * 5.2;

      const posArr = posAttr.array;
      const colArr = colorAttr.array;
      for (let i = 0; i < count; i++) {
        const d = delays[i];
        let ft = (formAmount - d) / (1 - d);
        ft = Math.min(1, Math.max(0, ft));
        ft = ft * ft * (3 - 2 * ft); // smoothstep

        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
        posArr[ix] = start[ix] + (target[ix] - start[ix]) * ft;
        posArr[iy] = start[iy] + (target[iy] - start[iy]) * ft;
        posArr[iz] = start[iz] + (target[iz] - start[iz]) * ft;

        let c = baseColor;
        if (ft > 0.94) c = activeColor;
        if (scanActive) {
          const dist = Math.abs(posArr[iy] - scanY);
          if (dist < 0.35) c = scanColor;
        }
        colArr[ix] = c.r; colArr[iy] = c.g; colArr[iz] = c.b;
      }
      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;

      // Cámara: se acerca ligeramente a medida que avanza la narrativa
      const camZ = 8 - Math.min(p, 1) * 3.4;
      camera.position.z += (camZ - camera.position.z) * 0.06;
      camera.position.y += ((0.3 - p * 0.5) - camera.position.y) * 0.06;

      if (!reduceMotion) {
        group.rotation.y = dragRotation + Math.sin(autoT * 0.15) * 0.12 + autoT * 0.02;
      } else {
        group.rotation.y = dragRotation + 0.3;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    frame();

    return { update };
  }
})();
