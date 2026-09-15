import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';

// Wave 6 (R-5.3 AC1): "Given the site, When rendered in current Chromium,
// Firefox and WebKit, Then layout is intact and no console errors occur."
// Runs once per engine via the `cross-browser-chromium/-firefox/-webkit`
// projects in playwright.config.ts, all three against the built static
// output (`previewBaseURL`) rather than the dev server — see that file's
// comments for why (dev-only HMR scripts and warnings would misrepresent
// what actually ships).
//
// Also carries the JS-transfer half of the performance budget (R-5.2 AC2:
// "Given any page, When loaded, Then total transferred JavaScript is under
// 50 KB compressed"), chromium-only — the byte count is a property of the
// built HTML/assets, not of the rendering engine, so running it three times
// would be redundant. R-5.2 AC1 (Lighthouse score + LCP, home page only) has
// its own dedicated spec: lighthouse.spec.ts.

test.describe('no console errors (R-5.3 AC1)', () => {
	for (const route of allRoutes) {
		test(`${route.path} produces no console errors or uncaught exceptions`, async ({
			page,
		}) => {
			const consoleErrors: string[] = [];
			const pageErrors: string[] = [];

			page.on('console', (msg) => {
				if (msg.type() === 'error') {
					consoleErrors.push(msg.text());
				}
			});
			page.on('pageerror', (error) => {
				pageErrors.push(error.message);
			});

			const response = await page.goto(route.path);
			expect(response?.status()).toBe(200);

			expect(consoleErrors, `console.error on ${route.path}`).toEqual([]);
			expect(pageErrors, `uncaught exception on ${route.path}`).toEqual([]);
		});
	}
});

test.describe('layout intact — no horizontal overflow (R-5.3 AC1)', () => {
	// R-2's own responsiveness range is 320px-1920px; checking both
	// boundaries catches the layout breaking at either extreme without
	// needing every width in between.
	const widths = [320, 1920];

	for (const route of allRoutes) {
		for (const width of widths) {
			test(`${route.path} has no horizontal overflow at ${width}px wide`, async ({
				page,
			}) => {
				await page.setViewportSize({ width, height: 900 });
				await page.goto(route.path);

				const overflow = await page.evaluate(() => ({
					scrollWidth: document.documentElement.scrollWidth,
					clientWidth: document.documentElement.clientWidth,
				}));

				// A 1px tolerance absorbs sub-pixel rounding differences between
				// engines without masking a real overflowing element.
				expect(
					overflow.scrollWidth,
					`${route.path} at ${width}px: scrollWidth ${overflow.scrollWidth} vs clientWidth ${overflow.clientWidth}`,
				).toBeLessThanOrEqual(overflow.clientWidth + 1);
			});
		}
	}
});

test.describe('JavaScript transfer budget (R-5.2 AC2)', () => {
	for (const route of allRoutes) {
		test(`${route.path} ships under 50KB of compressed JavaScript`, async ({
			page,
			browserName,
		}) => {
			// Byte count is a property of the built assets, not the rendering
			// engine — asserting it once (chromium) is sufficient and avoids
			// three redundant runs per route.
			test.skip(browserName !== 'chromium', 'JS-weight is engine-independent; chromium only');

			let jsBytes = 0;
			const sizePromises: Promise<void>[] = [];

			page.on('requestfinished', (request) => {
				if (request.resourceType() !== 'script') return;
				sizePromises.push(
					request.sizes().then((sizes) => {
						jsBytes += sizes.responseBodySize;
					}),
				);
			});

			await page.goto(route.path);
			await page.waitForLoadState('networkidle');
			await Promise.all(sizePromises);

			expect(jsBytes, `${route.path} transferred ${jsBytes} bytes of JS`).toBeLessThan(
				50 * 1024,
			);
		});
	}
});
