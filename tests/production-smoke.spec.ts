import { test, expect, type Response } from '@playwright/test';
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

// R-7.3 AC1/AC2 — the apex redirects to www with a 301, preserving the path.
//
// Added by QA-006 Finding 13. These are HTTP-behaviour criteria and the
// matrix credited them to `status/WAVE4-dns-evidence.md`, a file containing
// zero HTTP observations - it records the DNS records, which is a different
// fact. No test in the suite requested the apex host at all. The Tester
// verified both live by hand and found them correct; what was missing was
// anything that would notice if they stopped being correct.
//
// This belongs in the smoke suite rather than the security one for the same
// reason the rest of this file does: it asks whether the deployment serves
// what it should, not whether it serves it safely. A redirect ruleset is a
// Cloudflare-side configuration that no code change can break and no code
// change can fix - which is exactly why nothing in the repository would
// otherwise notice it being edited away in the dashboard.
const APEX_ORIGIN = PRODUCTION_ORIGIN.replace('://www.', '://');

/**
 * The redirect hops a navigation passed through, oldest first.
 *
 * Playwright exposes the chain backwards from the final response, so this
 * walks `redirectedFrom()` and reverses it. Both redirect criteria below need
 * the STATUS of the hop, not just where the browser ended up: landing on the
 * right page is equally true of duplicate content served at two URLs, and of
 * a 302 that tells crawlers the other URL is still canonical.
 */
async function redirectChain(response: Response): Promise<{ url: string; status: number }[]> {
	const hops: { url: string; status: number }[] = [];
	for (
		let request = response.request().redirectedFrom();
		request !== null;
		request = request.redirectedFrom()
	) {
		const hop = await request.response();
		if (hop) hops.unshift({ url: request.url(), status: hop.status() });
	}
	return hops;
}

test.describe('R-7.3 AC1/AC2 — apex to www redirect', () => {
	// Skipped rather than failed when PRODUCTION_BASE_URL has been pointed at
	// something that is not the www host (a preview deployment, say): there is
	// no apex to redirect in that case, and reporting a missing redirect as a
	// failure would be a false alarm about a configuration that is not under
	// test.
	test.skip(
		APEX_ORIGIN === PRODUCTION_ORIGIN,
		`${PRODUCTION_ORIGIN} is not the www host, so it has no apex to redirect`,
	);

	for (const path of ['/', '/services/']) {
		test(`${APEX_ORIGIN}${path} responds 301 to the www host, path preserved`, async ({ page }) => {
			const response = await page.goto(`${APEX_ORIGIN}${path}`);
			assertNavigationOk(response, `${APEX_ORIGIN}${path}`);

			// The final response is the www page; the redirect is one step back
			// up the chain. Asserted on the chain rather than on the final URL
			// alone, because landing on the right page says nothing about the
			// STATUS used to get there - and AC1 names 301 specifically, since a
			// 302 tells crawlers the apex is the canonical host after all.
			const hops = await redirectChain(response);

			expect(
				hops.length,
				`${APEX_ORIGIN}${path} was served directly with no redirect; AC1 requires a 301 to www`,
			).toBeGreaterThan(0);
			expect(
				hops[0].status,
				`AC1 requires a permanent redirect; ${hops[0].url} answered ${hops[0].status}`,
			).toBe(301);

			// AC2: the path survives the redirect. `/services/` must not land on
			// the home page.
			expect(new URL(page.url()).pathname, 'AC2 — the path must be preserved').toBe(path);
			expect(new URL(page.url()).origin, 'the redirect target must be the www host').toBe(
				PRODUCTION_ORIGIN,
			);
		});
	}
});

// R-7.6 AC1 — "Given any in-scope path WITHOUT a trailing slash, When
// requested, Then it resolves consistently to a single canonical form rather
// than serving duplicate content at two URLs."
//
// Added by the QA-006 re-verification pass. The matrix credited this to
// "production-smoke.spec.ts + seo-preview.spec.ts — trailing-slash routing",
// and neither file contained any such assertion: every route in
// `support/routes.ts` already carries its trailing slash, so nothing had ever
// requested the un-slashed form. `astro.config.mjs` sets
// `trailingSlash: 'always'`, which is a configuration, not a verification.
//
// WHY THIS IS A PRODUCTION TEST and not a preview one. It was written against
// the built preview first, and failed: `astro preview` answers `/terms` with
// a plain 404, while Cloudflare Pages answers it with a 308 to `/terms/`.
// Both are "not duplicate content", but only one RESOLVES, and R-7.6's own
// subject is "the Pages project serves the built output with correct
// routing". The redirect is the host's behaviour, so the host is what has to
// be asked. Asserting it against `astro preview` would have been a test of
// the wrong server that happened to be cheaper to run.
//
// WHY BROWSER NAVIGATION, NOT request.get(). This test shipped using
// `request.get(..., { maxRedirects: 0 })` and turned the post-deploy gate red
// on its first real run: 15 failures, 5 routes x 3 engines, every one an
// HTTP 403 with `cf-mitigated=challenge`. The site was entirely healthy - the
// other 57 assertions in this job passed, including the apex 301 immediately
// above, which uses `page.goto()`.
//
// That is QA-005 Finding 3 exactly, in a file whose own header already
// explains it: Cloudflare's Bot Fight Mode challenges non-browser HTTP
// clients from GitHub runner IPs. `APIRequestContext` is such a client. It
// passed locally only because a residential IP is not challenged, which is
// the specific way this failure mode hides during development.
//
// The redirect chain is read the same way the apex test reads it: navigate,
// then walk back up `redirectedFrom()`. That observes the 308 itself - not
// merely where the visitor lands, which would be equally true of duplicate
// content served at both URLs - while being a real browser the whole way.
test.describe('R-7.6 AC1 — one canonical URL per page', () => {
	for (const route of allRoutes.filter((r) => r.path !== '/')) {
		const unslashed = route.path.replace(/\/$/, '');
		test(`${unslashed} resolves to the single canonical ${route.path}`, async ({ page }) => {
			const response = await page.goto(`${PRODUCTION_ORIGIN}${unslashed}`);
			assertNavigationOk(response, `${PRODUCTION_ORIGIN}${unslashed}`);

			const hops = await redirectChain(response);

			expect(
				hops.length,
				`${unslashed} was served directly with no redirect; AC1 requires it to resolve to ` +
					`one canonical form, not to serve a second copy of the page`,
			).toBeGreaterThan(0);

			// 308 in practice (Cloudflare Pages), 301 accepted: both are
			// permanent, which is what stops a crawler indexing two URLs.
			expect(
				[301, 308].includes(hops[0].status),
				`${hops[0].url} answered ${hops[0].status}; AC1 needs a permanent redirect`,
			).toBe(true);

			expect(new URL(page.url()).pathname, `${unslashed} must resolve to ${route.path}`).toBe(
				route.path,
			);
		});
	}
});
