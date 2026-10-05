import { defineConfig } from 'astro/config';

// Publicado en GitHub Pages como sitio de proyecto: https://vicmescan.github.io/contrology/
// Si se pasa a dominio propio: site = 'https://dominio.com' y quitar base.
export default defineConfig({
  site: 'https://vicmescan.github.io',
  base: '/contrology',
  devToolbar: { enabled: false },
});
