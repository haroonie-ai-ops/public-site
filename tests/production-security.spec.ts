import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';
import { assertNavigationOk, cacheBustedUrl } from './support/cloudflare';

// REQ-001-A2 R-7.8 — automated verification against the real production
// hostname, not build output or the `pages.dev` origin (QA-005 Finding 2:
// no suite in this program ever traversed the real Cloudflare zone proxy,
// which is where Bot Fight Mode / JavaScript Detections actually injects a
// script — the reason R-7.5 AC2 and R-5.3 AC1's production failure was
// invisible through five green CI runs and a full Wave 6 audit).
//
// Deliberately run under playwright.production.config.ts, NEVER under the
// default `npm test` (playwright.config.ts's fast pre-merge gate) — see
// R-7.8 AC6: additive, not a replacement for the existing build-output
// suites (cross-browser.spec.ts, lighthouse.spec.ts, security-headers.spec.ts),
// which stay exactly as they were.
//
// Overridable via PRODUCTION_BASE_URL so this same spec can be pointed at a
// different real deployment for engineering verification without editing
// the file, but it defaults to the actual hostname visitors use — the whole
// point of R-7.8.
const PRODUCTION_ORIGIN = process.env.PRODUCTION_BASE_URL ?? 'https://www.haroonie.ai';

// QA-005 Finding 3 — TEST_DEFECT. Every route in the primary describe block
// below failed CI (18/18: 6 routes x 3 engines) on `expect(status).toBe(200)`
// because the precondition request used Playwright's APIRequestContext — a
// plain HTTP client with no browser fingerprint. Cloudflare's Bot Fight Mode
// (deliberately kept — see REQ-001 E14/E15) challenges that client from a
// GitHub Actions runner IP and returns 403 before the test ever reaches its
// CSP assertions. The 15 checks in this same CI run driven by a real browser
// (`page.goto()`) were not challenged and all passed. `curl` from a
// residential IP gets 200 on every route; the CI runner got 403 on all of
// them. This is environmental (CI-runner-IP-dependent), not a product fault,
// and it is a direct, foreseeable-in-hindsight consequence of the program
// keeping Bot Fight Mode enabled.
//
// Fix (PR #10): the primary describe block below reads headers from the
// `Response` returned by `page.goto()` — a real browser navigation — instead
// of a separate `request.get()` call. This is not just a workaround, it is
// the more faithful check: it asserts what a visitor's browser actually
// receives, in the same request that also drives the CSP-violation/
// console-error checks (previously two separate HTTP requests; now one).
// This shipped and fixed 18/18 of the original failures.
//
// Remaining 6 (PR #11) — the two nonce-uniqueness checks below
// were deliberately left on `APIRequestContext` in PR #10, on the theory
// that converting them to `page.goto()` would trade one failure mode (bot
// challenge) for another (`net::ERR_ABORTED` when a response is treated as
// a download). Re-verified directly against production (2026-09-15,
// chromium/firefox/webkit): navigating to an HTML document never risks
// this — only a raw non-HTML file response (e.g. a bare script file) can be
// download-sniffed, and neither nonce check ever needed to fetch one; both
// only ever needed the HTML document's own CSP header. So both became
// real browser navigations too, which closed 5 of the remaining 6 CI
// failures the same way PR #10 closed the first 18: a client with a real
// browser fingerprint is not challenged by Bot Fight Mode.
//
// The 6th did not yield to that, and is no longer in this suite: AC1c's
// 20-sample burst moved to tests/production-nonce-entropy.manual.spec.ts
// on 2026-09-17 (see that file's header). Request VOLUME, not client type,
// was what Bot Fight Mode scored there.
//
// Caching risk, deliberately defeated rather than assumed away: repeated
// `page.goto()` calls to the same URL, in the same browsing context, risk
// the browser's HTTP cache silently replaying an earlier response instead
// of making a fresh request — which would make a nonce-uniqueness check
// compare two copies of the same response and could hide a real defect
// (or, depending on how a cache hit surfaces through Playwright, produce a
// false failure blamed on the product instead of the test's own caching).
// Empirically, production's `Cache-Control: public, max-age=0,
// must-revalidate` with no ETag/Last-Modified validator already forces a
// fresh network round-trip on every navigation in all three engines (no
// two of 4 repeated same-URL, same-context navigations ever shared a
// nonce, verified directly against https://www.haroonie.ai/ before writing
// this). But that is *today's* header configuration, not a contract this
// test should silently depend on holding forever — `cacheBustedUrl()`
// (tests/support/cloudflare.ts) appends a unique query string per
// navigation, which guarantees a distinct cache key structurally,
// independent of Cache-Control semantics now or after any future change to
// them. Astro/Cloudflare Pages route matching ignores the query string, so
// this cannot route to a different page.
//
// This is not vacuous: the exact same page.goto() + cache-busting mechanics
// were run locally against a throwaway HTTP server that deliberately
// serves a FIXED nonce (simulating a real regression, e.g. `generateNonce()`
// being accidentally memoized) — `new Set(nonces).size` correctly came back
// smaller than `nonces.length` and the assertion correctly failed. The same
// mechanics against a server minting a fresh nonce per response correctly
// passed. Both engineering self-test runs described in
// status/QA-005-production-hostname-test-gap.md Finding 3.
test.describe('R-7.8 AC1/AC2 — production hostname: zero CSP violations, zero console errors, security headers present', () => {
	for (const route of allRoutes) {
		test(`${route.path} — no CSP violations or console errors on the real production hostname`, async ({ page }) => {
			// Listeners must be attached before navigation.
			await page.addInitScript(() => {
				(window as unknown as { __cspViolations: unknown[] }).__cspViolations = [];
				document.addEventListener('securitypolicyviolation', (event) => {
					(window as unknown as { __cspViolations: unknown[] }).__cspViolations.push({
						violatedDirective: event.violatedDirective,
						blockedURI: event.blockedURI,
					});
				});
			});

			const consoleErrors: string[] = [];
			page.on('console', (message) => {
				if (message.type() === 'error') consoleErrors.push(message.text());
			});
			const pageErrors: string[] = [];
			page.on('pageerror', (error) => pageErrors.push(error.message));

			// One real browser navigation drives both the header assertions
			// (AC2, AC1f) and the behavioural assertions (AC1) below — the
			// same response a visitor's browser would receive, not a separate
			// APIRequestContext call (QA-005 Finding 3).
			const response = await page.goto(`${PRODUCTION_ORIGIN}${route.path}`);
			assertNavigationOk(response, route.path);

			// AC1f (R-7.5) — exactly one Content-Security-Policy header, never
			// zero (Function not running) and never two (Function + a stale
			// public/_headers entry both firing). See the file-header comment
			// above for why `headersArray()` on a browser Response still
			// preserves duplicate instances instead of coalescing them — but
			// note this MUST be the async `headersArray()`/`allHeaders()` pair
			// (backed by `rawResponseHeaders`, Playwright's raw-header channel
			// call), not the sync, `@deprecated` `headers()`, which reads
			// "provisional" headers captured before the raw-header round trip
			// and is exactly the coalescing risk this comment warns about.
			const cspEntries = (await response.headersArray()).filter(
				(h) => h.name.toLowerCase() === 'content-security-policy',
			);
			expect(cspEntries.length, `${route.path}: expected exactly one CSP header (R-7.5 AC1f)`).toBe(1);

			const headers = await response.allHeaders();
			expect(headers['x-content-type-options'], route.path).toBe('nosniff');
			expect(headers['referrer-policy'], route.path).toBeTruthy();
			expect(headers['strict-transport-security'], `${route.path}: HSTS stays deliberately unset (R-7.4 AC2)`).toBeUndefined();

			const csp = cspEntries[0]?.value;
			expect(csp, route.path).toBeTruthy();
			// R-7.5 AC1b — 'self' and exactly one nonce token, never unsafe-inline.
			expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
			expect(csp?.match(/nonce-/g)?.length, route.path).toBe(1);
			expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
			expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/);
			// U16 — every other directive carries over unchanged.
			for (const directive of [
				"default-src 'self'",
				"base-uri 'self'",
				"object-src 'none'",
				"style-src 'self' 'unsafe-inline'",
				"img-src 'self' data:",
				"font-src 'self'",
				"connect-src 'self'",
				"form-action 'self'",
				"frame-ancestors 'none'",
			]) {
				expect(csp, route.path).toContain(directive);
			}

			// AC1 — a real browser, on the real hostname, must report zero
			// securitypolicyviolation events and zero console errors. This is
			// the check that FAILED 18/18 in QA-005 before this Function shipped.
			//
			// This same "zero violations" assertion is also this program's
			// live, continuous verification of R-7.5 AC1d (see
			// tests/production-challenge-platform.manual.spec.ts's header
			// comment): Cloudflare's own injected bootstrap script appends a
			// nested `<script nonce="..." src="/cdn-cgi/challenge-platform/
			// scripts/jsd/main.js">` inside a same-origin iframe that inherits
			// this page's CSP (confirmed by inspecting the injected script's
			// source, 2026-09-15). If `'self'` did not authorize that path,
			// loading it would itself raise a `securitypolicyviolation` event,
			// which the assertion below would catch. So AC1d is verified here,
			// on every route, every engine, every deploy — not just by the
			// relocated manual spec.
			await page.waitForLoadState('networkidle');

			const violations = await page.evaluate(
				() => (window as unknown as { __cspViolations: unknown[] }).__cspViolations,
			);
			expect(violations, JSON.stringify(violations)).toEqual([]);
			expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
			expect(pageErrors, pageErrors.join('\n')).toEqual([]);
		});
	}
});

// R-7.5 AC1a, plus AC1c's entropy floor. AC1c's 20-sample statistical
// uniqueness audit used to live here too; it moved to
// tests/production-nonce-entropy.manual.spec.ts on 2026-09-17 per owner
// direction (that file's header carries the full reasoning and the run #51
// evidence). Short version: 20 rapid cache-busted requests from a datacenter
// IP is a bot signature Bot Fight Mode challenges regardless of client, so
// it was failing every deploy on an environmental trigger — the exact
// "job that always fails and gets ignored" outcome PR #11 existed to avoid.
//
// AC1c is NOT left to a manual-only check. Its >= 128-bit entropy floor is
// asserted below on every nonce this CI-gated test observes, on every
// deploy, at zero extra request cost — only the part that inherently needs
// request VOLUME was relocated. Nothing asserted here or there was
// weakened (R-8.3 AC1); REQ-001's AC1c text is unchanged.
test.describe('R-7.5 AC1a/AC1c — nonce is per-response and CSPRNG-length, on the real production hostname', () => {
	test('nonce differs between two separate requests to the same URL, and each carries >= 128 bits', async ({
		page,
	}) => {
		const nonceOf = (csp: string | undefined) => csp?.match(/'nonce-([^']+)'/)?.[1];

		const firstResponse = await page.goto(cacheBustedUrl(PRODUCTION_ORIGIN + '/', 'a'), { waitUntil: 'commit' });
		assertNavigationOk(firstResponse, '/ (request a)');
		const firstCsp = (await firstResponse.headersArray()).find(
			(h) => h.name.toLowerCase() === 'content-security-policy',
		)?.value;

		const secondResponse = await page.goto(cacheBustedUrl(PRODUCTION_ORIGIN + '/', 'b'), { waitUntil: 'commit' });
		assertNavigationOk(secondResponse, '/ (request b)');
		const secondCsp = (await secondResponse.headersArray()).find(
			(h) => h.name.toLowerCase() === 'content-security-policy',
		)?.value;

		const n1 = nonceOf(firstCsp);
		const n2 = nonceOf(secondCsp);

		expect(n1, 'first response must carry a nonce').toBeTruthy();
		expect(n2, 'second response must carry a nonce').toBeTruthy();
		expect(n1).not.toBe(n2);

		// AC1c's entropy floor, kept CI-gated and continuous. These two
		// nonces were already fetched for the uniqueness check above, so
		// asserting on them costs no additional requests — and therefore
		// carries none of the bot-scoring risk that forced the 20-sample
		// audit out of this suite.
		for (const nonce of [n1, n2] as string[]) {
			expect(Buffer.from(nonce, 'base64').length, `nonce ${nonce} must decode to >= 128 bits`).toBeGreaterThanOrEqual(
				16,
			);
		}
	});
});

test.describe('R-7.8 AC3 — JavaScript transfer size, production hostname (supersedes any pages.dev/local figure per R-5.2 AC2 correction)', () => {
	for (const route of allRoutes) {
		test(`${route.path} ships under 50KB of compressed JavaScript on production`, async ({ page, browserName }) => {
			// Byte count is a property of the response, not the rendering
			// engine — chromium only, same reasoning as cross-browser.spec.ts.
			test.skip(browserName !== 'chromium', 'JS-weight is engine-independent; chromium only');

			let jsBytes = 0;
			const sizePromises: Promise<void>[] = [];
			page.on('requestfinished', (req) => {
				if (req.resourceType() !== 'script') return;
				sizePromises.push(
					req.sizes().then((sizes) => {
						jsBytes += sizes.responseBodySize;
					}),
				);
			});

			const response = await page.goto(`${PRODUCTION_ORIGIN}${route.path}`);
			assertNavigationOk(response, route.path);
			await page.waitForLoadState('networkidle');
			await Promise.all(sizePromises);

			// eslint-disable-next-line no-console -- deliberate: this is the R-5.2 AC2 evidence trail (§3.3), recorded per-run, not just asserted.
			console.log(`R-5.2 AC2 evidence (production): ${route.path} => ${jsBytes} bytes of JS`);
			expect(jsBytes, `${route.path} transferred ${jsBytes} bytes of JS on production`).toBeLessThan(50 * 1024);
		});
	}
});
