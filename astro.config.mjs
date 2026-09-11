// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.haroonie.ai',
	trailingSlash: 'always',
	integrations: [
		sitemap({
			// The custom 404 page (and any future non-canonical/error route) must
			// never appear in the sitemap (R-4.2 AC1 — "lists every public page",
			// not error pages).
			filter: (page) => !page.endsWith('/404'),
		}),
	],
});
