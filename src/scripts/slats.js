// Lamas del reformer: el fondo de la portada, de Contrology Practice, Private Session y Practice.
//
// Cada lama es una franja que se estrecha en los extremos; donde se estrecha aparecen las
// rayas de los bordes (los "muelles"). EDGE es el ancho de esa zona de rayas en cada lado,
// como fracción del ancho de la pantalla.
export const EDGE = 0.11;

// Extremo de cada lama: media elipse de radio R centrada en cx. Con estas proporciones
// las rayas empiezan a verse a EDGE del borde y en el borde mismo la lama mide algo
// menos de la mitad, igual que en el dibujo original de la portada.
function capsule(ctx, W, midY, ry) {
  const R = (W * EDGE) / 0.312;
  const cx = R * 0.926;
  ctx.beginPath();
  ctx.ellipse(cx, midY, R, ry, 0, 0, Math.PI * 2);
  ctx.ellipse(W - cx, midY, R, ry, 0, 0, Math.PI * 2);
  ctx.rect(cx, midY - ry, Math.max(0, W - 2 * cx), ry * 2);
  ctx.fill('nonzero');
}

// Fondo entre lamas en modo oscuro: casi negro, para que el movimiento se vea sin aclarar la página.
const DARK_GAP = '#1e1e1d';

// Modo oscuro: entre las lamas hay negro en vez de crema. Los muelles de los bordes conservan
// el crema en la fase oscura y se apagan al abrirse las lamas, así la página no cambia de color.
function darkBackground(ctx, W, H, p) {
  ctx.fillStyle = DARK_GAP;
  ctx.fillRect(0, 0, W, H);
  const band = W * EDGE * 1.25;
  const cream = `rgba(245,242,236,${1 - p})`;
  for (const [x0, x1] of [[0, band], [W, W - band]]) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, cream);
    g.addColorStop(0.8, cream);
    g.addColorStop(1, 'rgba(245,242,236,0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(x0, x1), 0, band, H);
  }
}

// p: 0 = fase oscura (lamas juntas), 1 = fase abierta (lamas finas y separadas).
// drift: desplazamiento vertical de las lamas (la portada lo mueve con el scroll).
// dark: modo oscuro (Contrology Practice y Private Session): la página no se aclara.
export function drawSlats(ctx, W, H, p, drift = 0, { dark = false } = {}) {
  ctx.clearRect(0, 0, W, H);
  if (dark) {
    darkBackground(ctx, W, H, p);
  } else {
    ctx.fillStyle = '#F5F2EC';
    ctx.fillRect(0, 0, W, H);
  }

  const slatH = 9 - p * 6;
  const gapH = p * slatH * 9;
  const repeat = slatH + gapH;
  let y = -repeat + (repeat > 1 ? drift % repeat : 0);

  while (y < H + repeat) {
    const midY = y + slatH * 0.5;
    // Opacas del todo en la fase oscura: el centro queda negro liso, sin líneas entre lamas.
    ctx.fillStyle = `rgba(13,13,13,${1 - p * 0.13})`;
    capsule(ctx, W, midY, slatH * 0.58 + 0.5);
    if (!dark && p > 0.2 && gapH > 2) {
      ctx.fillStyle = `rgba(245,242,236,${(p - 0.2) * 0.28})`;
      capsule(ctx, W, midY - slatH * 0.22, slatH * 0.18);
    }
    y += repeat;
  }
}
