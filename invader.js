"use strict";

/* ==== CAMBIO DE SECCIONES ==== */
function mostrarSeccion(id) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  const el = document.getElementById(id);
  if (el) el.classList.add('activa');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==== REFERENCIAS ==== */
const carrusel = document.getElementById('carruselProyectos');
const arrowLeft = document.getElementById('arrowLeft');
const arrowRight = document.getElementById('arrowRight');
const modal = document.getElementById("proyectoModal");
const modalTitulo = document.getElementById("modalTitulo");
const modalDescripcion = document.getElementById("modalDescripcion");
const modalMiembros = document.getElementById("modalMiembros");
const cerrarBtn = document.querySelector(".cerrar-modal");
const modalImg = document.getElementById("modalImagen");

let imagenClon = null;
let animando = false;
let fondoNegro = null;

window.addEventListener("load", () => {
  if (carrusel) initCarousel();
});

function initCarousel() {
  const items = Array.from(carrusel.querySelectorAll(".carousel-item"));
  if (items.length === 0) return;

  const track = document.createElement("div");
  track.className = "carousel-track";
  items.forEach(it => track.appendChild(it));
  carrusel.innerHTML = "";
  carrusel.appendChild(track);

  const n = items.length;
  let index = n;
  let isTransitioning = false;

  const clonesBefore = items.map(i => i.cloneNode(true));
  const clonesAfter = items.map(i => i.cloneNode(true));
  clonesBefore.forEach(c => track.insertBefore(c, track.firstChild));
  clonesAfter.forEach(c => track.appendChild(c));

  function getOffsetForIndex(idx) {
    const child = track.children[idx];
    const containerWidth = carrusel.offsetWidth;
    const childRect = child.getBoundingClientRect();
    const childWidth = childRect.width;
    const childCenterRelative = child.offsetLeft + childWidth / 2;
    const containerCenter = containerWidth / 2;
    return containerCenter - childCenterRelative;
  }

  function applyTransform(idx, animate = true) {
    if (!track.children[idx]) return;
    track.style.transition = animate ? "transform 0.6s cubic-bezier(.25,1,.5,1)" : "none";
    const offset = getOffsetForIndex(idx);
    track.style.transform = `translateX(${offset}px)`;
    index = idx;
  }

  function updateCentered() {
    const children = Array.from(track.children);
    const containerRect = carrusel.getBoundingClientRect();
    const center = containerRect.left + containerRect.width / 2;
    let closest = null;
    let closestDist = Infinity;
    children.forEach(child => {
      const r = child.getBoundingClientRect();
      const childCenter = r.left + r.width / 2;
      const dist = Math.abs(childCenter - center);
      child.classList.remove("centrado");
      if (dist < closestDist) { closestDist = dist; closest = child; }
    });
    if (closest) closest.classList.add("centrado");
  }

  applyTransform(index, false);
  updateCentered();

  function move(dir) {
    if (isTransitioning) return;
    isTransitioning = true;
    applyTransform(index + dir, true);
  }

  track.addEventListener("transitionend", () => {
    isTransitioning = false;
    if (index >= n * 2) {
      index = index - n;
      applyTransform(index, false);
    } else if (index < n) {
      index = index + n;
      applyTransform(index, false);
    }
    updateCentered();
  });

  if (arrowLeft) arrowLeft.addEventListener("click", () => move(-1));
  if (arrowRight) arrowRight.addEventListener("click", () => move(1));

  /* ==== CLICK EN IMAGEN ==== */
  track.addEventListener("click", (e) => {
    if (animando) return;
    const clicked = e.target.closest(".carousel-item");
    if (!clicked) return;

    const center = carrusel.getBoundingClientRect().left + carrusel.offsetWidth / 2;
    const children = Array.from(track.children);
    let closest = null;
    let closestDist = Infinity;

    children.forEach(c => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - center);
      if (d < closestDist) { closestDist = d; closest = c; }
    });

    if (clicked !== closest) {
      const clickedIndex = children.indexOf(clicked);
      applyTransform(clickedIndex, true);
      return;
    }

    const img = clicked.querySelector("img");
    if (!img) return;

    const titulo = img.dataset.title || img.alt || "Proyecto";
    const desc = img.dataset.desc || "Descripción temporal.";
    const miembros = img.dataset.members || "Miembros: Por definir";
    if (modalImg) modalImg.style.display = "none";

    // === Fondo negro más rápido (inmediato) ===
    fondoNegro = document.createElement("div");
    fondoNegro.className = "fondo-negro activo";
    document.body.appendChild(fondoNegro);

    // === Clon de imagen ===
    const rect = img.getBoundingClientRect();
    imagenClon = img.cloneNode(true);
    imagenClon.className = "clon-animado";
    Object.assign(imagenClon.style, {
      position: "fixed",
      left: rect.left + "px",
      top: rect.top + "px",
      width: rect.width + "px",
      height: rect.height + "px",
      borderRadius: "12px",
      objectFit: "cover",
      zIndex: "2200",
      transition: "all 0.78s cubic-bezier(.22,.9,.35,1)",
      boxShadow: "0 20px 90px rgba(0,0,0,0.55)",
      clipPath: "inset(8% 12% 8% 12% round 12px)" /* recorte superior e inferior agregado */
    });
    document.body.appendChild(imagenClon);
    void imagenClon.offsetWidth;
    animando = true;

    const modalRect = modal.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scale = 1.25;
    const finalWidth = Math.min(rect.width * scale, viewportWidth * 0.45);
    const finalHeight = finalWidth * (rect.height / rect.width);
    const puntoContactoX = Math.round(viewportWidth / 2);
    const finalLeft = puntoContactoX - finalWidth;
    const finalTop = modalRect.top + (modalRect.height / 2) - (finalHeight / 2);

    const safeLeft = Math.max(8, Math.min(finalLeft, viewportWidth - finalWidth - 8));
    const safeTop = Math.max(8, Math.min(finalTop, viewportHeight - finalHeight - 8));

    setTimeout(() => {
      imagenClon.style.left = `${safeLeft}px`;
      imagenClon.style.top = `${safeTop}px`;
      imagenClon.style.width = `${finalWidth}px`;
      imagenClon.style.height = `${finalHeight}px`;
      imagenClon.style.clipPath = "inset(0 0 0 0 round 12px)";
    }, 18);

    setTimeout(() => {
      modalTitulo.textContent = titulo;
      modalDescripcion.textContent = desc;
      modalMiembros.textContent = miembros;
      modal.classList.add("activo");
      animando = false;
    }, 420);
  });

  /* ==== CERRAR MODAL ==== */
  function cerrarModal() {
    if (animando) return;
    modal.classList.remove("activo");

    // Quitar fondo negro
    if (fondoNegro) {
      fondoNegro.classList.remove("activo");
      setTimeout(() => {
        if (fondoNegro && fondoNegro.parentNode) fondoNegro.remove();
        fondoNegro = null;
      }, 300);
    }

    if (!imagenClon) {
      if (modalImg) modalImg.style.display = "";
      return;
    }

    const realCenteredImg = document.querySelector(".carousel-item.centrado img");
    if (!realCenteredImg) {
      imagenClon.style.transition = "all 0.4s ease";
      imagenClon.style.opacity = "0";
      setTimeout(() => {
        try { document.body.removeChild(imagenClon); } catch {}
        imagenClon = null;
        if (modalImg) modalImg.style.display = "";
      }, 420);
      return;
    }

    const targetRect = realCenteredImg.getBoundingClientRect();
    void imagenClon.offsetWidth;
    animando = true;

    imagenClon.style.transition = "all 0.78s cubic-bezier(.22,.9,.35,1)";
    imagenClon.animate([
      { clipPath: "inset(0 0 0 0 round 12px)" },
      { clipPath: "inset(8% 12% 8% 12% round 12px)" } /* se cierra también arriba y abajo */
    ], { duration: 700, easing: "ease-in-out", fill: "forwards" });

    setTimeout(() => {
      imagenClon.style.left = `${targetRect.left}px`;
      imagenClon.style.top = `${targetRect.top}px`;
      imagenClon.style.width = `${targetRect.width}px`;
      imagenClon.style.height = `${targetRect.height}px`;
      imagenClon.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
    }, 10);

    imagenClon.addEventListener("transitionend", function cleanup() {
      try { document.body.removeChild(imagenClon); } catch {}
      imagenClon = null;
      animando = false;
      if (modalImg) modalImg.style.display = "";
      imagenClon && imagenClon.removeEventListener("transitionend", cleanup);
    }, { once: true });
  }

  if (cerrarBtn) cerrarBtn.addEventListener("click", cerrarModal);
  if (modal) modal.addEventListener("click", e => { if (e.target === modal) cerrarModal(); });
  window.addEventListener("resize", () => {
    setTimeout(() => {
      if (track && track.children[index]) applyTransform(index, false);
      updateCentered();
    }, 80);
  });
}
