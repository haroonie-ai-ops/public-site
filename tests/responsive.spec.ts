import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';

// REQ-001 R-2's blanket clause: "each [page] is reachable from site
// navigation, renders without console errors, and is responsive from 320px
// to 1920px viewport width." Reachability-from-nav and per-page rendering
// are covered elsewhere (tests/smoke.spec.ts); this file covers the
// "no console errors" and "responsive 320px-1920px" halves across every
// route in the shared fixture.

const WIDTHS = [320, 1920];

test.describe('no console errors (R-2, applies to all pages)', () => {
	for (const route of allRoutes) {
		test(`${route.path} produces no console errors`, async ({ page }) => {
			const errors: string[] = [];
			page.on('console', (message) => {
				if (message.type() === 'error') errors.push(message.text());
			});
			page.on('pageerror', (error) => errors.push(error.message));

			await page.goto(route.path);

			expect(errors, errors.join('\n')).toHaveLength(0);
		});
	}
});

test.describe('responsive from 320px to 1920px (R-2, applies to all pages)', () => {
	for (const route of allRoutes) {
		for (const width of WIDTHS) {
			test(`${route.path} has no horizontal overflow at ${width}px wide`, async ({ page }) => {
				await page.setViewportSize({ width, height: 900 });
				await page.goto(route.path);

				const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
				// +1px tolerance for sub-pixel rounding across engines.
				expect(scrollWidth).toBeLessThanOrEqual(width + 1);
			});
		}
	}
});
