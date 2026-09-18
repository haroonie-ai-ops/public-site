import { test, expect } from '@playwright/test';

// Contact (REQ-001 R-2.4). Email and copy come from
// src/content/contact/index.md. dev@haroonie.ai is an owner-supplied real
// value (REQ-001 §4), not a placeholder.
//
// BOOKING LINK — R-8.3 AC1 DISCLOSURE, updated 2026-09-18.
//
// History, because the shape of this matters: this suite once asserted "a
// booking link is visible and actionable" for R-2.4 AC1. On 2026-09-17 that
// assertion became a `test.fixme` under an interim owner waiver, and the
// disclosure recorded here said it would be flipped back on once a
// scheduling URL existed.
//
// On 2026-09-18 the owner CANCELLED the booking link outright ("Cancel e22
// and p17"), and R-2.4 AC1's booking clause was struck from the requirement
// rather than left permanently waived. The fixme is therefore REMOVED, not
// re-enabled: it asserted a criterion that no longer exists, and a pending
// test for a cancelled requirement is misleading — it implies work is owed.
//
// This is not a weakening under R-8.3 AC1. Nothing that the product is still
// required to do lost coverage; the requirement itself was withdrawn by the
// owner, which is the one thing that legitimately removes an assertion. The
// email half of AC1 is untouched and still asserted immediately above, and a
// published telephone number is asserted alongside it.
//
// The ACTIVE guard below is deliberately KEPT and strengthened in meaning.
// The original defect was a booking link that rendered but 404'd, invisible
// to a test that compared the href string without ever fetching it. That
// class of defect is still possible if a link is ever reintroduced casually,
// so the guard remains as a standing prohibition rather than a temporary
// condition of the waiver.

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


	test('no booking link is rendered, dead or otherwise (R-2.4 AC1 booking clause struck)', async ({ page }) => {
		await page.goto('/contact/');

		// The booking clause is struck, so absence is now the specified state
		// rather than a tolerated one. This also remains the guard against the
		// original defect — a link that renders but 404s — if one is ever
		// reintroduced without a working destination.
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
