import { test, expect } from '@playwright/test';

// Contact (REQ-001 R-2.4). Email and copy come from
// src/content/contact/index.md. dev@haroonie.ai is an owner-supplied real
// value (REQ-001 §4), not a placeholder.
//
// BOOKING LINK — R-8.3 AC1 DISCLOSURE (2026-09-17). This suite previously
// asserted "a booking link is visible and actionable" for R-2.4 AC1. That
// assertion is now a `test.fixme`, which IS a reduction in active coverage
// and therefore requires a recorded, owner-approved justification under
// R-8.3 AC1. That justification:
//
//   Owner instruction, verbatim: "b: proceed with the waiver for now."
//   (2026-09-17, first-hand, following "A: ignore for now" — i.e. do not
//   pursue a scheduling URL yet.)
//
// The waiver is recorded against the requirement itself in REQ-001 R-2.4.
// Context that matters for judging it: AC1's booking clause was ALREADY
// failing in production — the link pointed at https://www.haroonie.ai/
// booking, which returns 404, so it was visible but not actionable. The
// old assertion did not catch that, because it compared the href STRING
// and never requested the URL (the same class of gap as QA-005 Finding 2:
// asserting on markup instead of on the real thing). So this change does
// not conceal a working behaviour; it stops asserting a criterion the
// owner has explicitly, temporarily waived, and replaces it with a
// stricter guard against the failure mode that actually occurred.
//
// Restoring coverage is deliberately trivial: set bookingUrl/bookingLabel
// in the content file and flip the fixme below — the same pattern
// tests/about.spec.ts used while R-2.3 AC1 was blocked on E6.

test.describe('enquiry contact methods (R-2.4 AC1 — booking clause waived 2026-09-17)', () => {
	test('a mailto link to the enquiry mailbox is visible and actionable', async ({ page }) => {
		await page.goto('/contact/');

		const emailLink = page.getByRole('link', { name: 'dev@haroonie.ai' });
		await expect(emailLink).toBeVisible();
		await expect(emailLink).toHaveAttribute('href', 'mailto:dev@haroonie.ai');
	});

	test('the published telephone number is visible and actionable', async ({ page }) => {
		await page.goto('/contact/');

		// Owner-supplied in answer to E18 (REQ-001-A3). Asserts the tel: href
		// is E.164 — a human-formatted string in the href does not reliably
		// dial — while the visible text stays in the readable form.
		const phoneLink = page.getByRole('link', { name: '(312) 970-9638' });
		await expect(phoneLink).toBeVisible();
		await expect(phoneLink).toHaveAttribute('href', 'tel:+13129709638');

		// Guard: the brand sheet's business card carries (312) 555-0100, which
		// is in the NANP reserved fictional range and must never be published
		// (REQ-001 §1.3). Fails loudly if it is ever copied in from the sheet.
		await expect(page.getByText('555-0100')).toHaveCount(0);
	});

	test.fixme(
		'a booking link is visible and actionable — WAIVED (owner, 2026-09-17) pending a real scheduling URL',
		async ({ page }) => {
			await page.goto('/contact/');

			const bookingLink = page.getByRole('link', { name: 'Book a time to talk' });
			await expect(bookingLink).toBeVisible();

			// Deliberately stronger than the assertion this replaces: fetch the
			// target rather than string-compare the href, so a link that exists
			// but 404s fails. The old form could not detect exactly the defect
			// that was live in production for several waves.
			const href = await bookingLink.getAttribute('href');
			expect(href).toBeTruthy();
			const response = await page.request.get(href as string, { failOnStatusCode: false });
			expect(response.status(), `booking link ${href} must resolve, not 404`).toBeLessThan(400);
		},
	);

	test('no dead booking link is rendered while the link is waived', async ({ page }) => {
		await page.goto('/contact/');

		// The waiver permits ABSENCE of a booking link. It does not permit a
		// broken one — that was the pre-existing R-2.4 AC1 failure this
		// change removes. Guards against the reserved /booking path (or any
		// other dead booking affordance) quietly reappearing.
		await expect(page.getByRole('link', { name: 'Book a time to talk' })).toHaveCount(0);
		await expect(page.locator('a[href*="/booking"], a[href*="/book"]')).toHaveCount(0);
	});
});

test.describe('enquiry form markup — name, email, message, each labelled (R-2.4 AC2)', () => {
	test('name, email and message fields each have a programmatically associated label', async ({
		page,
	}) => {
		await page.goto('/contact/');

		// Exact matching: the "Send a message" section heading's accessible
		// name (via aria-labelledby on the surrounding <section>) contains
		// the substring "message", which would otherwise also match
		// getByLabel('Message')'s default substring matching.
		await expect(page.getByLabel('Name', { exact: true })).toBeVisible();
		await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
		await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
	});

	test('the form is not wired up yet — no action attribute, submit disabled (Wave 5 / E4 scope)', async ({
		page,
	}) => {
		await page.goto('/contact/');

		const form = page.locator('form');
		await expect(form).not.toHaveAttribute('action', /.+/);
		await expect(page.getByRole('button', { name: /send message/i })).toBeDisabled();
	});
});
