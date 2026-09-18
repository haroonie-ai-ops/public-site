import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';

// Wave 2a exit criteria (PLAN-001 §2): every page carries unique,
// non-empty <title>/description/canonical/OG tags (R-4.1), and the home
// page carries valid Organization/ProfessionalService structured data
// (R-4.3). Runs against the dev server — the built-output equivalent lives
// in seo-preview.spec.ts alongside the sitemap/robots checks.

const SITE = 'https://www.haroonie.ai';

test.describe('per-page metadata (R-4.1)', () => {
	for (const route of allRoutes) {
		test(`${route.path} has a non-empty title, description, canonical and OG tags`, async ({
			page,
		}) => {
			await page.goto(route.path);

			await expect(page).toHaveTitle(/.+/);

			await expect(page.locator('meta[name="description"]')).toHaveAttribute(
				'content',
				/.+/,
			);

			await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
				'href',
				`${SITE}${route.path}`,
			);

			for (const property of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image']) {
				await expect(
					page.locator(`meta[property="${property}"]`),
				).toHaveAttribute('content', /.+/);
			}
		});
	}

	test('title and description are unique across every page', async ({ page }) => {
		const titles = new Set<string>();
		const descriptions = new Set<string>();

		for (const route of allRoutes) {
			await page.goto(route.path);

			titles.add(await page.title());

			const description = await page
				.locator('meta[name="description"]')
				.getAttribute('content');
			expect(description, `${route.path} is missing a description`).toBeTruthy();
			descriptions.add(description ?? '');
		}

		expect(titles.size, 'titles must be unique across pages').toBe(allRoutes.length);
		expect(
			descriptions.size,
			'descriptions must be unique across pages',
		).toBe(allRoutes.length);
	});
});

test.describe('organisation structured data (R-4.3)', () => {
	test('the home page carries a valid Organization/ProfessionalService JSON-LD block', async ({
		page,
	}) => {
		await page.goto('/');

		const scriptContent = await page
			.locator('script[type="application/ld+json"]')
			.first()
			.textContent();
		expect(scriptContent).toBeTruthy();

		// JSON.parse returns `any`, which silently disables type checking on
		// every property read below. Narrowing to `unknown` fields keeps the
		// three assertions exactly as they were while making the reads
		// type-safe: the values are still compared with the same matchers
		// against the same expected values.
		const schema = JSON.parse(scriptContent ?? '') as Record<string, unknown>;
		expect(['Organization', 'ProfessionalService']).toContain(schema['@type']);
		expect(schema.name).toBe('haroonie.ai');
		expect(schema.url).toBe(`${SITE}/`);
	});
});
