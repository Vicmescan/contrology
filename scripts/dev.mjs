// `npm run dev`: trae las entradas de WordPress, arranca Astro y vigila WordPress.
// Cuando se publica, edita o despublica una entrada, vuelve a sincronizar sola
// y la web en local se actualiza en unos segundos.

import { spawn } from 'node:child_process';

const WP_URL = process.env.WP_URL?.replace(/\/$/, '');
const INTERVAL = 5000;

const sync = () =>
  new Promise((resolve) => {
    spawn(process.execPath, ['scripts/wordpress-sync.mjs'], { stdio: 'inherit' }).on('exit', resolve);
  });

// Huella de las entradas publicadas: cambia al publicar, editar o despublicar.
async function fingerprint() {
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts?per_page=100&_fields=id,modified`);
  if (!res.ok) throw new Error(`${res.status}`);
  return JSON.stringify(await res.json());
}

await sync();

// Desde una terminal, Astro se queda en primer plano. Lanzado desde otras herramientas
// se pasa a segundo plano y su proceso termina con código 0: en ese caso se sigue vigilando.
const astro = spawn('npx', ['astro', 'dev', ...process.argv.slice(2)], { stdio: 'inherit' });
astro.on('exit', (code) => { if (code) process.exit(code); });

// Ctrl+C: parar Astro (esté en primer o segundo plano) y salir.
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  astro.kill('SIGINT');
  spawn('npx', ['astro', 'dev', 'stop'], { stdio: 'ignore' }).on('exit', () => process.exit(0));
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

if (WP_URL) {
  let last = await fingerprint().catch(() => null);
  let busy = false;
  setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      const now = await fingerprint();
      if (now !== last) {
        console.log('[wordpress] changes detected, syncing…');
        await sync();
        last = now;
      }
    } catch {
      // WordPress parado o reiniciándose: se reintenta en la siguiente vuelta.
    } finally {
      busy = false;
    }
  }, INTERVAL);
}
