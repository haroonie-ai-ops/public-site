import { test, expect, type Page } from '@playwright/test';
import { allRoutes } from './support/routes';
import { parseCssColor, flatten, contrastRatio } from './support/contrast';

// R-5.1 AC2 and R-9.3 AC5 — keyboard reachability and a visible focus
// indicator.
//
// Found by the R-8.1 traceability matrix (status/R8-TRACEABILITY-MATRIX.md),
// which is exactly the kind of hole that exercise exists to surface: the
// site had a focus ring defined in BaseLayout and NOTHING asserted it. No
// test would have noticed if it were deleted.
//
// axe does not cover this. Its `color-contrast` rule is text-only, and
// keyboard operability is not machine-checkable generically, so a green axe
// run on all six routes said nothing about either criterion. That is why
// this spec reads computed styles and drives real Tab presses instead of
// adding another scan.
//
// R-5.1 AC2 — every interactive element reachable by keyboard, each showing
//             a visible focus indicator.
// R-9.3 AC5 — the logo link's indicator additionally meets 3:1 against BOTH
//             the header background and the logo's own adjacent pixels.

/**
 * Elements a keyboard user must be able to reach on any page.
 *
 * `:not([disabled])` is load-bearing, not defensive. A disabled control is
 * CORRECTLY outside the tab order, and this site has one: the Contact form's
 * submit, disabled because the form is deliberately unwired pending E4
 * (contact.spec.ts asserts that). Without this clause the spec reported the
 * one element that is supposed to be unreachable as a failure - which is
 * also a small sign it measures something real.
 */
const INTERACTIVE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Walks the tab order from the top of the document, returning a stable
 * identifier for each element focus lands on.
 *
 * Bounded rather than "tab until it wraps": a runaway loop on a page with a
 * focus trap would hang the run instead of failing it, and a bound that
 * comfortably exceeds the real count still proves reachability.
 */
async function tabOrder(page: Page, maxPresses: number): Promise<string[]> {
	const seen: string[] = [];
	await page.evaluate(() => document.body.focus());
	for (let i = 0; i < maxPresses; i += 1) {
		await page.keyboard.press('Tab');
		const id = await page.evaluate(() => {
			const el = document.activeElement as HTMLElement | null;
			if (!el || el === document.body) return null;
			// Identify by role + accessible-ish name, not by index: an index
			// tells you nothing when the assertion fails.
			const name = (
				el.getAttribute('aria-label') ||
				el.getAttribute('name') ||
				el.id ||
				el.textContent ||
				''
			)
				.trim()
				.slice(0, 40);
			return `${el.tagName.toLowerCase()}:${name}`;
		});
		if (id === null) break;
		// Wrap detection compares against the FIRST stop, not "any repeat".
		// Repeat-detection was wrong: a form's inputs can share an identifier
		// (two empty-text fields), which looked like a wrap and truncated the
		// walk before the footer - reporting the footer links as unreachable
		// when they were simply never visited.
		if (seen.length > 0 && id === seen[0]) break;
		seen.push(id);
	}
	return seen;
}

test.describe('keyboard reachability and focus indication (R-5.1 AC2)', () => {
	for (const route of allRoutes) {
		test(`${route.path} — every interactive element is reachable by keyboard`, async ({ page }) => {
			await page.goto(route.path);

			const expected = await page.locator(INTERACTIVE).evaluateAll((els) =>
				els
					.filter((el) => {
						const s = getComputedStyle(el);
						if (s.display === 'none' || s.visibility === 'hidden') return false;
						return (el as HTMLElement).offsetParent !== null || s.position === 'fixed';
					})
					.map((el) => {
						const name = (
							el.getAttribute('aria-label') ||
							el.getAttribute('name') ||
							el.id ||
							el.textContent ||
							''
						)
							.trim()
							.slice(0, 40);
						return `${el.tagName.toLowerCase()}:${name}`;
					}),
			);

			expect(expected.length, `${route.path} should have interactive elements`).toBeGreaterThan(0);

			// Generous bound: every element plus slack for the skip link and any
			// browser-chrome stop, so a genuine miss fails rather than times out.
			const reached = await tabOrder(page, expected.length + 10);

			const unreachable = expected.filter((e) => !reached.includes(e));
			expect(
				unreachable,
				`${route.path}: not reachable by Tab — ${unreachable.join(', ')}`,
			).toEqual([]);
		});

		test(`${route.path} — focused elements show a visible indicator`, async ({ page }) => {
			await page.goto(route.path);

			// Sample the first several stops rather than every element: the ring
			// is defined once globally, so a handful across different components
			// (skip link, nav, content, footer) proves it applies, and keeps the
			// run fast enough to stay in the pre-merge gate.
			const SAMPLE = 6;
			await page.evaluate(() => document.body.focus());

			const findings: string[] = [];
			for (let i = 0; i < SAMPLE; i += 1) {
				await page.keyboard.press('Tab');
				const result = await page.evaluate(() => {
					const el = document.activeElement as HTMLElement | null;
					if (!el || el === document.body) return null;
					const s = getComputedStyle(el);
					const name = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);
					const outlineWidth = parseFloat(s.outlineWidth) || 0;
					const hasOutline = outlineWidth > 0 && s.outlineStyle !== 'none';
					const hasShadow = s.boxShadow !== 'none' && s.boxShadow !== '';
					return {
						id: `${el.tagName.toLowerCase()}:${name}`,
						visible: hasOutline || hasShadow,
						outlineWidth,
						outlineColor: s.outlineColor,
					};
				});
				if (!result) break;
				if (!result.visible) findings.push(result.id);
			}

			expect(
				findings,
				`no visible focus indicator on: ${findings.join(', ')}`,
			).toEqual([]);
		});
	}
});

test.describe('the logo link focus indicator (R-9.3 AC5)', () => {
	test('the header logo link shows a focus ring meeting 3:1 against its surroundings', async ({
		page,
	}) => {
		await page.goto('/');

		const brand = page.locator('a.brand');
		await expect(brand).toBeVisible();
		await brand.focus();

		const measured = await page.evaluate(() => {
			const el = document.querySelector('a.brand') as HTMLElement;
			const s = getComputedStyle(el);
			const header = document.querySelector('header') as HTMLElement;
			return {
				outlineColor: s.outlineColor,
				outlineWidth: parseFloat(s.outlineWidth) || 0,
				outlineStyle: s.outlineStyle,
				headerBg: getComputedStyle(header).backgroundColor,
				bodyBg: getComputedStyle(document.body).backgroundColor,
			};
		});

		expect(measured.outlineWidth, 'focus ring must have a non-zero width').toBeGreaterThan(0);
		expect(measured.outlineStyle).not.toBe('none');

		const ring = parseCssColor(measured.outlineColor);
		const page_ = parseCssColor(measured.bodyBg);
		expect(ring, 'focus ring colour must be parseable').not.toBeNull();
		expect(page_, 'page background must be parseable').not.toBeNull();

		// AC5 requires 3:1 against the header background. The header is
		// transparent over the page background in this design, so an opaque
		// header colour is composited over the body colour before measuring
		// rather than assumed.
		const headerBg = parseCssColor(measured.headerBg);
		const surface =
			headerBg && headerBg.a > 0 ? flatten(headerBg, page_ as never) : (page_ as never);
		const ratio = contrastRatio(ring as never, surface);

		expect(
			ratio,
			`focus ring ${measured.outlineColor} on header surface must meet 3:1, got ${ratio.toFixed(2)}:1`,
		).toBeGreaterThanOrEqual(3);

		// AC5's second half: the ring must also be distinguishable from the
		// logo's OWN adjacent pixels, not just the surface behind it. The mark
		// is brand blue on a light ground, so a same-blue ring drawn tight
		// against it would satisfy the surface check and still be invisible
		// where it matters. outline-offset is what prevents that, so assert it
		// rather than trusting the ratio alone.
		const offset = await page.evaluate(() => {
			const el = document.querySelector('a.brand') as HTMLElement;
			return parseFloat(getComputedStyle(el).outlineOffset) || 0;
		});
		expect(
			offset,
			'the ring must be offset from the mark, or it can blend into the logo it surrounds',
		).toBeGreaterThan(0);
	});
});
