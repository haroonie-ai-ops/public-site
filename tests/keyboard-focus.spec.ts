import { test, expect, type Page } from '@playwright/test';
import { allRoutes } from './support/routes';
import { parseCssColor, flatten, contrastRatio, type Rgb } from './support/contrast';
import { decodePng } from './support/png';

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
//
// REWRITTEN BY QA-006 Finding 4, which made three fair criticisms of the
// first version and each is addressed below rather than argued with:
//
//  1. The indicator check sampled only the first six tab stops — on every
//     route, the shared header and nothing else. Footer legal links and the
//     Contact form's inputs were never checked on any page. The in-code
//     justification ("the ring is defined once globally") was an assumption
//     about the CSS, not a property the test established. It now walks the
//     entire tab order.
//  2. "Visible" was `hasOutline || hasShadow`, where `hasShadow` was any
//     non-`none` box-shadow, never compared against the UNFOCUSED state. An
//     element with a decorative box-shadow and `outline: none` on focus
//     passed while having no focus indicator at all. Every stop's focused
//     style is now diffed against its own unfocused style.
//  3. R-9.3 AC5's second half was substituted by `outline-offset > 0`. It is
//     now measured from rendered pixels.

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

/** What a focus indicator can be made of, read before and after focus. */
interface IndicatorStyle {
	outlineWidth: number;
	outlineStyle: string;
	outlineColor: string;
	boxShadow: string;
}

/**
 * Stamp every interactive element with an index and record its style while
 * NOTHING is focused, so each stop's focused style has something of its own
 * to be compared against.
 *
 * Two passes rather than one because there is no way to read an element's
 * unfocused style while it is focused, and blurring mid-walk would break the
 * Tab sequence the walk depends on. Nothing is focused on load, so the first
 * pass is taken in a genuinely unfocused document.
 */
async function stampAndRecordUnfocused(
	page: Page,
	selector: string,
): Promise<Record<string, IndicatorStyle>> {
	return page.evaluate((sel) => {
		const read = (el: Element): IndicatorStyle => {
			const s = getComputedStyle(el);
			return {
				outlineWidth: Number.parseFloat(s.outlineWidth) || 0,
				outlineStyle: s.outlineStyle,
				outlineColor: s.outlineColor,
				boxShadow: s.boxShadow,
			};
		};
		const out: Record<string, IndicatorStyle> = {};
		Array.from(document.querySelectorAll(sel)).forEach((el, i) => {
			const key = String(i);
			el.setAttribute('data-kf', key);
			out[key] = read(el);
		});
		return out;
	}, selector);
}

interface Stop {
	/** The `data-kf` index, or null for a stop that is not in the stamped set. */
	key: string | null;
	id: string;
	focused: IndicatorStyle;
}

/**
 * Walk the tab order from the top of the document, returning each element
 * focus lands on together with its focused style.
 *
 * Bounded rather than "tab until it wraps": a runaway loop on a page with a
 * focus trap would hang the run instead of failing it, and a bound that
 * comfortably exceeds the real count still proves reachability.
 */
async function tabOrder(page: Page, maxPresses: number): Promise<Stop[]> {
	const seen: Stop[] = [];
	await page.evaluate(() => document.body.focus());
	for (let i = 0; i < maxPresses; i += 1) {
		await page.keyboard.press('Tab');
		const stop = await page.evaluate(() => {
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
			const s = getComputedStyle(el);
			return {
				key: el.getAttribute('data-kf'),
				id: `${el.tagName.toLowerCase()}:${name}`,
				focused: {
					outlineWidth: Number.parseFloat(s.outlineWidth) || 0,
					outlineStyle: s.outlineStyle,
					outlineColor: s.outlineColor,
					boxShadow: s.boxShadow,
				},
			};
		});
		if (stop === null) break;
		// Wrap detection compares against the FIRST stop's identity, not "any
		// repeat". Repeat-detection was wrong: a form's inputs can share an
		// identifier (two empty-text fields), which looked like a wrap and
		// truncated the walk before the footer - reporting the footer links as
		// unreachable when they were simply never visited.
		//
		// Keyed on `data-kf` where it exists, which is stronger than the
		// display name and closes QA-006's minor soundness note: two distinct
		// elements sharing a truncated identifier no longer look like the same
		// element.
		if (seen.length > 0 && identityOf(stop) === identityOf(seen[0])) break;
		seen.push(stop);
	}
	return seen;
}

function identityOf(stop: Stop): string {
	return stop.key !== null ? `#${stop.key}` : stop.id;
}

/**
 * Does focusing this element actually draw something that was not there
 * before?
 *
 * The comparison against the unfocused style is the whole point. Asking only
 * "is there an outline or a box-shadow" — what this used to do — is satisfied
 * by a decorative shadow that is present whether the element is focused or
 * not, which is the absence of a focus indicator, not the presence of one.
 */
function indicatorAppeared(unfocused: IndicatorStyle, focused: IndicatorStyle): boolean {
	const outlineDrawn =
		focused.outlineWidth > 0 &&
		focused.outlineStyle !== 'none' &&
		(focused.outlineWidth !== unfocused.outlineWidth ||
			focused.outlineStyle !== unfocused.outlineStyle ||
			focused.outlineColor !== unfocused.outlineColor);

	const shadowDrawn = focused.boxShadow !== 'none' && focused.boxShadow !== unfocused.boxShadow;

	return outlineDrawn || shadowDrawn;
}

test.describe('keyboard reachability and focus indication (R-5.1 AC2)', () => {
	for (const route of allRoutes) {
		test(`${route.path} — every interactive element is reachable by keyboard`, async ({ page }) => {
			await page.goto(route.path);
			await stampAndRecordUnfocused(page, INTERACTIVE);

			const expected = await page.locator(INTERACTIVE).evaluateAll((els) =>
				els
					.filter((el) => {
						const s = getComputedStyle(el);
						if (s.display === 'none' || s.visibility === 'hidden') return false;
						return (el as HTMLElement).offsetParent !== null || s.position === 'fixed';
					})
					.map((el) => `#${el.getAttribute('data-kf')}`),
			);

			expect(expected.length, `${route.path} should have interactive elements`).toBeGreaterThan(0);

			// Generous bound: every element plus slack for the skip link and any
			// browser-chrome stop, so a genuine miss fails rather than times out.
			const reached = (await tabOrder(page, expected.length + 10)).map(identityOf);

			const unreachable = expected.filter((e) => !reached.includes(e));
			expect(
				unreachable,
				`${route.path}: not reachable by Tab — ${unreachable.join(', ')}`,
			).toEqual([]);
		});

		test(`${route.path} — every focused element draws an indicator it did not have unfocused`, async ({
			page,
		}) => {
			await page.goto(route.path);
			const unfocused = await stampAndRecordUnfocused(page, INTERACTIVE);

			const count = await page.locator(INTERACTIVE).count();
			// The WHOLE tab order, not a sample. QA-006 Finding 4.1: the first
			// six stops on every route are the skip link, the logo and the four
			// nav links — the shared header. Stopping there meant the footer's
			// legal links and the Contact form's fields were never checked for
			// an indicator on any page. The run cost of walking the rest is a
			// few hundred milliseconds.
			const stops = await tabOrder(page, count + 10);

			expect(stops.length, `${route.path}: the tab order was empty`).toBeGreaterThan(0);

			const findings: string[] = [];
			let compared = 0;

			for (const stop of stops) {
				if (stop.key === null || !(stop.key in unfocused)) {
					// A stop outside the stamped set is a real finding, not
					// something to skip: it means Tab reached something the
					// interactive-element selector does not describe.
					findings.push(`${stop.id} — focus reached an element outside the stamped set`);
					continue;
				}
				compared += 1;
				if (!indicatorAppeared(unfocused[stop.key], stop.focused)) {
					findings.push(
						`${stop.id} — focused style is indistinguishable from its unfocused style ` +
							`(outline ${stop.focused.outlineWidth}px ${stop.focused.outlineStyle}, ` +
							`box-shadow ${stop.focused.boxShadow})`,
					);
				}
			}

			expect(
				compared,
				`${route.path}: no element's focused style was compared against its unfocused style`,
			).toBeGreaterThan(0);
			expect(
				findings,
				`${route.path}: no visible focus indicator on:\n  ${findings.join('\n  ')}`,
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
			const rect = el.getBoundingClientRect();
			return {
				outlineColor: s.outlineColor,
				outlineWidth: Number.parseFloat(s.outlineWidth) || 0,
				outlineOffset: Number.parseFloat(s.outlineOffset) || 0,
				outlineStyle: s.outlineStyle,
				headerBg: getComputedStyle(header).backgroundColor,
				bodyBg: getComputedStyle(document.body).backgroundColor,
				box: {
					x: rect.left + window.scrollX,
					y: rect.top + window.scrollY,
					width: rect.width,
					height: rect.height,
				},
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
			headerBg && headerBg.a > 0 ? flatten(headerBg, page_ as Rgb) : (page_ as Rgb);
		const ratio = contrastRatio(ring as Rgb, surface);

		expect(
			ratio,
			`focus ring ${measured.outlineColor} on header surface must meet 3:1, got ${ratio.toFixed(2)}:1`,
		).toBeGreaterThanOrEqual(3);

		// AC5's second half: the ring must also be distinguishable from the
		// logo's OWN adjacent pixels, not just the surface behind it. The mark
		// is brand blue on a light ground, so a same-blue ring drawn tight
		// against it would satisfy the surface check and still be invisible
		// where it matters.
		//
		// QA-006 Finding 4.3 was right that `outline-offset > 0` is a proxy for
		// that, not a measurement of it. It is now measured — but measured as
		// what it actually is, which took one wrong attempt to get right.
		//
		// The naive reading fails. The ring is `--focus`, i.e. `--brand-royal`
		// #155BEF, and the mark is drawn in gradients BETWEEN #155BEF and
		// #2E83FF. Ring against mark is 1.00:1. No choice of colours fixes
		// that while keeping the ring on-brand, and it is not what AC5 is
		// asking for: what makes the ring visible against a logo of its own
		// colour is SEPARATION, which is precisely what `outline-offset` buys.
		//
		// So the thing to measure is the separating band: the `outline-offset`
		// pixels of page surface lying between the element's border box and
		// the ring. If that band contrasts at 3:1 with the ring, the ring has
		// a visible edge no matter what colour the logo inside it is.
		//
		// Sampled one pixel out from the border box, not across the whole
		// band, and with the corners excluded. Both are geometry, not leniency:
		// `getBoundingClientRect` returns fractional CSS pixels, so the
		// outermost row of the band is antialiased against the ring and reads
		// as ring colour (that is the failure this first produced); and the
		// ring follows the element's border radius, so it cuts diagonally
		// inside the box corners.
		expect(
			measured.outlineOffset,
			'the ring must be offset from the mark, or it can blend into the logo it surrounds',
		).toBeGreaterThanOrEqual(2);

		const shot = await page.screenshot({ fullPage: true });
		const image = decodePng(Buffer.from(shot));
		const documentWidth = await page.evaluate(
			() => document.documentElement.scrollWidth || window.innerWidth,
		);
		const scale = image.width / documentWidth;


		const x0 = Math.round(measured.box.x * scale);
		const y0 = Math.round(measured.box.y * scale);
		const x1 = Math.round((measured.box.x + measured.box.width) * scale);
		const y1 = Math.round((measured.box.y + measured.box.height) * scale);

		let worst = Number.POSITIVE_INFINITY;
		let worstPixel = '';
		let sampled = 0;

		const consider = (x: number, y: number) => {
			if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
			const i = (y * image.width + x) * 4;
			const behind: Rgb = { r: image.data[i], g: image.data[i + 1], b: image.data[i + 2], a: 1 };
			const r = contrastRatio(flatten(ring as Rgb, behind), behind);
			sampled += 1;
			if (r < worst) {
				worst = r;
				worstPixel = `rgb(${behind.r}, ${behind.g}, ${behind.b}) at ${x},${y}`;
			}
		};

		// One pixel out from the border box — inside the band for any offset of
		// 2 or more, which the assertion above guarantees.
		const d = 1;
		// Skip a quarter of each edge at both ends, so no sample lands where
		// the rounded ring cuts across the corner.
		const insetX = Math.round((x1 - x0) * 0.25);
		const insetY = Math.round((y1 - y0) * 0.25);

		for (let x = x0 + insetX; x <= x1 - insetX; x += 1) {
			consider(x, y0 - d);
			consider(x, y1 + d);
		}
		for (let y = y0 + insetY; y <= y1 - insetY; y += 1) {
			consider(x0 - d, y);
			consider(x1 + d, y);
		}

		expect(
			sampled,
			'no pixels were sampled between the logo and its focus ring — the ring is drawn flush ' +
				'against the mark, which is the failure R-9.3 AC5 names',
		).toBeGreaterThan(0);

		expect(
			worst,
			`the focus ring ${measured.outlineColor} must be distinguishable from the pixels between ` +
				`it and the logo; worst is ${worstPixel} at ${worst.toFixed(2)}:1, needs 3:1`,
		).toBeGreaterThanOrEqual(3);
	});
});
