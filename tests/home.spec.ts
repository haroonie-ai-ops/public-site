import { test, expect } from '@playwright/test';

// Home (REQ-001 R-2.1). Copy is sourced from src/content/home/index.md —
// see src/content.config.ts for the schema these assertions are keyed to
// (heading, ctaLabel/ctaHref, servicesSummaryLinkLabel).

const VIEWPORTS = [
	{ name: 'desktop 1280x800', width: 1280, height: 800 },
	{ name: 'mobile 390x844', width: 390, height: 844 },
];

test.describe('single primary heading above the fold (R-2.1 AC1)', () => {
	for (const viewport of VIEWPORTS) {
		test(`exactly one visible h1, positioned above the fold at ${viewport.name}`, async ({
			page,
		}) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.goto('/');

			const headings = page.getByRole('heading', { level: 1 });
			await expect(headings).toHaveCount(1);
			await expect(headings.first()).toBeVisible();

			const box = await headings.first().boundingBox();
			expect(box, 'heading must have a bounding box').not.toBeNull();
			expect(box!.y).toBeLessThan(viewport.height);
		});
	}
});

test.describe('exactly one primary CTA linking to Contact (R-2.1 AC2)', () => {
	test('a single primary CTA is present and links to /contact/', async ({ page }) => {
		await page.goto('/');

		// The CTA's accessible name comes from src/content/home/index.md's
		// ctaLabel field, which is deliberately distinct from the header
		// nav's "Contact" link text so the two never collide in this
		// role/name query.
		const ctas = page.getByRole('link', { name: 'Get in touch' });
		await expect(ctas).toHaveCount(1);
		await expect(ctas).toHaveAttribute('href', '/contact/');
	});
});

test.describe('service-area summary links to Services (R-2.1 AC3)', () => {
	test('a visible summary links through to /services/', async ({ page }) => {
		await page.goto('/');

		const link = page.getByRole('link', { name: 'See our service areas' });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute('href', '/services/');
	});
});
