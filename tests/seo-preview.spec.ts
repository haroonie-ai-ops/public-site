import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';

// These checks run only against the `static-preview` project (see
// playwright.config.ts), which serves the real `astro build` output via
// `astro preview` rather than the dev server — QA-001 (Wave 1) found real
// behaviour differences between the two, and R-4.2/R-4.4 are specifically
// about what the production static host serves.

const SITE = 'https://www.haroonie.ai';

test.describe('sitemap and robots.txt in the built preview (R-4.2, R-4.4)', () => {
	test('robots.txt is served, allows crawling, and references the sitemap (production build)', async ({
		request,
	}) => {
		const response = await request.get('/robots.txt');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('text/plain');

		const body = await response.text();
		expect(body).not.toContain('Disallow: /');
		expect(body).toContain('Sitemap: https://www.haroonie.ai/sitemap-index.xml');
	});

	test('the sitemap index is served and points at a sitemap', async ({ request }) => {
		const response = await request.get('/sitemap-index.xml');
		expect(response.status()).toBe(200);

		const body = await response.text();
		expect(body).toContain('<sitemapindex');
		expect(body).toContain('sitemap-0.xml');
	});

	test('the sitemap lists every public page and excludes the 404', async ({ request }) => {
		const response = await request.get('/sitemap-0.xml');
		expect(response.status()).toBe(200);

		const body = await response.text();
		for (const route of allRoutes) {
			expect(body).toContain(`<loc>${SITE}${route.path}</loc>`);
		}
		expect(body).not.toContain('/404');
	});
});

test.describe('non-indexable preview builds (R-4.4)', () => {
	test('a build with SITE_ENV=preview disallows all crawling in its robots.txt', async () => {
		const outDir = mkdtempSync(join(tmpdir(), 'haroonie-preview-robots-'));
		try {
			execSync(`npm run build -- --outDir "${outDir}"`, {
				cwd: process.cwd(),
				env: { ...process.env, SITE_ENV: 'preview' },
				stdio: 'pipe',
			});

			const robots = readFileSync(join(outDir, 'robots.txt'), 'utf-8');
			expect(robots).toContain('Disallow: /');
		} finally {
			rmSync(outDir, { recursive: true, force: true });
		}
	});
});

test.describe('per-page metadata on the built output (R-4.1)', () => {
	for (const route of allRoutes) {
		test(`${route.path} serves a title, description and canonical link`, async ({ page }) => {
			const response = await page.goto(route.path);
			expect(response?.status()).toBe(200);

			await expect(page).toHaveTitle(/.+/);
			await expect(page.locator('meta[name="description"]')).toHaveAttribute(
				'content',
				/.+/,
			);
			await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
				'href',
				`${SITE}${route.path}`,
			);
		});
	}
});
