import { test, expect } from '@playwright/test';

// Contact (REQ-001 R-2.4). Email/booking link/copy come from
// src/content/contact/index.md. Both dev@haroonie.ai and the booking URL
// are owner-supplied real values (REQ-001 §4), not placeholders — see
// status/placeholder-content.md for why they're treated differently from
// the rest of that table's test data.

test.describe('email and booking link, both actionable (R-2.4 AC1)', () => {
	test('a mailto link to the enquiry mailbox is visible and actionable', async ({ page }) => {
		await page.goto('/contact/');

		const emailLink = page.getByRole('link', { name: 'dev@haroonie.ai' });
		await expect(emailLink).toBeVisible();
		await expect(emailLink).toHaveAttribute('href', 'mailto:dev@haroonie.ai');
	});

	test('a booking link is visible and actionable', async ({ page }) => {
		await page.goto('/contact/');

		const bookingLink = page.getByRole('link', { name: 'Book a time to talk' });
		await expect(bookingLink).toBeVisible();
		await expect(bookingLink).toHaveAttribute('href', 'https://www.haroonie.ai/booking');
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
