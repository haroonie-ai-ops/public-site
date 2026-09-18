import { test, expect } from '@playwright/test';
import { imageMeta } from './support/image-meta';

// R-9.7 — "Favicon, app icons and the Open Graph image are the brand's, and
// are real."
//
// WHY THIS FILE EXISTS — QA-006 Findings 6 and 4.1. R-9.7 had six acceptance
// criteria and, before this, no test of its own anywhere in the suite. The
// traceability matrix credited them to `seo.spec.ts` and to "build output",
// and the audit found:
//
//   AC1  marked AUTOMATED against "favicon set referenced from the head".
//        That tests the head. AC1 is about what `/favicon.svg` RETURNS, and
//        what it returned was the unmodified Astro starter triangle — 749
//        bytes, untouched since the scaffold, still live in production at the
//        time of the review. The brand wave had re-pointed the <head> at
//        /brand/haroonie-logo-mark.svg and left the URL the criterion names
//        serving another project's logo.
//   AC3  credited to "seo.spec.ts — og:image is a 1200x630 raster with
//        width/height/type/alt". `seo.spec.ts` asserts that the tag is
//        non-empty. The Tester verified the file by hand; nothing did so on
//        every run.
//   AC4  credited to the `.ico`'s magic bytes — an unrelated fact.
//   AC5  credited to "Verified live", a phrase appearing nowhere outside the
//        matrix.
//   AC6  credited to the og:image's content type. The Tester measured
//        224,107 bytes by hand; the number appeared nowhere in the record.
//
// So: the criteria that are machine-checkable are checked here, from the
// bytes rather than from the markup that describes them. AC4 stays MANUAL and
// says why below.
//
// Runs against the built static output (`static-preview`) because that is
// what Cloudflare Pages serves from `public/`, and because these are HTTP
// facts — status, content type, transferred bytes — not DOM facts.

/** The Astro starter favicon's distinctive path data. */
const ASTRO_STARTER_PATH = 'M50.4 78.5';

/** The three brand stops the mark is drawn in (REQ-001 §4, palette). */
const BRAND_STOPS = ['#155BEF', '#2E83FF', '#66B4FF'];

test.describe('R-9.7 AC1 — /favicon.svg returns the haroonie.ai mark', () => {
	test('the URL the criterion names serves the brand mark, not the Astro starter', async ({
		request,
		baseURL,
	}) => {
		const response = await request.get(`${baseURL}/favicon.svg`);
		expect(response.status(), '/favicon.svg must be served').toBe(200);
		expect(response.headers()['content-type']).toContain('image/svg+xml');

		const body = await response.text();

		// The negative half of AC1, stated as the criterion states it: "NOT the
		// Astro starter favicon currently shipped". Pinned to the starter's own
		// path data, so this fails if that file is ever restored by a scaffold
		// regeneration or a bad merge — which is exactly how it survived a
		// whole brand wave the first time.
		expect(
			body.includes(ASTRO_STARTER_PATH),
			'/favicon.svg contains the Astro starter mark',
		).toBe(false);

		// The positive half. Checked against the palette rather than against a
		// byte hash of the mark: a hash would fail on any legitimate edit to
		// the artwork and teach people to update it without looking.
		const stopsPresent = BRAND_STOPS.filter((hex) =>
			body.toUpperCase().includes(hex.toUpperCase()),
		);
		expect(
			stopsPresent.length,
			`/favicon.svg should be drawn in the brand palette; found ${stopsPresent.join(', ') || 'none'}`,
		).toBeGreaterThanOrEqual(2);
	});

	test('R-9.9 AC4 — the favicon keeps the dark-chrome behaviour the AC says must not be lost', async ({
		request,
		baseURL,
	}) => {
		// AC4, verbatim: "The current Astro-default file already achieves this
		// with an internal prefers-color-scheme rule; the replacement must not
		// lose that behaviour." QA-006 Finding 7 found it had been lost — the
		// file that was declared in the <head> carries no such rule, and the
		// only file that still had one was the starter being replaced.
		//
		// Asserted on the file the <head> declares, checked below, so this
		// cannot pass by being true of a file no browser fetches.
		const response = await request.get(`${baseURL}/favicon.svg`);
		const body = await response.text();
		expect(
			body,
			'the favicon must carry an internal prefers-color-scheme rule (R-9.9 AC4)',
		).toContain('prefers-color-scheme: dark');
	});

	test('the <head> declares that same file, so AC1 is about an icon browsers actually fetch', async ({
		page,
	}) => {
		await page.goto('/');
		await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
			'href',
			'/favicon.svg',
		);
	});
});

test.describe('R-9.7 AC2 — the declared icon set exists and is what it claims', () => {
	// AC2: "an SVG favicon, an .ico fallback carrying 16x16/32x32/48x48, and a
	// 180x180 apple-touch-icon are all declared, and EACH URL RETURNS 200 WITH
	// THE DECLARED CONTENT TYPE."
	//
	// The second clause is the half nothing checked. Every entry below is read
	// out of the rendered <head> rather than hard-coded, so removing a <link>
	// changes what is tested instead of leaving a passing test for a tag that
	// is gone.
	test('every icon declared in the head resolves, with the declared type and size', async ({
		page,
		request,
		baseURL,
	}) => {
		await page.goto('/');

		const declared = await page.evaluate(() =>
			Array.from(document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')).map(
				(el) => ({
					rel: el.getAttribute('rel') ?? '',
					href: el.getAttribute('href') ?? '',
					type: el.getAttribute('type'),
					sizes: el.getAttribute('sizes'),
				}),
			),
		);

		expect(declared.length, 'the head declares no icons at all').toBeGreaterThanOrEqual(4);

		const failures: string[] = [];
		let apple = 0;
		let ico = 0;
		let svg = 0;

		for (const link of declared) {
			const response = await request.get(`${baseURL}${link.href}`);
			if (response.status() !== 200) {
				failures.push(`${link.href} returned ${response.status()}`);
				continue;
			}

			const contentType = response.headers()['content-type'] ?? '';
			if (link.type && !contentType.includes(link.type)) {
				failures.push(`${link.href} declares ${link.type} but is served as ${contentType}`);
			}

			const body = Buffer.from(await response.body());
			const meta = imageMeta(body);

			if (meta.format === 'svg') svg += 1;

			if (link.rel === 'apple-touch-icon') {
				apple += 1;
				// AC2 names 180x180 specifically, and the whole point of this
				// file is to check the asset rather than the attribute.
				if (meta.width !== 180 || meta.height !== 180) {
					failures.push(`${link.href} is ${meta.width}x${meta.height}, AC2 requires 180x180`);
				}
			}

			if (meta.format === 'ico') {
				ico += 1;
				const carried = (meta.icoSizes ?? []).map((s) => `${s.width}x${s.height}`);
				for (const required of ['16x16', '32x32', '48x48']) {
					if (!carried.includes(required)) {
						failures.push(
							`${link.href} is a real ICO but carries only ${carried.join(', ')}; ` +
								`AC2 requires ${required}`,
						);
					}
				}
			}

			// A declared PNG icon must actually be the size it declares. The
			// scaffold shipped a `favicon.ico` that was, despite the extension,
			// a PNG — the same class of mistake one file over.
			if (meta.format === 'png' && link.sizes && /^\d+x\d+$/.test(link.sizes)) {
				const [w, h] = link.sizes.split('x').map(Number);
				if (meta.width !== w || meta.height !== h) {
					failures.push(
						`${link.href} declares sizes="${link.sizes}" but is ${meta.width}x${meta.height}`,
					);
				}
			}
		}

		expect(svg, 'AC2 requires an SVG favicon to be declared').toBeGreaterThan(0);
		expect(ico, 'AC2 requires an .ico fallback to be declared').toBe(1);
		expect(apple, 'AC2 requires a 180x180 apple-touch-icon to be declared').toBe(1);
		expect(failures, `R-9.7 AC2 failures:\n  ${failures.join('\n  ')}`).toEqual([]);
	});
});

test.describe('R-9.7 AC3 and AC6 — the Open Graph image', () => {
	test('og:image and twitter:image are the same same-origin 1200x630 raster, under 300 KB', async ({
		page,
		request,
		baseURL,
	}) => {
		await page.goto('/');

		const tags = await page.evaluate(() => ({
			canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
			og: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
			twitter: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ?? '',
			declaredType:
				document.querySelector('meta[property="og:image:type"]')?.getAttribute('content') ?? '',
			declaredWidth:
				document.querySelector('meta[property="og:image:width"]')?.getAttribute('content') ?? '',
			declaredHeight:
				document.querySelector('meta[property="og:image:height"]')?.getAttribute('content') ?? '',
		}));

		expect(tags.og, 'og:image must be present').not.toBe('');
		// AC3's "twitter:image" half — named by the criterion, and, per QA-006
		// Finding 4.1, not tested at all before now even though the matrix row
		// for R-4.1 AC3 claimed "OG/Twitter".
		expect(tags.twitter, 'twitter:image must be present').not.toBe('');
		expect(tags.twitter, 'og:image and twitter:image must resolve to the same asset').toBe(tags.og);

		// "served from the site's own origin" — the criterion's words.
		//
		// `og:image` is emitted as an ABSOLUTE production URL, because that is
		// what crawlers need; the preview server this runs against is
		// localhost. So "own origin" is measured against the page's own
		// canonical link, which is built from the same configured `site` value.
		// Comparing against `baseURL` instead would assert that the OG image is
		// hosted on whatever server happens to be serving the test, which is
		// not the criterion and would pass for a third-party URL on a
		// production run.
		expect(tags.canonical, 'the page must declare a canonical URL').not.toBe('');
		const siteOrigin = new URL(tags.canonical).origin;
		const ogUrl = new URL(tags.og, siteOrigin);
		expect(
			ogUrl.origin,
			`og:image ${tags.og} must be served from this site's own origin (${siteOrigin})`,
		).toBe(siteOrigin);

		// Fetched from the server under test by PATH, not from the absolute
		// production URL above: a pre-merge gate must not depend on, or send
		// traffic to, the live site (R-7.8 AC6).
		const response = await request.get(`${baseURL}${ogUrl.pathname}`);
		expect(response.status(), 'the og:image path must resolve on the build under test').toBe(200);

		const body = Buffer.from(await response.body());
		const meta = imageMeta(body);

		// AC3: "a RASTER image (PNG or JPEG) of exactly 1200x630 — not an SVG,
		// which the major social platforms do not render".
		expect(['png', 'jpeg'], `og:image is ${meta.format}, which AC3 excludes`).toContain(
			meta.format,
		);
		expect(meta.width, 'og:image width').toBe(1200);
		expect(meta.height, 'og:image height').toBe(630);

		// The declared dimensions must match the file, or a platform that
		// trusts the meta tags lays out the wrong box.
		expect(tags.declaredWidth).toBe('1200');
		expect(tags.declaredHeight).toBe('630');
		expect(response.headers()['content-type']).toContain(tags.declaredType);

		// AC6: "under 300 KB". Measured, and reported on every run so the
		// number lives in the evidence rather than in one reviewer's notes.
		const kb = body.length / 1024;
		// eslint-disable-next-line no-console -- AC6 is a measured budget; the measurement is the evidence.
		console.log(`R-9.7 AC6 — og:image transferred ${body.length} bytes (${kb.toFixed(1)} KB) of a 300 KB budget`);
		expect(kb, `og:image is ${kb.toFixed(1)} KB, AC6 allows 300 KB`).toBeLessThan(300);
	});
});

test.describe('R-9.7 AC5 — the mark at 16x16', () => {
	// AC5 asks whether the mark is RECOGNISABLE at 16x16. That is a human
	// judgement and stays MANUAL in the traceability matrix; this test does not
	// claim to make it.
	//
	// What it does is put a floor under the judgement, because the two ways a
	// favicon actually fails at 16px are both mechanical: it renders as
	// nothing, or it renders as a solid block. Either would be obvious to a
	// person and neither was caught by anything. The mark is rasterised at
	// 16x16 and its ink coverage measured; a recognisable glyph occupies a
	// middle band, not an extreme.
	test('the favicon rasterises at 16x16 to something that is neither blank nor solid', async ({
		page,
	}) => {
		await page.goto('/');

		const coverage = await page.evaluate(async () => {
			const img = new Image();
			img.src = '/favicon.svg';
			await img.decode();

			const canvas = document.createElement('canvas');
			canvas.width = 16;
			canvas.height = 16;
			const ctx = canvas.getContext('2d');
			if (!ctx) return null;
			ctx.clearRect(0, 0, 16, 16);
			ctx.drawImage(img, 0, 0, 16, 16);

			const { data } = ctx.getImageData(0, 0, 16, 16);
			let inked = 0;
			for (let i = 3; i < data.length; i += 4) {
				// Anything more than faintly present counts as ink; antialiasing
				// at this size puts a lot of pixels between 0 and 255.
				if (data[i] > 64) inked += 1;
			}
			return inked / 256;
		});

		expect(coverage, 'the favicon could not be rasterised at 16x16').not.toBeNull();
		expect(
			coverage as number,
			`the favicon covers ${(((coverage as number) * 100) | 0)}% of a 16x16 box — too little to read as a mark`,
		).toBeGreaterThan(0.08);
		expect(
			coverage as number,
			`the favicon covers ${(((coverage as number) * 100) | 0)}% of a 16x16 box — a near-solid block, not a glyph`,
		).toBeLessThan(0.92);
	});
});
