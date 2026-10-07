<?php
/**
 * Plugin Name: Contrology
 * Description: WordPress solo sirve para escribir el Journal; la web es la de Astro.
 *              Los enlaces "Ver entrada" llevan a la web, y la parte pública de WordPress
 *              redirige a ella.
 */

// Dirección de la web (Astro). En el WordPress de producción se define en wp-config.php.
if (!defined('CONTROLOGY_SITE_URL')) {
	define('CONTROLOGY_SITE_URL', getenv('CONTROLOGY_SITE_URL') ?: 'http://localhost:4321/contrology/');
}

function contrology_post_url($post) {
	return trailingslashit(CONTROLOGY_SITE_URL) . 'journal/' . $post->post_name . '/';
}

// "Ver entrada" y los enlaces permanentes apuntan a la entrada en la web.
add_filter('post_link', function ($url, $post) {
	return $post->post_status === 'publish' ? contrology_post_url($post) : $url;
}, 10, 2);

// La parte pública de WordPress (su tema) no se usa: se redirige a la web.
// El panel, la API, las vistas previas y los archivos subidos siguen funcionando.
add_action('template_redirect', function () {
	if (is_admin() || is_preview() || wp_doing_ajax() || (defined('REST_REQUEST') && REST_REQUEST)) {
		return;
	}
	$target = is_singular('post') && get_post_status() === 'publish'
		? contrology_post_url(get_post())
		: CONTROLOGY_SITE_URL;
	wp_redirect($target, 302);
	exit;
});
