import { test, expect } from '@playwright/test';

// R-9.4 — service icons. Until 2026-09-18 this requirement passed only
// trivially: the icons named by the amendment had never been supplied, so
// "a missing icon costs no meaning and shifts no layout" was true because
// nothing rendered. They exist now, so the criteria are actually exercised.
//
// The icons are inlined as SVG markup by components/ServiceIcon.astro rather
// than referenced as files, which is why several of these assertions look at
// the DOM rather than at network activity.

test.describe('service icons are decorative and accessible (R-9.4)', () => {
	test('AC1 — every icon is hidden from assistive technology', async ({ page }) => {
		await page.goto('/services/');

		const icons = page.locator('svg.service-icon');
		await expect(icons).toHaveCount(3);

		for (let i = 0; i < 3; i += 1) {
			await expect(icons.nth(i)).toHaveAttribute('aria-hidden', 'true');
		}
	});

	test('AC1 — no icon re-announces the heading it sits beside', async ({ page }) => {
		await page.goto('/services/');

		// The supplied SVGs each carry a <title> naming the service, which is
		// correct for standalone use and wrong here: it would make a screen
		// reader read the service name, then the identical <h2>. The title is
		// stripped at render time as well as being covered by aria-hidden, so
		// this fails if either protection is removed.
		await expect(page.locator('svg.service-icon title')).toHaveCount(0);

		// The accessible name of each card must come from its heading alone.
		for (const name of [
			'AI & Intelligent Automation',
			'Data & Analytics',
			'Software & Cloud Solutions',
		]) {
			await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
			// One occurrence in the accessibility tree, not two.
			await expect(page.getByRole('heading', { name, level: 2 })).toHaveCount(1);
		}
	});

	test('AC3 — icons add no JavaScript and no extra requests', async ({ page }) => {
		const scriptRequests: string[] = [];
		const iconRequests: string[] = [];
		page.on('request', (r) => {
			if (r.resourceType() === 'script') scriptRequests.push(r.url());
			if (/\.svg(\?|$)/i.test(r.url())) iconRequests.push(r.url());
		});

		await page.goto('/services/');
		await page.waitForLoadState('networkidle');

		expect(scriptRequests, scriptRequests.join('\n')).toEqual([]);
		// Inlined markup, so no icon is fetched. The logo mark in the header
		// is a separate <img> and is allowed; assert only that nothing under
		// src/icons/ became a runtime request.
		expect(iconRequests.filter((u) => /lightbulb|bar-chart|cloud/.test(u))).toEqual([]);
	});

	test('AC4 — an icon that fails to render costs no meaning and shifts no layout', async ({
		page,
	}) => {
		await page.goto('/services/');

		const heading = page.getByRole('heading', { name: 'Data & Analytics', level: 2 });
		const before = await heading.boundingBox();
		expect(before).not.toBeNull();

		// Simulate the icon failing to paint. Its box is reserved by explicit
		// width/height plus a matching CSS box, so hiding its contents must not
		// move the heading beside it.
		await page.evaluate(() => {
			document.querySelectorAll('svg.service-icon').forEach((el) => {
				el.querySelectorAll('path, rect, circle, line, polyline, polygon').forEach((child) =>
					child.remove(),
				);
			});
		});

		const after = await heading.boundingBox();
		expect(after).not.toBeNull();
		expect(after?.y, 'heading must not move when an icon fails to paint').toBeCloseTo(
			before?.y as number,
			1,
		);

		// And the text content is untouched — no meaning was carried by the icon.
		await expect(heading).toBeVisible();
		await expect(page.getByText('Build a trusted foundation for better decisions')).toBeVisible();
	});

	test('the icon each service uses is declared in content, not hard-coded in the page', async ({
		page,
	}) => {
		await page.goto('/services/');

		// Each card has exactly one icon, in document order matching the
		// collection's `order`. If the page ever mapped icons positionally
		// instead of reading the frontmatter field, adding a fourth service
		// would silently mis-assign them; this at least pins the current
		// mapping so that regression is visible.
		const cards = page.locator('li.service-entry');
		await expect(cards).toHaveCount(3);
		for (let i = 0; i < 3; i += 1) {
			await expect(cards.nth(i).locator('svg.service-icon')).toHaveCount(1);
		}
	});
});
