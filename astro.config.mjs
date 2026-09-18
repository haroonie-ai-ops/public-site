// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.haroonie.ai',
	trailingSlash: 'always',
	build: {
		// Keep the shared stylesheet inline in every page rather than letting
		// Astro emit it as a separate file.
		//
		// The default is 'auto' — inline while under ~4 KB, emit a file above
		// it. Applying the brand across the six pages pushed the shared sheet
		// to ~7.6 KB, which silently crossed that line and added a second
		// render-blocking request to every page. Measured on the built output,
		// simulated mobile, same machine, back to back:
		//
		//                       requests   FCP    LCP    Perf
		//   external (auto)        4      0.8 s  1.2 s    99
		//   inline (this)          3      0.6 s  0.9 s    99
		//
		// The pre-brand production baseline is LCP ~0.96-1.2 s (R-5.2 AC1 /
		// R-9.8 AC6), so the external form sat at the worst end of it and
		// inlining holds the best end. The trade is real and accepted: ~7.6 KB
		// (≈2 KB compressed) is repeated in each page's HTML instead of being
		// cached once. On a six-page brochure site, where most visits are a
		// single page, one saved round trip beats a cross-page cache hit.
		//
		// CSP is unaffected: style-src already carries 'unsafe-inline' and is
		// unchanged by this, byte for byte.
		inlineStylesheets: 'always',
	},
	integrations: [
		sitemap({
			// The custom 404 page (and any future non-canonical/error route) must
			// never appear in the sitemap (R-4.2 AC1 — "lists every public page",
			// not error pages).
			filter: (page) => !page.endsWith('/404'),
		}),
	],
});
