const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const nav = document.getElementById('nav');
const logo = document.getElementById('logo');
const hint = document.getElementById('hint');
const textEls = document.querySelectorAll('h1, h2, p, small, a, input, textarea, .btn-send, .menu-toggle');

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('links').classList.toggle('open');
});

let W, H, totalH, sp = 0, tp = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  totalH = Math.max(1, document.body.scrollHeight - window.innerHeight);
}

function ease(t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

window.addEventListener('scroll', () => {
  const cycle = (window.scrollY / H) % 2;
  tp = cycle <= 1 ? cycle : 2 - cycle;
}, { passive: true });

function draw() {
  sp += (tp - sp) * 0.07;
  const p = ease(sp);

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#F5F2EC';
  ctx.fillRect(0, 0, W, H);

  const slatH = 9 - p * 6;
  const gapH = p * slatH * 9;
  const repeat = slatH + gapH;
  const drift = repeat > 1 ? (window.scrollY * 0.06) % repeat : 0;
  let y = -repeat + drift;

  while (y < H + repeat) {
    const midY = y + slatH * 0.5;
    ctx.beginPath();
    ctx.ellipse(W * .5, midY, W * .54, slatH * .58 + .5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(13,13,13,${0.97 - p * .1})`;
    ctx.fill();
    if (p > .2 && gapH > 2) {
      const hl = (p - .2) * .28;
      ctx.beginPath();
      ctx.ellipse(W * .5, midY - slatH * .22, W * .54, slatH * .18, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,242,236,${hl})`;
      ctx.fill();
    }
    y += repeat;
  }

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

  requestAnimationFrame(draw);
}

resize();
window.addEventListener('resize', resize, { passive: true });
draw();
