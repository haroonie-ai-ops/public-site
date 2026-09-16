import { test, expect, type APIResponse, type Response } from '@playwright/test';
import { allRoutes } from './support/routes';

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
// Fix: the primary describe block below now reads headers from the
// `Response` returned by `page.goto()` — a real browser navigation — instead
// of a separate `request.get()` call. This is not just a workaround, it is
// the more faithful check: it asserts what a visitor's browser actually
// receives, in the same request that also drives the CSP-violation/
// console-error checks (previously two separate HTTP requests; now one).
//
// The two describe blocks below that still need distinct, repeated raw HTTP
// requests (nonce-uniqueness across N requests; the same-origin check on a
// path a browser might try to download rather than render) keep using
// `request.get()`, since converting them to `page.goto()` trades one failure
// mode (bot-challenge 403) for another (Chrome aborts navigation with
// net::ERR_ABORTED when a response is treated as a download, which a raw
// script-file response risks). Instead, both are wrapped with
// `cloudflareChallengeMessage()` below, so if Bot Fight Mode ever also
// starts challenging them, the failure names the cause in one line instead
// of requiring log archaeology.
//
// AC1f caution (do not weaken, do not drop): a browser `Response`
// object's `headersArray()` could in principle coalesce duplicate
// same-name headers into one comma-joined entry, which would make the
// "exactly one CSP header" check below blind to real double-emission.
// Checked against the installed Playwright version's own source
// (node_modules/playwright-core/lib/coreBundle.js) rather than assumed:
//   - Chromium: `ResponseExtraInfoTracker._patchHeaders` builds raw
//     response headers from `Network.responseReceivedExtraInfo`, joining
//     same-name duplicates with "\n" in a headers object, then
//     `headersObjectToArray(headers, "\n")` splits that back into
//     separate array entries — duplicates ARE preserved, not merged.
//   - Firefox (`ffNetworkManager.ts`) and WebKit (`wkPage.ts`) instead
//     receive an already-comma-joined value per header name and run it
//     through `parseMultivalueHeaders`/`headersObjectToArray(headers, ",")`,
//     splitting back into separate array entries on "," (except
//     Set-Cookie, split on "\n"). This recovers duplicate CSP headers
//     correctly for the same reason it's safe generally here: this
//     policy's directives never contain a literal comma, so a
//     single real header round-trips as exactly one array entry, and two
//     real headers round-trip as exactly two.
// Conclusion: `response.headersArray()` on a browser navigation response
// preserves duplicate `Content-Security-Policy` instances across all three
// engines this program tests, by a different (and, for Firefox/WebKit,
// less direct) mechanism than the retired APIResponse-based check used. If
// a future Playwright upgrade changes this, this comment is the place to
// re-verify it — do not silently trust it forever.
function cloudflareChallengeMessage(
	response: { status(): number; headers(): Record<string, string> },
	path: string,
): string | null {
	if (response.status() !== 403) return null;
	const headers = response.headers();
	const cfMitigated = headers['cf-mitigated'];
	const server = headers['server']?.toLowerCase() ?? '';
	if (cfMitigated === undefined && !server.includes('cloudflare')) return null;
	return (
		`${path}: HTTP 403 with Cloudflare markers (cf-ray=${headers['cf-ray'] ?? 'absent'}, ` +
		`cf-mitigated=${cfMitigated ?? 'absent'}, server=${headers['server'] ?? 'absent'}) — almost certainly Bot ` +
		"Fight Mode challenging this verification client's IP/fingerprint reputation (QA-005 Finding 3), not a " +
		'product defect. Re-run from an unchallenged network path (e.g. a residential IP) before treating this as ' +
		'a regression.'
	);
}

// Asserts a real-browser navigation succeeded, failing with a message that
// distinguishes a Bot Fight Mode challenge from an actual non-200 response.
function assertNavigationOk(response: Response | null, path: string): asserts response is Response {
	if (!response) {
		throw new Error(`${path}: navigation produced no response object`);
	}
	const challenge = cloudflareChallengeMessage(response, path);
	if (challenge) throw new Error(challenge);
	expect(response.status(), path).toBe(200);
}

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

test.describe('R-7.5 AC1a/AC1c — nonce is per-response, unique, and CSPRNG-length, on the real production hostname', () => {
	// These two tests need many distinct, repeated raw HTTP requests, which is
	// what `request.get()` is for. They still hit the same Bot Fight Mode
	// exposure as the retired approach in the block above, so each response
	// is checked for a challenge before being trusted (QA-005 Finding 3).
	function assertApiResponseOk(response: APIResponse, path: string): void {
		const challenge = cloudflareChallengeMessage(response, path);
		if (challenge) throw new Error(challenge);
		expect(response.status(), path).toBe(200);
	}

	test('nonce differs between two separate requests to the same URL', async ({ request }) => {
		const nonceOf = (csp: string | undefined) => csp?.match(/'nonce-([^']+)'/)?.[1];

		const first = await request.get(PRODUCTION_ORIGIN + '/');
		assertApiResponseOk(first, '/');
		const second = await request.get(PRODUCTION_ORIGIN + '/');
		assertApiResponseOk(second, '/');
		const n1 = nonceOf(first.headers()['content-security-policy']);
		const n2 = nonceOf(second.headers()['content-security-policy']);

		expect(n1, 'first response must carry a nonce').toBeTruthy();
		expect(n2, 'second response must carry a nonce').toBeTruthy();
		expect(n1).not.toBe(n2);
	});

	test('20 consecutive responses: no repeated nonce, each decodes to >= 128 bits from a real deployment', async ({
		request,
	}) => {
		const nonces: string[] = [];
		for (let i = 0; i < 20; i += 1) {
			// eslint-disable-next-line no-await-in-loop -- deliberately sequential: proves per-request generation, not batch/cached.
			const res = await request.get(PRODUCTION_ORIGIN + '/');
			assertApiResponseOk(res, `/ (request ${i})`);
			const nonce = res.headers()['content-security-policy']?.match(/'nonce-([^']+)'/)?.[1];
			expect(nonce, `response ${i} missing a nonce token`).toBeTruthy();
			nonces.push(nonce as string);
		}

		expect(new Set(nonces).size, 'no two of 20 consecutive nonces repeat').toBe(nonces.length);
		for (const nonce of nonces) {
			expect(Buffer.from(nonce, 'base64').length, `nonce ${nonce}`).toBeGreaterThanOrEqual(16);
		}
	});
});

test.describe('R-7.5 AC1d — /cdn-cgi/challenge-platform/ resolves under the same origin', () => {
	test('a request to the JS Detections script path is same-origin, not blocked at the network layer', async ({
		request,
	}) => {
		const res = await request.get(`${PRODUCTION_ORIGIN}/cdn-cgi/challenge-platform/scripts/jsd/main.js`, {
			failOnStatusCode: false,
		});
		const path = '/cdn-cgi/challenge-platform/scripts/jsd/main.js';
		const challenge = cloudflareChallengeMessage(res, path);
		if (challenge) throw new Error(challenge);
		// 'self' authorizes by origin, not path — same-origin is what AC1d
		// actually requires. Any real HTTP response (not a network-level
		// failure) from this same hostname proves the path is reachable
		// under 'self'; the specific status Cloudflare returns for this
		// internal path is not this program's contract to assert on.
		expect(res.url().startsWith(PRODUCTION_ORIGIN)).toBe(true);
		expect(res.status()).toBeGreaterThan(0);
		expect(res.status()).toBeLessThan(500);
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
