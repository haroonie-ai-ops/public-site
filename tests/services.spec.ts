import { test, expect } from '@playwright/test';

// Services (REQ-001 R-2.2). Entries come from the `services` content
// collection (src/content/services/*.md) — see src/content.config.ts.

test.describe('between two and six service entries, each with heading and description (R-2.2 AC1)', () => {
	test('renders a list of distinct service entries', async ({ page }) => {
		await page.goto('/services/');

		const headings = page.getByRole('heading', { level: 2 });
		const count = await headings.count();
		expect(count).toBeGreaterThanOrEqual(2);
		expect(count).toBeLessThanOrEqual(6);

		const titles = await headings.allTextContents();
		expect(new Set(titles).size, 'each entry heading must be distinct').toBe(titles.length);

		// Every entry must carry a heading AND a description — assert each
		// list item (the entry container) has non-empty text beyond just
		// its own heading.
		const entries = page.locator('li').filter({ has: page.getByRole('heading', { level: 2 }) });
		const entryCount = await entries.count();
		expect(entryCount).toBe(count);
		for (let i = 0; i < entryCount; i += 1) {
			const entry = entries.nth(i);
			const heading = await entry.getByRole('heading', { level: 2 }).textContent();
			const fullText = (await entry.textContent()) ?? '';
			const descriptionText = fullText.replace(heading ?? '', '').trim();
			expect(descriptionText.length, 'entry must have description text beyond its heading').toBeGreaterThan(0);
		}
	});
});

test.describe('CTA linking to Contact (R-2.2 AC2)', () => {
	test('a CTA to /contact/ is present', async ({ page }) => {
		await page.goto('/services/');

		const cta = page.getByRole('link', { name: 'Discuss your project' });
		await expect(cta).toBeVisible();
		await expect(cta).toHaveAttribute('href', '/contact/');
	});
});
