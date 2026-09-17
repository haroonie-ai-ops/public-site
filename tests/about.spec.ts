import { test, expect } from '@playwright/test';

// About (REQ-001 R-2.3). Bio content comes from src/content/about/index.md.
//
// R-2.3 AC1 requires "owner-approved biography content … with no placeholder
// markers." Until 2026-09-17 that could not be satisfied — no owner-supplied
// biography existed (E6) — so this suite deliberately did NOT assert AC1
// passed. It carried the real assertion as a `test.fixme` labelled "flip it
// on once real content lands", plus a second test that honestly documented
// the blocked state so the placeholder notice could not silently vanish
// without real content replacing it.
//
// 2026-09-17: the owner supplied the biography (E6; full review record and
// decisions in status/E6-copy-for-review.md §3). Both halves of that design
// are now discharged as intended:
//
//  1. The fixme is flipped on and is now a live, required assertion.
//  2. The "currently marked as placeholder" test is REPLACED, not deleted —
//     its premise (no real content exists) is factually obsolete, and a test
//     asserting the placeholder banner is visible would now fail for the
//     right reason. What replaces it asserts strictly more: that the real
//     biography is actually on the page, and that the interim holding line
//     is gone.
//
// R-8.3 AC1 check ("assertions are not weakened to achieve a pass"): this is
// not a weakening. Coverage moves from "the page admits it is a placeholder"
// to "the page carries the owner-approved biography and no placeholder
// markers" — which is what the acceptance criterion actually demands, and is
// a stricter condition than the one it replaces. No assertion was relaxed,
// removed, or made conditional to turn this suite green.

test.describe('owner-approved biography content (R-2.3 AC1)', () => {
	test('renders with no placeholder markers', async ({ page }) => {
		await page.goto('/about/');
		await expect(page.locator('[data-placeholder="true"]')).toHaveCount(0);
	});

	test('the owner-approved biography is present, not an interim holding line', async ({ page }) => {
		await page.goto('/about/');

		// The owner's chosen heading — a statement of position, deliberately
		// not a generic "About" label (review file §3.1).
		await expect(
			page.getByRole('heading', { level: 1, name: 'Technology should solve problems, not create new ones.' }),
		).toBeVisible();

		// Substantive biography copy actually rendered. Matched on a
		// distinctive phrase rather than the full paragraph, so ordinary
		// copy edits don't turn this into a change-detector, while replacing
		// the bio with nothing (or with another holding line) still fails.
		await expect(page.getByText('independent technology consultancy')).toBeVisible();

		// The pre-E6 interim line must be gone, not merely pushed below real
		// content.
		await expect(page.getByText('check back soon')).toHaveCount(0);
	});
});
