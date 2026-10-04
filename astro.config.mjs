import { defineConfig } from 'astro/config';

// Publicado en GitHub Pages como sitio de proyecto: https://vicmescan.github.io/contrology/
// Si se pasa a dominio propio: site = 'https://dominio.com' y quitar base
// (y cambiar media.output en .pages.yml a /images).
export default defineConfig({
  site: 'https://vicmescan.github.io',
  base: '/contrology',
});
