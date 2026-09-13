import { test, expect } from '@playwright/test';

// About (REQ-001 R-2.3). Bio content comes from src/content/about/index.md.
//
// R-2.3 AC1 requires "owner-approved biography content … with no
// placeholder markers." That literally cannot be satisfied until the owner
// supplies real biography copy (E6) — see status/STATUS.md and
// status/placeholder-content.md. Per REQ-001 R-8.3 ("assertions are not
// weakened to achieve a pass"), this suite does not assert AC1 passes. The
// test below is a fixme documenting the assertion AC1 actually requires —
// flip it on once real content lands — plus a separate, currently-passing
// test that honestly documents today's blocked state so a regression (the
// placeholder notice silently disappearing without real content replacing
// it) would still be caught.

test.describe('owner-approved biography content (R-2.3 AC1)', () => {
	test.fixme(
		'renders with no placeholder markers — BLOCKED on E6 (owner-supplied biography)',
		async ({ page }) => {
			await page.goto('/about/');
			await expect(page.locator('[data-placeholder="true"]')).toHaveCount(0);
		},
	);

	test('current state is honestly marked as placeholder, not silently passed off as final', async ({
		page,
	}) => {
		await page.goto('/about/');
		await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
		await expect(page.locator('[data-placeholder="true"]')).toBeVisible();
	});
});
