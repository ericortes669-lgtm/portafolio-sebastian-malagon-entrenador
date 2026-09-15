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

/* ---------- Hero 3D scene: doble hélice de ADN ---------- */
(function initHero3D() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const container = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 7.5);

  const group = new THREE.Group();
  scene.add(group);

  /* Construcción procedural de las dos cadenas de la hélice */
  function buildStrandPoints(offsetAngle, turns, height, radius, segments) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = offsetAngle + t * turns * Math.PI * 2;
      const y = -height / 2 + t * height;
      pts.push(new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle)));
    }
    return pts;
  }

  const turns = 3.2, height = 4.6, radius = 0.85, segments = 160;
  const strandA = buildStrandPoints(0, turns, height, radius, segments);
  const strandB = buildStrandPoints(Math.PI, turns, height, radius, segments);

  const curveA = new THREE.CatmullRomCurve3(strandA);
  const curveB = new THREE.CatmullRomCurve3(strandB);
  const tubeA = new THREE.Mesh(
    new THREE.TubeGeometry(curveA, 220, 0.055, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xff4300, roughness: 0.3, metalness: 0.55 })
  );
  const tubeB = new THREE.Mesh(
    new THREE.TubeGeometry(curveB, 220, 0.055, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xff8a4c, roughness: 0.3, metalness: 0.45 })
  );
  group.add(tubeA, tubeB);

  /* Pares de bases: pequeños cilindros que conectan ambas cadenas */
  const rungMat = new THREE.MeshStandardMaterial({
    color: 0xffcaa3, roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.85
  });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0xff4300, roughness: 0.3, metalness: 0.5 });
  const rungCount = 30;
  const yAxis = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= rungCount; i++) {
    const t = i / rungCount;
    const idx = Math.round(t * segments);
    const a = strandA[idx], b = strandB[idx];
    const dir = new THREE.Vector3().subVectors(b, a);
    const dist = dir.length();
    dir.normalize();

    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, dist, 6), rungMat);
    rung.position.copy(a).addScaledVector(dir, dist / 2);
    rung.quaternion.setFromUnitVectors(yAxis, dir);
    group.add(rung);

    const jointA = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), jointMat);
    jointA.position.copy(a);
    const jointB = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), jointMat);
    jointB.position.copy(b);
    group.add(jointA, jointB);
  }

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const key = new THREE.PointLight(0xffb98a, 1.5);
  key.position.set(4, 3, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xff4300, 1, 12);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let targetX = 0, targetY = 0;
  if (!isTouch) {
    window.addEventListener("mousemove", e => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
      targetY = (e.clientY / window.innerHeight - 0.5) * 0.6;
    });
  }

  if (reduceMotion) {
    group.rotation.set(0.15, 0.5, 0);
    renderer.render(scene, camera);
    return;
  }

  function animate() {
    group.rotation.y += 0.0045;
    group.rotation.x += (targetY * 0.4 - group.rotation.x) * 0.02;
    group.rotation.z += (targetX * 0.15 - group.rotation.z) * 0.02;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();
