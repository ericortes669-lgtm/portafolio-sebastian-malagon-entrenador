/* =====================================================================
   CONFIGURACIÓN — EDITA SOLO ESTA SECCIÓN
   Aquí defines tus datos reales. El resto del archivo no necesitas tocarlo.
   ===================================================================== */
const CONFIG = {
  // REEMPLAZAR: tu número de WhatsApp completo, con código de país, SIN
  // espacios, signos ni el símbolo "+". Ejemplo para Colombia: "573001234567"
  whatsappNumber: "57XXXXXXXXXX",

  // Mensaje que se abrirá por defecto al pulsar los botones de WhatsApp
  whatsappDefaultMessage: "Hola, quiero información sobre tus servicios de entrenamiento personal.",

  // REEMPLAZAR: enlaces reales de tus redes sociales
  instagramUrl: "https://instagram.com/[usuario]",
  tiktokUrl: "https://tiktok.com/@[usuario]",
  facebookUrl: "https://facebook.com/[usuario]",

  // REEMPLAZAR: texto que se muestra junto al ícono de Instagram en Contacto
  instagramHandle: "@[usuario]",

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

function buildWhatsAppUrl(message) {
  const text = encodeURIComponent(message || CONFIG.whatsappDefaultMessage);
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${text}`;
}

function setupWhatsAppLinks() {
  const url = buildWhatsAppUrl();

  const targets = [
    "whatsappNavBtn",
    "whatsappCtaBtn",
    "whatsappFloatBtn",
    "whatsappContactLink",
  ];
  targets.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = url;
  });

  const contactLink = document.getElementById("whatsappContactLink");
  if (contactLink) contactLink.textContent = formatDisplayNumber(CONFIG.whatsappNumber);

  // Botones "Quiero este servicio" de cada tarjeta: arman un mensaje
  // personalizado con el nombre del servicio elegido.
  document.querySelectorAll("[data-service]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const service = btn.getAttribute("data-service");
      const message = `Hola, quiero información sobre el servicio: ${service}.`;
      btn.href = buildWhatsAppUrl(message);
    });
  });
}

function formatDisplayNumber(raw) {
  // Muestra el número tal cual si aún es el placeholder
  if (!raw || raw.includes("X")) return "[NÚMERO DE WHATSAPP]";
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

  const igLabel = document.getElementById("instagramContactLink");
  if (igLabel) igLabel.textContent = CONFIG.instagramHandle;
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
