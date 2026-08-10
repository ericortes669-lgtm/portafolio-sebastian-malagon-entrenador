/* =====================================================================
   CONFIGURACIÓN — EDITA SOLO ESTA SECCIÓN
   Aquí defines tus datos reales. El resto del archivo no necesitas tocarlo.
   ===================================================================== */
const CONFIG = {
  // Número de WhatsApp de Sebastián (con código de país, sin espacios ni "+")
  whatsappSebastian: "573207970414",

  // Número de WhatsApp de Sergio (con código de país, sin espacios ni "+")
  whatsappSergio: "573104796361",

  // Número que se usa en los botones principales (nav, CTA grande, botón
  // flotante y formulario de contacto). Por defecto es el de Sebastián;
  // cámbialo a CONFIG.whatsappSergio si prefieren que caiga en el otro.
  get whatsappNumber() {
    return this.whatsappSebastian;
  },

  // Mensaje que se abrirá por defecto al pulsar los botones de WhatsApp
  whatsappDefaultMessage: "Hola, quiero información sobre sus servicios de entrenamiento personal.",

  // REEMPLAZAR: enlaces reales de TikTok y Facebook del equipo
  instagramUrl: "https://instagram.com/SS_coach",
  tiktokUrl: "https://tiktok.com/@[usuario]",
  facebookUrl: "https://facebook.com/[usuario]",

  // Texto que se muestra junto al ícono de Instagram en Contacto
  instagramHandle: "@SS_coach",

  // Palabras que giran en la franja tipo scoreboard debajo del hero.
  // Edita, agrega o quita elementos libremente.
  tickerItems: [
    "FUERZA",
    "DISCIPLINA",
    "CONSTANCIA",
    "RESULTADOS",
    "TÉCNICA",
    "PROGRESO",
  ],
};

/* =====================================================================
   A partir de aquí es lógica del sitio — no necesitas modificarlo.
   ===================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  setupWhatsAppLinks();
  setupSocialLinks();
  setupTicker();
  setupNavToggle();
  setupContactForm();
  setupYear();
});

function buildWhatsAppUrl(message, number) {
  const text = encodeURIComponent(message || CONFIG.whatsappDefaultMessage);
  return `https://wa.me/${number || CONFIG.whatsappNumber}?text=${text}`;
}

function setupWhatsAppLinks() {
  const url = buildWhatsAppUrl();

  // Botones principales: usan el número por defecto (CONFIG.whatsappNumber)
  const targets = ["whatsappNavBtn", "whatsappCtaBtn", "whatsappFloatBtn"];
  targets.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = url;
  });

  // Sección de contacto: un enlace para cada entrenador
  const sebastianLink = document.getElementById("whatsappSebastianLink");
  if (sebastianLink) {
    sebastianLink.href = buildWhatsAppUrl(null, CONFIG.whatsappSebastian);
    sebastianLink.textContent = formatDisplayNumber(CONFIG.whatsappSebastian);
  }
  const sergioLink = document.getElementById("whatsappSergioLink");
  if (sergioLink) {
    sergioLink.href = buildWhatsAppUrl(null, CONFIG.whatsappSergio);
    sergioLink.textContent = formatDisplayNumber(CONFIG.whatsappSergio);
  }

  // Botones "Quiero este plan" de cada tarjeta: arman un mensaje
  // personalizado con el nombre del plan elegido.
  document.querySelectorAll("[data-service]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const service = btn.getAttribute("data-service");
      const message = `Hola, quiero información sobre el plan: ${service}.`;
      btn.href = buildWhatsAppUrl(message);
    });
  });
}

function formatDisplayNumber(raw) {
  // Muestra el número tal cual si aún es el placeholder
  if (!raw || raw.includes("X")) return "[NÚMERO]";
  return `+${raw}`;
}

function setupSocialLinks() {
  const map = {
    instagramContactLink: CONFIG.instagramUrl,
    instagramSocialLink: CONFIG.instagramUrl,
    tiktokSocialLink: CONFIG.tiktokUrl,
    facebookSocialLink: CONFIG.facebookUrl,
  };
  Object.entries(map).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el) el.href = url;
  });
}

function setupTicker() {
  const track = document.getElementById("tickerTrack");
  if (!track) return;

  // Se duplica la lista para lograr un scroll infinito sin cortes.
  const items = [...CONFIG.tickerItems, ...CONFIG.tickerItems];
  track.innerHTML = items
    .map((item) => `<span class="ticker__item">${item}</span>`)
    .join("");
}

function setupNavToggle() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = form.nombre.value.trim();
    const objetivo = form.objetivo.value.trim();
    const message = `Hola, soy ${nombre}. Mi objetivo es: ${objetivo}. Quiero agendar una valoración.`;
    window.open(buildWhatsAppUrl(message), "_blank", "noopener");
  });
}

function setupYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}
