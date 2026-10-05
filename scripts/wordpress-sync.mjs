// Trae las entradas del Journal desde WordPress antes de construir la web.
//
// - Lee las entradas publicadas por la API de WordPress (los borradores no salen).
// - Descarga y reduce sus fotos, para que la web no dependa de WordPress para mostrarlas.
// - Escribe cada entrada como src/content/blog/wp-<slug>.md con el HTML del editor,
//   que blog.css sabe mostrar (alineaciones, foto + texto, columnas, galerías, citas…).
//
// Necesita WP_URL (en .env en local), por ejemplo http://localhost:8080. Sin ella no hace nada.

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import config from '../astro.config.mjs';

const WP_URL = process.env.WP_URL?.replace(/\/$/, '');
const POSTS_DIR = 'src/content/blog';
const IMAGES_DIR = 'public/images/wp';
const IMAGES_URL = `${(config.base ?? '/').replace(/\/$/, '')}/images/wp`;
const MAX_WIDTH = 1800;

if (!WP_URL) {
  console.log('[wordpress] WP_URL not set, skipping sync.');
  process.exit(0);
}

// ─── Texto ──────────────────────────────────────────────────────────────────

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—' };

const decode = (s = '') =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === '#'
      ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)))
      : ENTITIES[e.toLowerCase()] ?? m,
  );

const stripTags = (html = '') => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'))?.[1];

const yamlString = (s) => JSON.stringify(s ?? '');

// ─── Imágenes ───────────────────────────────────────────────────────────────

const downloaded = new Map(); // URL original → { src, width, height }

async function localImage(url) {
  url = decode(url);
  if (!downloaded.has(url)) {
    const n = downloaded.size + 1;
    downloaded.set(url, (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`[wordpress] image ${url}: ${res.status}`);
      const name = path.basename(new URL(url).pathname).replace(/\.[^.]+$/, '');
      const file = `${name}-${n}.webp`;
      const info = await sharp(Buffer.from(await res.arrayBuffer()))
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(IMAGES_DIR, file));
      return { src: `${IMAGES_URL}/${file}`, width: info.width, height: info.height };
    })());
  }
  return downloaded.get(url);
}

async function replaceAsync(str, regex, fn) {
  const parts = await Promise.all([...str.matchAll(regex)].map((m) => fn(...m)));
  let i = 0;
  return str.replace(regex, () => parts[i++]);
}

const isUpload = (url) => url?.startsWith(`${WP_URL}/wp-content/uploads/`);

async function localizeContent(html) {
  // <img>: foto descargada y reducida; fuera srcset/sizes (apuntan a WordPress).
  html = await replaceAsync(html, /<img\b[^>]*>/gi, async (tag) => {
    const src = attr(tag, 'src');
    if (!isUpload(decode(src ?? ''))) return tag;
    const img = await localImage(src);
    const alt = attr(tag, 'alt') ?? '';
    return `<img src="${img.src}" alt="${alt}" width="${img.width}" height="${img.height}" loading="lazy">`;
  });
  // Enlaces a archivos subidos (p. ej. "enlazar a la imagen") → copia local.
  html = await replaceAsync(html, /href="([^"]+)"/gi, async (m, href) =>
    isUpload(decode(href)) && /\.(jpe?g|png|webp|gif)$/i.test(href) ? `href="${(await localImage(href)).src}"` : m,
  );
  // Una sola pieza de HTML sin líneas en blanco: una línea en blanco cortaría el bloque en el Markdown.
  return html.replace(/\n\s*\n/g, '\n').trim();
}

// ─── Entradas ───────────────────────────────────────────────────────────────

async function fetchPosts() {
  const posts = [];
  for (let page = 1, total = 1; page <= total; page++) {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=wp:featuredmedia`);
    if (!res.ok) throw new Error(`[wordpress] posts page ${page}: ${res.status} ${await res.text()}`);
    total = Number(res.headers.get('x-wp-totalpages')) || 1;
    posts.push(...(await res.json()));
  }
  return posts;
}

async function main() {
  // Empezar de cero: lo que se despublique en WordPress desaparece de la web.
  await mkdir(POSTS_DIR, { recursive: true });
  for (const f of await readdir(POSTS_DIR)) {
    if (f.startsWith('wp-')) await rm(path.join(POSTS_DIR, f));
  }
  await rm(IMAGES_DIR, { recursive: true, force: true });
  await mkdir(IMAGES_DIR, { recursive: true });

  const posts = await fetchPosts();
  for (const post of posts) {
    const title = decode(post.title.rendered) || 'Untitled';
    const summary = stripTags(post.excerpt.rendered).replace(/\s*\[…\]$/, '');
    const coverUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    const cover = coverUrl ? (await localImage(coverUrl)).src : null;
    const body = await localizeContent(post.content.rendered);

    const frontmatter = [
      '---',
      `slug: ${post.slug}`, // dirección de la entrada: /blog/<slug>/
      `title: ${yamlString(title)}`,
      `date: ${post.date.slice(0, 10)}`,
      summary && `description: ${yamlString(summary)}`,
      cover && `cover: ${yamlString(cover)}`,
      '---',
    ].filter(Boolean).join('\n');

    const file = `wp-${post.slug}.md`;
    await writeFile(path.join(POSTS_DIR, file), `${frontmatter}\n\n${body}\n`);
    console.log(`[wordpress] ${file}`);
  }
  console.log(`[wordpress] ${posts.length} published entr${posts.length === 1 ? 'y' : 'ies'}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
