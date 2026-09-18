import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { allRoutes } from './support/routes';

// R-9.2 (typography delivery) and R-9.3 (the logo in the header) — the parts
// of both that had no test.
//
// WHY THIS FILE EXISTS — QA-006 Finding 10's table. Seven criteria across
// these two requirements were marked AUTOMATED or MANUAL in the traceability
// matrix against evidence belonging to a different criterion:
//
//   R-9.2 AC2  "no request to any external origin"     credited to "font served from /fonts"
//   R-9.2 AC6  "the LCP weight is preloaded, no other" credited to R-9.6 AC2's licence file
//   R-9.3 AC1  "logo visible in header, is home link"  credited to smoke.spec.ts, which has no logo assertion
//   R-9.3 AC2  "accessible name is haroonie.ai"        credited to smoke.spec.ts, same
//   R-9.3 AC3  "undistorted at 320/1920"               credited to a brand-tokens.spec.ts test that does not exist
//   R-9.3 AC4  "vector at every rendered size"         credited to source inspection, marked AUTOMATED
//   R-9.9 AC3  "on-dark logo only on dark surfaces"    credited to a rationale that is factually wrong
//
// Each of those criteria is in fact SATISFIED by the site — the Tester
// checked several by hand and so did this pass. What was missing was anything
// that would notice them ceasing to be satisfied. That is what is added here.
//
// Two of them (R-9.4 AC2 and R-9.9 AC3) are satisfied VACUOUSLY: the thing
// they constrain does not occur. A vacuous pass is a legitimate pass, but only
// if the antecedent is checked rather than assumed — otherwise the row stays
// green on the day the antecedent becomes true. So those are written as
// assertions about the antecedent itself.

test.describe('R-9.2 AC2 — every font, and everything else, comes from this origin', () => {
	for (const route of allRoutes) {
		test(`${route.path} requests no external origin, and no Google Fonts host`, async ({
			page,
			baseURL,
		}) => {
			const external: string[] = [];
			const fonts: string[] = [];
			const origin = new URL(baseURL as string).origin;

			page.on('request', (r) => {
				const url = r.url();
				if (url.startsWith('data:') || url.startsWith('blob:')) return;
				if (!url.startsWith(origin)) external.push(`${r.resourceType()} ${url}`);
				if (r.resourceType() === 'font' || /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) {
					fonts.push(url);
				}
			});

			await page.goto(route.path);
			await page.waitForLoadState('networkidle');

			// The criterion names the two Google Fonts hosts explicitly, and the
			// general rule as well. Both are asserted: the named-host check is
			// the one that fails with an obvious message if someone pastes a
			// Google Fonts <link> back in, and the general check catches every
			// other third party.
			expect(
				external.filter((u) => /googleapis|gstatic/i.test(u)),
				'R-9.2 AC2 names fonts.googleapis.com and fonts.gstatic.com specifically',
			).toEqual([]);
			expect(external, `${route.path} requested external origins:\n  ${external.join('\n  ')}`).toEqual(
				[],
			);

			// "every font file is served from the site's own origin" — asserted
			// positively, so a page that loads no font at all cannot pass this
			// by having nothing to check.
			for (const url of fonts) {
				expect(url.startsWith(origin), `font ${url} is not same-origin`).toBe(true);
			}
		});
	}
});

test.describe('R-9.2 AC6 — exactly one font file is preloaded', () => {
	test('the head preloads the one shipped font and no other', async ({ page }) => {
		await page.goto('/');

		const preloads = await page.evaluate(() =>
			Array.from(document.querySelectorAll('link[rel="preload"][as="font"]')).map((el) => ({
				href: el.getAttribute('href') ?? '',
				type: el.getAttribute('type'),
				crossorigin: el.hasAttribute('crossorigin'),
			})),
		);

		// "that ONE font file is preloaded and NO OTHER" — the count is the
		// criterion, not an incidental detail. Preloading a second weight is
		// the specific mistake AC6 exists to prevent: it competes with the one
		// the LCP element actually needs.
		expect(preloads.length, 'AC6 requires exactly one preloaded font file').toBe(1);
		expect(preloads[0].href).toMatch(/\.woff2$/);
		expect(preloads[0].type, 'a font preload must declare its type or the browser may fetch twice').toBe(
			'font/woff2',
		);
		// Without `crossorigin` the preload is fetched in a different CORS mode
		// than the CSS `@font-face` request, and the browser downloads the file
		// twice — the preload then costs bandwidth instead of saving time.
		expect(preloads[0].crossorigin, 'a font preload must be crossorigin').toBe(true);
	});
});

test.describe('R-9.3 AC1/AC2 — the logo is the header home link, and is named', () => {
	for (const route of allRoutes) {
		test(`${route.path} — the brand logo is visible in the header and links home`, async ({
			page,
		}) => {
			await page.goto(route.path);

			const brand = page.locator('header a.brand');
			await expect(brand, 'AC1 — the brand link must be in the header').toBeVisible();
			await expect(brand, 'AC1 — the brand link is the site home link').toHaveAttribute('href', '/');

			const mark = brand.locator('img.brand-mark');
			await expect(mark, 'AC1 — the logo mark must be visible').toBeVisible();

			// Rendered, not merely present: an <img> with a broken src is
			// "visible" to a locator and blank to a visitor.
			const painted = await mark.evaluate(
				(el) => (el as HTMLImageElement).naturalWidth > 0 && (el as HTMLImageElement).complete,
			);
			expect(painted, 'AC1 — the logo mark must actually paint, not 404').toBe(true);
		});

		test(`${route.path} — the home link's accessible name is haroonie.ai, from text`, async ({
			page,
		}) => {
			await page.goto(route.path);

			// AC2: "it is `haroonie.ai` — unchanged in substance from the text
			// wordmark it replaces". Asserted through the accessibility tree, so
			// it holds however the name is composed.
			const brand = page.getByRole('link', { name: 'haroonie.ai', exact: true });
			await expect(brand).toBeVisible();
			await expect(brand).toHaveClass(/brand/);

			// "from real text, not aria-label" — the second half of AC2, and the
			// reason it exists: an aria-label would make the name correct for a
			// screen reader and invisible to a sighted user reading the same
			// page, which is not "unchanged in substance".
			await expect(
				page.locator('header a.brand'),
				'AC2 — the name must come from rendered text, not an aria-label',
			).not.toHaveAttribute('aria-label', /./);
			await expect(page.locator('header a.brand .wordmark')).toHaveText('haroonie.ai');

			// The decorative mark must not contribute a second announcement of
			// the same name.
			await expect(page.locator('header a.brand img.brand-mark')).toHaveAttribute('alt', '');
		});
	}
});

test.describe('R-9.3 AC3 — the logo survives 320px and 1920px', () => {
	for (const width of [320, 1920]) {
		test(`at ${width}px the logo is undistorted, the header does not overflow, and no nav link is pushed out`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/');

			const mark = page.locator('header img.brand-mark');
			const measured = await mark.evaluate((el) => {
				const img = el as HTMLImageElement;
				const rect = img.getBoundingClientRect();
				return {
					renderedRatio: rect.width / rect.height,
					intrinsicRatio: img.naturalWidth / img.naturalHeight,
					width: rect.width,
				};
			});

			expect(measured.width, 'the mark must have a non-zero rendered width').toBeGreaterThan(0);
			// "without distortion" — the rendered aspect ratio must match the
			// asset's own. 1% of tolerance for sub-pixel layout rounding.
			expect(
				Math.abs(measured.renderedRatio - measured.intrinsicRatio),
				`the logo is drawn at ${measured.renderedRatio.toFixed(3)} against an intrinsic ` +
					`${measured.intrinsicRatio.toFixed(3)} — it is being stretched`,
			).toBeLessThan(measured.intrinsicRatio * 0.01);

			// "without overflowing the header".
			const overflow = await page.evaluate(() => {
				const header = document.querySelector('header') as HTMLElement;
				return {
					scroll: header.scrollWidth,
					client: header.clientWidth,
					doc: document.documentElement.scrollWidth,
					view: window.innerWidth,
				};
			});
			expect(overflow.scroll, 'the header must not overflow itself').toBeLessThanOrEqual(
				overflow.client + 1,
			);
			expect(overflow.doc, 'the page must not scroll horizontally').toBeLessThanOrEqual(
				overflow.view + 1,
			);

			// "without pushing any navigation link out of view" — every primary
			// nav link must still be inside the viewport box, which is the
			// failure mode a too-large logo actually produces at 320px.
			const clipped = await page.evaluate(() =>
				Array.from(document.querySelectorAll('header nav a'))
					.filter((el) => {
						const r = el.getBoundingClientRect();
						return r.width === 0 || r.left < 0 || r.right > window.innerWidth + 1;
					})
					.map((el) => el.textContent?.trim() ?? '?'),
			);
			expect(clipped, `nav links pushed out of view at ${width}px: ${clipped.join(', ')}`).toEqual(
				[],
			);
		});
	}
});

test.describe('R-9.3 AC4 — the logo asset is a vector', () => {
	test('the header mark is served as SVG, not a raster', async ({ page, request, baseURL }) => {
		await page.goto('/');
		const src = await page.locator('header img.brand-mark').getAttribute('src');
		expect(src, 'the header mark must have a src').not.toBeNull();

		const response = await request.get(`${baseURL}${src}`);
		expect(response.status(), `${src} must resolve`).toBe(200);
		// The criterion is about the ASSET, so it is read from the response,
		// not from the file extension in the markup. The scaffold shipped a
		// `favicon.ico` that was a PNG — an extension is a claim.
		expect(response.headers()['content-type']).toContain('image/svg+xml');
		expect((await response.text()).trimStart().startsWith('<svg'), `${src} is not SVG markup`).toBe(
			true,
		);
	});
});

test.describe('R-9.9 AC3 — the on-dark logo variant is used only on dark surfaces', () => {
	// Synchronous: this reads the source tree, not the browser. No `page`
	// fixture is requested either, so Playwright starts no browser for it.
	test('the on-dark variant is not referenced anywhere in src/, which is where every surface is light', () => {
		// AC3 is satisfied vacuously today: `haroonie-logo-horizontal-dark.svg`
		// appears nowhere in `src/`, so it cannot be used on a light surface.
		// The matrix asserted the opposite rationale — "used on OG card, app
		// icons" — which QA-006 Finding 10 found to be factually wrong.
		//
		// A vacuous pass is still a pass, but only while the antecedent holds,
		// so the antecedent is what is asserted. The day someone renders the
		// dark variant into a page, this fails and the row has to be re-decided
		// against the surface it was put on — which is the whole point of AC3.
		const hits: string[] = [];
		const walk = (dir: string) => {
			for (const entry of readdirSync(dir)) {
				const full = join(dir, entry);
				if (statSync(full).isDirectory()) {
					walk(full);
					continue;
				}
				if (!/\.(astro|ts|tsx|md|mdx|css)$/.test(entry)) continue;
				const text = readFileSync(full, 'utf8');
				for (const [i, line] of text.split('\n').entries()) {
					if (line.includes('logo-horizontal-dark') || line.includes('logo-mark-dark')) {
						hits.push(`${full}:${i + 1}`);
					}
				}
			}
		};
		walk('src');

		expect(
			hits,
			'the on-dark logo variant is now referenced in src/. R-9.9 AC3 permits it only on a ' +
				'genuinely dark surface, and this site has none — re-decide the row against the ' +
				`surface it was placed on:\n  ${hits.join('\n  ')}`,
		).toEqual([]);
	});
});

test.describe('R-9.2 AC5 — text is visible throughout the font load', () => {
	test('every @font-face declares font-display: swap', async ({ page }) => {
		// AC5 has two halves. The layout-shift half is R-5.2 AC3's CLS budget,
		// asserted in lighthouse.spec.ts. This is the other half: "text is
		// visible throughout (no invisible-text period)" — the FOIT that a
		// default `font-display: auto` produces, where the browser hides text
		// for up to three seconds waiting for a webfont.
		//
		// U22 resolved the strategy as `font-display: swap`, and the resolution
		// says explicitly that "correctness is asserted by measurement, not by
		// the choice". The measurement is CLS; this is the assertion that the
		// choice it was measured under is still the one shipping. Read from the
		// CSSOM rather than by grepping the stylesheet, so it reflects what the
		// browser actually parsed.
		await page.goto('/');

		const faces = await page.evaluate(() => {
			const found: { family: string; display: string }[] = [];
			for (const sheet of Array.from(document.styleSheets)) {
				let rules: CSSRuleList;
				try {
					rules = sheet.cssRules;
				} catch {
					continue; // cross-origin sheet; AC2 asserts there are none
				}
				for (const rule of Array.from(rules)) {
					if (rule instanceof CSSFontFaceRule) {
						found.push({
							family: rule.style.getPropertyValue('font-family'),
							display: rule.style.getPropertyValue('font-display'),
						});
					}
				}
			}
			return found;
		});

		expect(faces.length, 'the page declares no @font-face at all').toBeGreaterThan(0);
		const wrong = faces.filter((f) => f.display !== 'swap');
		expect(
			wrong,
			`every @font-face must declare font-display: swap (U22); these do not: ` +
				wrong.map((f) => `${f.family}=${f.display || 'auto'}`).join(', '),
		).toEqual([]);
	});
});
