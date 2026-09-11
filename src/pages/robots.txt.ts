import type { APIContext } from 'astro';

// R-4.4 — preview/staging hosts must not be indexed; production must not be
// blocked. This project builds via GitHub Actions (D-02), not Cloudflare's
// native Git integration, so Cloudflare's own CF_PAGES_BRANCH build variable
// is not guaranteed to be present — Wave 3's CI is responsible for setting
// SITE_ENV explicitly per build ('preview' for PR previews, 'production' for
// the main-branch deploy). CF_PAGES_BRANCH is still honoured as a fallback in
// case a future change does build inside Cloudflare directly. Absent both,
// the safe default is "production" (indexable) — the same behaviour this
// project has always had — so a build never *accidentally* de-indexes
// production because an env var was forgotten.
function isPreviewBuild(): boolean {
	const env = import.meta.env as unknown as Record<string, string | undefined>;

	if (env.SITE_ENV) {
		return env.SITE_ENV !== 'production';
	}
	if (env.CF_PAGES_BRANCH) {
		return env.CF_PAGES_BRANCH !== 'main';
	}
	return false;
}

export function GET({ site }: APIContext): Response {
	const body = isPreviewBuild()
		? ['User-agent: *', 'Disallow: /', ''].join('\n')
		: [
				'User-agent: *',
				'Allow: /',
				'',
				`Sitemap: ${new URL('sitemap-index.xml', site).toString()}`,
				'',
			].join('\n');

	return new Response(body, {
		status: 200,
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
