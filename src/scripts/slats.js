// Lamas del reformer: el fondo de la portada, de Contrology Practice y los laterales de Practice.
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

// p: 0 = fase oscura (lamas juntas), 1 = fase clara (lamas finas y separadas).
// drift: desplazamiento vertical de las lamas (la portada lo mueve con el scroll).
export function drawSlats(ctx, W, H, p, drift = 0) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#F5F2EC';
  ctx.fillRect(0, 0, W, H);

  const slatH = 9 - p * 6;
  const gapH = p * slatH * 9;
  const repeat = slatH + gapH;
  let y = -repeat + (repeat > 1 ? drift % repeat : 0);

  while (y < H + repeat) {
    const midY = y + slatH * 0.5;
    // Opacas del todo en la fase oscura: el centro queda negro liso, sin líneas entre lamas.
    ctx.fillStyle = `rgba(13,13,13,${1 - p * 0.13})`;
    capsule(ctx, W, midY, slatH * 0.58 + 0.5);
    if (p > 0.2 && gapH > 2) {
      ctx.fillStyle = `rgba(245,242,236,${(p - 0.2) * 0.28})`;
      capsule(ctx, W, midY - slatH * 0.22, slatH * 0.18);
    }
    y += repeat;
  }
}
