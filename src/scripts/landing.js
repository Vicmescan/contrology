import { drawSlats } from './slats.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const nav = document.getElementById('nav');
const logo = document.getElementById('logo');
const hint = document.getElementById('hint');
// El footer y el botón de reservar quedan fuera: tienen sus propios colores fijos.
const textEls = [...document.querySelectorAll('h1, h2, p, small, a, input, textarea, .btn-send, .menu-toggle')]
  .filter(el => !el.closest('.site-footer, .reserve-circle'));

const sections = document.querySelectorAll('section');

let W, H, totalH, sp = 0, tp = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  totalH = Math.max(1, document.body.scrollHeight - window.innerHeight);
}

function ease(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

window.addEventListener('scroll', () => {
  hint.classList.toggle('hidden', window.scrollY > 10);
  const cycle = (window.scrollY / H) % 2;
  tp = cycle <= 1 ? cycle : 2 - cycle;
}, { passive: true });

function draw() {
  sp += (tp - sp) * 0.07;
  const p = ease(sp);

  drawSlats(ctx, W, H, p, window.scrollY * 0.06);

  const vw = W * .05;
  const vAlpha = p * .5;
  const lg = ctx.createLinearGradient(0, 0, vw, 0);
  lg.addColorStop(0, `rgba(13,13,13,${vAlpha})`);
  lg.addColorStop(1, 'rgba(13,13,13,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, vw, H);

  const rg = ctx.createLinearGradient(W, 0, W - vw, 0);
  rg.addColorStop(0, `rgba(13,13,13,${vAlpha})`);
  rg.addColorStop(1, 'rgba(13,13,13,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(W - vw, 0, vw, H);

  const col = p < .5 ? '#F5F2EC' : '#0D0D0D';
  textEls.forEach(el => { if (!el.classList.contains('red')) el.style.color = col; });
  // Color del texto para el resto de elementos (bordes, fichas…) que lo usan vía CSS.
  document.documentElement.style.setProperty('--fg', col);
  // Fondo del menú desplegable: el contrario del texto, para que se lea sobre la animación.
  document.documentElement.style.setProperty('--nav-bg', p < .5 ? '#0D0D0D' : '#F5F2EC');

  const bgAlpha = Math.max(0, (p - 0.5) * 2);
  sections.forEach(s => { s.style.background = `rgba(245,242,236,${bgAlpha})`; });

  requestAnimationFrame(draw);
}

resize();
window.addEventListener('resize', resize, { passive: true });
draw();
