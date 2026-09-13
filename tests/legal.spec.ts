import { test, expect } from '@playwright/test';

// Legal pages (REQ-001 R-2.5). Content comes from src/content/legal/*.md.
// R-2.5 AC2 (footer links present on every page) is already covered by
// tests/smoke.spec.ts's footer describe block; this file covers R-2.5 AC1,
// which is specific to /privacy/.

test.describe('privacy policy states data collected, lawful basis, retention and rights (R-2.5 AC1)', () => {
	test('all four required sections are present with non-empty content', async ({ page }) => {
		await page.goto('/privacy/');

		await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();

		const sections: [name: string, headingName: string][] = [
			['what data is collected', 'What data we collect'],
			['the lawful basis', 'Lawful basis'],
			['the retention period', 'Retention period'],
			['how to exercise data subject rights', 'Your data protection rights'],
		];

		for (const [description, headingName] of sections) {
			const heading = page.getByRole('heading', { level: 2, name: headingName });
			await expect(heading, `must state ${description}`).toBeVisible();

			// The section's body text must be non-empty — not just a
			// heading with nothing underneath it.
			const section = page.locator('section', { has: heading });
			const text = (await section.textContent())?.replace(headingName, '').trim() ?? '';
			expect(text.length, `${headingName} section must have body text`).toBeGreaterThan(0);
		}
	});
});
