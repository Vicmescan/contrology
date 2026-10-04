// Prefija rutas con el base de Astro ('/contrology') sin duplicar barras.
export const url = (path = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
