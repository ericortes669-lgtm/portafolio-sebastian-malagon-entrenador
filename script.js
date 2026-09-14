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
      card.style.setProperty("--rx", (px * 10).toFixed(2) + "deg");
      card.style.setProperty("--ry", (py * -10).toFixed(2) + "deg");
    });
    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
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

/* ---------- Hero 3D scene ---------- */
(function initHero3D() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const container = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const group = new THREE.Group();
  scene.add(group);

  const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xff4300, roughness: 0.35, metalness: 0.4, flatShading: true
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  const wireGeo = new THREE.IcosahedronGeometry(2.3, 1);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0xff8a4c, wireframe: true, transparent: true, opacity: 0.35 });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  group.add(wire);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);
  const key = new THREE.PointLight(0xffb98a, 1.4);
  key.position.set(4, 3, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xff4300, 1, 10);
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
    group.rotation.set(0.4, 0.6, 0);
    renderer.render(scene, camera);
    return;
  }

  function animate() {
    group.rotation.y += 0.003;
    group.rotation.x += 0.0012;
    group.rotation.y += (targetX - group.rotation.y) * 0.01;
    group.rotation.x += (targetY - group.rotation.x) * 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();
