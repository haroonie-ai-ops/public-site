import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';
import { assertNavigationOk } from './support/cloudflare';

// R-6.4 — post-deployment verification against the LIVE site.
//
// Deferred to Wave 7 since Wave 3, and deliberately kept distinct from
// R-7.8's suite rather than folded into it. R-7.8 asks a security question:
// does the CSP hold, is the nonce per-response, are the headers right. R-6.4
// asks the cruder and more fundamental one: is the site up at all, and did
// the deployment that just landed actually serve something. A deploy can
// satisfy every security assertion while serving a blank page, and it can
// serve perfect pages while a route 404s.
//
// The two suites run in the same post-deploy job because they share its one
// expensive precondition - a real browser against the real hostname - and
// because R-6.4 AC2's rollback recommendation is the same mechanism R-7.8
// already triggers. They stay separate FILES so a failure names which
// question failed.
//
// WHY BROWSER NAVIGATION, NOT request.get(): QA-005 Finding 3. Cloudflare's
// Bot Fight Mode challenges non-browser HTTP clients from GitHub Actions
// runner IPs and returns 403 before any assertion is reached. A smoke suite
// that cannot tell "the site is down" from "our own verification client was
// challenged" is worse than none, because it trains people to ignore it.
// assertNavigationOk() fails with that distinction spelled out.
const PRODUCTION_ORIGIN = process.env.PRODUCTION_BASE_URL ?? 'https://www.haroonie.ai';

test.describe('R-6.4 AC1 — post-deployment smoke against the live site', () => {
	for (const route of allRoutes) {
		test(`${route.path} returns 200 from the real production hostname`, async ({ page }) => {
			const response = await page.goto(`${PRODUCTION_ORIGIN}${route.path}`);
			assertNavigationOk(response, route.path);

			// A 200 that serves an empty document would pass a status check and
			// tell you nothing. Assert the page actually rendered its own
			// structure: a single h1, and the shared header and footer that
			// every page inherits from BaseLayout.
			await expect(page.locator('h1')).toHaveCount(1);
			await expect(page.locator('header')).toBeVisible();
			await expect(page.locator('footer')).toBeVisible();
		});
	}

	test('the home page primary heading is present', async ({ page }) => {
		const response = await page.goto(`${PRODUCTION_ORIGIN}/`);
		assertNavigationOk(response, '/');

		// R-6.4 AC1 names this specifically. Matched against the owner-approved
		// copy rather than "any h1", so a deployment that serves a stale or
		// placeholder home page fails here instead of passing a generic check.
		await expect(
			page.getByRole('heading', { level: 1, name: 'From Ideas to Real-World Impact.' }),
		).toBeVisible();
	});

	test('the deployed build is the brand build, not an older one', async ({ page }) => {
		const response = await page.goto(`${PRODUCTION_ORIGIN}/services/`);
		assertNavigationOk(response, '/services/');

		// Learned from the R-6.5 rollback drill (status/ROLLBACK-PROCEDURE.md):
		// consecutive deployments are frequently byte-identical, so "the site
		// responds" cannot distinguish the current build from several older
		// ones. The service icons are the nearest structural marker that does
		// differ - they arrived with the most recent content-bearing
		// deployment. This is a coarse staleness check, not a version assert:
		// it catches a rollback to a pre-brand build that every other
		// assertion here would happily pass.
		await expect(page.locator('svg.service-icon')).toHaveCount(3);
	});
});
