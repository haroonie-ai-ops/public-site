import { test, expect, type Page } from '@playwright/test';
import { allRoutes } from './support/routes';
import { parseCssColor, flatten, contrastRatio, type Rgb } from './support/contrast';
import { decodePng } from './support/png';

// Colour contrast, measured.
//
// WHY THIS FILE EXISTS — QA-006 Finding 2. Six acceptance criteria were
// recorded as AUTOMATED in status/R8-TRACEABILITY-MATRIX.md against
// `brand-tokens.spec.ts`: R-5.1 AC3, R-5.1 AC5, R-5.1 AC6, R-9.5 AC1,
// R-9.5 AC2 and R-9.5 AC3. The Tester opened that file and found none of
// them in it. `grep -rn "4\.5" tests/` returned nothing across the whole
// suite, and no test used a 768px viewport at all. The analysis those
// criteria demand HAD been done — it is written into
// `src/pages/index.astro`'s frontmatter, with the ratios worked out — but a
// source comment is not a gate. Change `--surface-subtle`, or point the CTA
// at `--accent-decor`, and nothing would have failed. That is precisely the
// hole `keyboard-focus.spec.ts` was written to close for the focus ring, and
// it was not closed for the palette.
//
// WHAT axe ALREADY DOES, so this file does not duplicate it.
// `accessibility.spec.ts` runs axe-core on all six routes and its
// `color-contrast` rule is serious-impact, so ordinary text on a solid
// computed background IS gated today. R-9.5's own text says where that stops:
// "it covers the two cases axe cannot compute at all: text over imagery
// (AC3), and contrast at viewport widths other than the one scanned". Those
// two, plus R-9.5's specific palette prohibitions, are what is added here.
//
// The three groups below map onto the criteria:
//   - every text pairing, per element, against its real backdrop
//     (R-5.1 AC3, R-5.1 AC5, R-9.5 AC1 first half)
//   - the palette prohibition and the solid-fill button rule
//     (R-9.5 AC1 second half, R-9.5 AC2)
//   - text over the gradient, sampled from rendered pixels, at
//     320 / 768 / 1920 (R-9.5 AC3, R-5.1 AC6)

/** WCAG 2.2 SC 1.4.3 thresholds. */
const AA_BODY = 4.5;
const AA_LARGE = 3;

/**
 * WCAG's definition of large text: at least 18pt (24px), or 14pt (18.66px)
 * when bold. Written out rather than rounded to 18/24 because the 18.66
 * boundary is where `--text-lg` sits on this site, and rounding it the wrong
 * way would silently move a real pairing into the looser bucket.
 */
function isLargeText(fontPx: number, weight: number): boolean {
	return fontPx >= 24 || (fontPx >= 18.66 && weight >= 700);
}

const WHITE: Rgb = { r: 255, g: 255, b: 255, a: 1 };

/**
 * Composite a stack of background layers, nearest-first, over an opaque
 * white page backdrop — the colour a visitor's eye actually receives behind
 * the glyph, not the nearest declared value.
 */
function resolveBackground(stack: string[]): Rgb {
	let surface = WHITE;
	for (let i = stack.length - 1; i >= 0; i -= 1) {
		const layer = parseCssColor(stack[i]);
		if (!layer) throw new Error(`Unparseable background layer: ${stack[i]}`);
		surface = flatten(layer, surface);
	}
	return surface;
}

function cssOf(c: Rgb): string {
	return `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
}

interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface TextSample {
	id: string;
	color: string;
	bgStack: string[];
	fontPx: number;
	weight: number;
	overImage: boolean;
	box: Box | null;
}

/**
 * Collect every element that renders its own text, with the background
 * layers behind it.
 *
 * Deliberately returns raw CSS strings and lets the caller do the colour
 * maths with `support/contrast.ts`, rather than reimplementing relative
 * luminance inside `page.evaluate`. One implementation of the arithmetic,
 * shared with `keyboard-focus.spec.ts` and `brand-tokens.spec.ts`, means a
 * bug in it fails everywhere instead of disagreeing between files.
 */
async function collectTextSamples(page: Page): Promise<TextSample[]> {
	return page.evaluate(() => {
		const results: TextSample[] = [];
		const seen = new Set<Element>();

		const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
		let node: Node | null = walker.nextNode();
		for (; node !== null; node = walker.nextNode()) {
			const text = (node.textContent ?? '').trim();
			if (!text) continue;
			const el = node.parentElement;
			if (!el || seen.has(el)) continue;
			if (/^(script|style|noscript|template|title)$/i.test(el.tagName)) continue;
			seen.add(el);

			const s = getComputedStyle(el);
			if (s.display === 'none' || s.visibility === 'hidden') continue;
			if (Number.parseFloat(s.opacity) === 0) continue;

			// Walk up compositing background layers until an opaque one is
			// found. A `background-image` anywhere in that chain means the
			// computed-colour answer is not the real one — a gradient leaves
			// `background-color` transparent, so the walk sails past it and
			// reports the page's flat backdrop instead. Those elements are
			// routed to the pixel-sampling group rather than measured here
			// against a surface that is not behind them.
			const bgStack: string[] = [];
			let overImage = false;
			let cursor: Element | null = el;
			while (cursor) {
				const cs = getComputedStyle(cursor);
				if (cs.backgroundImage && cs.backgroundImage !== 'none') overImage = true;
				const bg = cs.backgroundColor;
				const alpha = bg.startsWith('rgba')
					? Number.parseFloat(bg.split(',')[3] ?? '1')
					: bg === 'transparent'
						? 0
						: 1;
				if (alpha > 0) {
					bgStack.push(bg);
					if (alpha >= 1) break;
				}
				cursor = cursor.parentElement;
			}

			const cls = typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '';
			const rect = el.getBoundingClientRect();
			results.push({
				id: el.tagName.toLowerCase() + (cls ? '.' + cls : '') + ' [' + text.slice(0, 40) + ']',
				color: s.color,
				bgStack,
				fontPx: Number.parseFloat(s.fontSize),
				weight: Number.parseFloat(s.fontWeight) || 400,
				overImage,
				box:
					rect.width > 0 && rect.height > 0
						? {
								x: rect.left + window.scrollX,
								y: rect.top + window.scrollY,
								width: rect.width,
								height: rect.height,
							}
						: null,
			});
		}
		return results;
	});
}

test.describe('every text pairing meets its threshold (R-5.1 AC3, R-5.1 AC5, R-9.5 AC1)', () => {
	for (const route of allRoutes) {
		test(`${route.path} — computed contrast for every text element`, async ({ page }) => {
			await page.goto(route.path);
			const samples = await collectTextSamples(page);

			const failures: string[] = [];
			let measured = 0;

			for (const sample of samples) {
				// Handled by the gradient group below, against real pixels.
				if (sample.overImage) continue;

				const fg = parseCssColor(sample.color);
				expect(fg, `unparseable colour ${sample.color} on ${sample.id}`).not.toBeNull();

				const surface = resolveBackground(sample.bgStack);
				const ratio = contrastRatio(flatten(fg as Rgb, surface), surface);
				const large = isLargeText(sample.fontPx, sample.weight);
				const required = large ? AA_LARGE : AA_BODY;
				measured += 1;

				if (ratio < required) {
					failures.push(
						`${sample.id} — ${sample.color} on ${cssOf(surface)} = ${ratio.toFixed(2)}:1, ` +
							`needs ${required}:1 (${sample.fontPx}px / weight ${sample.weight}${large ? ', large text' : ''})`,
					);
				}
			}

			// A green result here must mean "every pairing was checked and
			// passed", never "nothing was checked". Without this, the test would
			// pass just as happily against a blank page.
			expect(measured, `${route.path}: no text pairing was measured at all`).toBeGreaterThan(5);
			expect(failures, `${route.path} contrast failures:\n  ${failures.join('\n  ')}`).toEqual([]);
		});
	}
});

test.describe('the palette prohibitions the ratios imply (R-9.5 AC1, R-9.5 AC2)', () => {
	// R-9.5 AC1, second half, verbatim: "#2E83FF and #66B4FF are never the
	// foreground of body text on a light background (§3.2 computes them at
	// 3.62:1 and 2.20:1)".
	//
	// This is a different assertion from the ratio check above, and both are
	// needed. The ratio check would catch Bright used as body text today —
	// but only as long as the surface behind it stays light. The prohibition
	// is on the VALUE, and REQ-001 states it as a value, so it is asserted as
	// one. It is also the cheapest possible guard against the exact mistake
	// BaseLayout's own comment records having already been made once: the
	// active-nav underline "was first set in --brand-bright ... axe failed
	// it".
	const FORBIDDEN_AS_BODY_TEXT = [
		{ name: '--brand-bright #2E83FF', rgb: 'rgb(46, 131, 255)' },
		{ name: '--brand-light #66B4FF', rgb: 'rgb(102, 180, 255)' },
	];

	for (const route of allRoutes) {
		test(`${route.path} — bright and light blue are never body-text foreground`, async ({
			page,
		}) => {
			await page.goto(route.path);
			const samples = await collectTextSamples(page);

			const offenders = samples
				.filter((s) => !isLargeText(s.fontPx, s.weight))
				.filter((s) => FORBIDDEN_AS_BODY_TEXT.some((f) => f.rgb === s.color))
				.map((s) => `${s.id} uses ${s.color}`);

			expect(
				offenders,
				`R-9.5 AC1 forbids ${FORBIDDEN_AS_BODY_TEXT.map((f) => f.name).join(' and ')} ` +
					`as body-text foreground:\n  ${offenders.join('\n  ')}`,
			).toEqual([]);
		});
	}

	// R-9.5 AC2: "Given any solid-filled button or other call-to-action, When
	// its label's contrast against its OWN FILL is measured, Then it is at
	// least 4.5:1 — so a white label sits on #155BEF (5.56:1) or #0A2A87
	// (12.40:1), never on #2E83FF (3.62:1)."
	//
	// "Against its own fill" is why this cannot be folded into the group
	// above: that group resolves whatever opaque surface it finds first, which
	// for a solid button IS its own fill, but the criterion is specifically
	// about the element's own declared background and must fail if a button
	// ever loses its fill and inherits the page's.
	test('every solid-filled CTA label clears 4.5:1 on its own fill, site-wide', async ({ page }) => {
		const failures: string[] = [];
		const exempted: string[] = [];
		let solidFilled = 0;

		for (const route of allRoutes) {
			await page.goto(route.path);

			const controls = await page.evaluate(() => {
				const selector = 'a.btn, button, [role="button"], input[type="submit"]';
				return Array.from(document.querySelectorAll(selector))
					.filter((el) => {
						const s = getComputedStyle(el);
						return s.display !== 'none' && s.visibility !== 'hidden';
					})
					.map((el) => {
						const s = getComputedStyle(el);
						const label = (el.textContent || (el as HTMLInputElement).value || '').trim();
						const cls = typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '';
						return {
							id: el.tagName.toLowerCase() + (cls ? '.' + cls : '') + ' [' + label.slice(0, 30) + ']',
							color: s.color,
							ownFill: s.backgroundColor,
							fontPx: Number.parseFloat(s.fontSize),
							weight: Number.parseFloat(s.fontWeight) || 400,
							disabled: (el as HTMLButtonElement).disabled === true,
						};
					});
			});

			for (const c of controls) {
				const fill = parseCssColor(c.ownFill);
				// A control with no fill of its own is not a "solid-filled
				// button" and AC2 does not reach it; its label is already
				// covered as ordinary text by the group above.
				if (!fill || fill.a === 0) continue;

				// A disabled control is exempt from SC 1.4.3 under WCAG's
				// "incidental" clause, and this site has exactly one: the
				// Contact form's submit, deliberately unwired pending E4
				// (contact.spec.ts asserts that). Listed rather than silently
				// filtered, so the exemption cannot quietly grow to cover an
				// enabled control.
				if (c.disabled) {
					exempted.push(`${route.path} ${c.id}`);
					continue;
				}

				solidFilled += 1;
				const surface = flatten(fill, WHITE);
				const fg = parseCssColor(c.color);
				if (!fg) throw new Error(`Unparseable label colour ${c.color} on ${c.id}`);
				const ratio = contrastRatio(flatten(fg, surface), surface);
				const required = isLargeText(c.fontPx, c.weight) ? AA_LARGE : AA_BODY;

				if (ratio < required) {
					failures.push(
						`${route.path} ${c.id} — label ${c.color} on own fill ${c.ownFill} ` +
							`= ${ratio.toFixed(2)}:1, needs ${required}:1`,
					);
				}
			}
		}

		// Site-wide, not per route. Three of the six routes (/about/, /privacy/,
		// /terms/) legitimately carry no filled button at all, so a per-route
		// "at least one" guard failed on pages that were entirely correct. The
		// guard still has to exist somewhere — a green result must mean the
		// CTAs were measured, not that none were found — so it is asserted
		// across the whole site instead.
		expect(
			solidFilled,
			'no solid-filled CTA was measured anywhere on the site — R-9.5 AC2 would be vacuous',
		).toBeGreaterThan(0);

		// eslint-disable-next-line no-console -- the exemption list is part of the evidence, not debug output.
		if (exempted.length > 0) console.log(`R-9.5 AC2 — disabled controls exempted: ${exempted.join(', ')}`);

		expect(failures, `R-9.5 AC2 failures:\n  ${failures.join('\n  ')}`).toEqual([]);
	});
});

// ---------------------------------------------------------------------------
// R-9.5 AC3 / R-5.1 AC6 — text over a gradient, measured against the pixels
// actually behind it, at three viewport widths.
// ---------------------------------------------------------------------------
//
// These two criteria are the ones QA-006 found had no test of any kind, and
// they are the reason `support/png.ts` exists. The method:
//
//   1. find every text element whose backdrop involves a background-image
//      (on this site: the home hero's `linear-gradient`),
//   2. make exactly those elements' text transparent, so the rendered page
//      shows the backdrop with nothing drawn on top of it,
//   3. screenshot, decode, and read every pixel inside each element's box,
//   4. assert the WORST pixel in the box still clears the element's
//      threshold against its real text colour.
//
// The box is a deliberate over-approximation of the glyphs: it includes
// leading and the ragged right edge, which are backdrop the glyphs never
// touch. That is the conservative direction — if the worst pixel anywhere in
// the box passes, every pixel behind an actual glyph passes. It cannot
// produce a false pass.
//
// Run at 320/768/1920 because the criterion names those widths, and it names
// them for a reason the frontmatter of index.astro argues does not apply
// here: a photograph crops differently per width, a two-stop flat-colour
// gradient does not. That argument is sound TODAY. It stops being sound the
// moment the gradient gains a third stop or the hero gains an image, and
// that is exactly the change no test would otherwise catch.
const VIEWPORT_WIDTHS = [320, 768, 1920];

/** Sample every Nth pixel. 2 keeps a 1920px hero under ~150k samples. */
const PIXEL_STEP = 2;

test.describe('text over the gradient, from rendered pixels (R-9.5 AC3, R-5.1 AC6)', () => {
	for (const width of VIEWPORT_WIDTHS) {
		test(`home hero text clears its threshold against real pixels at ${width}px`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/');

			const samples = (await collectTextSamples(page)).filter((s) => s.overImage && s.box);

			// If this ever goes to zero the test must fail, not pass silently.
			// A refactor that flattened the hero gradient to a solid colour
			// would otherwise turn this whole group green by making it vacuous.
			expect(
				samples.length,
				`no text was found over a gradient at ${width}px — if the hero gradient was ` +
					`deliberately removed, this test should be removed with it, not left passing on nothing`,
			).toBeGreaterThan(0);

			// Blank the text so the screenshot records the backdrop alone.
			// `color: transparent` rather than hiding the element: the layout,
			// and therefore every box measured above, must stay exactly as it
			// was when the boxes were taken.
			await page.evaluate(() => {
				const style = document.createElement('style');
				style.id = 'contrast-probe';
				style.textContent = '.contrast-probe-blank, .contrast-probe-blank * { color: transparent !important; }';
				document.head.append(style);
			});
			for (const sample of samples) {
				await page.evaluate(
					(box) => {
						const match = Array.from(document.body.querySelectorAll('*')).find((el) => {
							const r = el.getBoundingClientRect();
							return (
								Math.abs(r.left + window.scrollX - box.x) < 0.5 &&
								Math.abs(r.top + window.scrollY - box.y) < 0.5 &&
								Math.abs(r.width - box.width) < 0.5 &&
								Math.abs(r.height - box.height) < 0.5
							);
						});
						match?.classList.add('contrast-probe-blank');
					},
					sample.box as Box,
				);
			}

			const shot = await page.screenshot({ fullPage: true });
			const image = decodePng(Buffer.from(shot));

			// The screenshot is in device pixels; the boxes are in CSS pixels.
			// Derive the factor from the image itself rather than assuming the
			// project's deviceScaleFactor, so this stays correct if the project
			// it runs under ever changes.
			const documentWidth = await page.evaluate(
				() => document.documentElement.scrollWidth || window.innerWidth,
			);
			const scale = image.width / documentWidth;

			const failures: string[] = [];

			for (const sample of samples) {
				const box = sample.box as Box;
				const fg = parseCssColor(sample.color);
				if (!fg) throw new Error(`Unparseable colour ${sample.color} on ${sample.id}`);
				const required = isLargeText(sample.fontPx, sample.weight) ? AA_LARGE : AA_BODY;

				const x0 = Math.max(0, Math.round(box.x * scale));
				const y0 = Math.max(0, Math.round(box.y * scale));
				const x1 = Math.min(image.width, Math.round((box.x + box.width) * scale));
				const y1 = Math.min(image.height, Math.round((box.y + box.height) * scale));

				let worst = Number.POSITIVE_INFINITY;
				let worstPixel = '';
				let sampled = 0;

				for (let y = y0; y < y1; y += PIXEL_STEP) {
					for (let x = x0; x < x1; x += PIXEL_STEP) {
						const i = (y * image.width + x) * 4;
						const behind: Rgb = {
							r: image.data[i],
							g: image.data[i + 1],
							b: image.data[i + 2],
							a: 1,
						};
						const ratio = contrastRatio(flatten(fg, behind), behind);
						sampled += 1;
						if (ratio < worst) {
							worst = ratio;
							worstPixel = cssOf(behind);
						}
					}
				}

				if (sampled === 0) {
					failures.push(`${sample.id} — box produced no pixels to sample`);
					continue;
				}
				if (worst < required) {
					failures.push(
						`${sample.id} — ${sample.color} over its worst backdrop pixel ${worstPixel} ` +
							`= ${worst.toFixed(2)}:1, needs ${required}:1 (${sampled} pixels sampled at ${width}px)`,
					);
				}
			}

			expect(
				failures,
				`R-9.5 AC3 / R-5.1 AC6 failures at ${width}px:\n  ${failures.join('\n  ')}`,
			).toEqual([]);
		});
	}
});
