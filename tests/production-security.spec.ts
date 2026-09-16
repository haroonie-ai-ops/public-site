import { test, expect } from '@playwright/test';
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

test.describe('R-7.8 AC1/AC2 — production hostname: zero CSP violations, zero console errors, security headers present', () => {
	for (const route of allRoutes) {
		test(`${route.path} — no CSP violations or console errors on the real production hostname`, async ({
			page,
			request,
		}) => {
			// AC2 — response headers asserted on the live response itself, not
			// inferred from `_headers` file content or local build output.
			// AC1f (R-7.5) — exactly one Content-Security-Policy header, never
			// zero (Function not running) and never two (Function + a stale
			// public/_headers entry both firing). `headersArray()` preserves
			// duplicate header instances the way a plain object map cannot.
			const apiResponse = await request.get(`${PRODUCTION_ORIGIN}${route.path}`);
			expect(apiResponse.status(), route.path).toBe(200);

			const cspHeaderCount = apiResponse
				.headersArray()
				.filter((h) => h.name.toLowerCase() === 'content-security-policy').length;
			expect(cspHeaderCount, `${route.path}: expected exactly one CSP header (R-7.5 AC1f)`).toBe(1);

			const headers = apiResponse.headers();
			expect(headers['x-content-type-options'], route.path).toBe('nosniff');
			expect(headers['referrer-policy'], route.path).toBeTruthy();
			expect(headers['strict-transport-security'], `${route.path}: HSTS stays deliberately unset (R-7.4 AC2)`).toBeUndefined();

			const csp = headers['content-security-policy'];
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

			const response = await page.goto(`${PRODUCTION_ORIGIN}${route.path}`);
			expect(response?.status()).toBe(200);
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
	test('nonce differs between two separate requests to the same URL', async ({ request }) => {
		const nonceOf = (csp: string | undefined) => csp?.match(/'nonce-([^']+)'/)?.[1];

		const first = await request.get(PRODUCTION_ORIGIN + '/');
		const second = await request.get(PRODUCTION_ORIGIN + '/');
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
		test(`${route.path} ships under 50KB of compressed JavaScript on production`, async ({
			page,
			browserName,
		}) => {
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

			await page.goto(`${PRODUCTION_ORIGIN}${route.path}`);
			await page.waitForLoadState('networkidle');
			await Promise.all(sizePromises);

			// eslint-disable-next-line no-console -- deliberate: this is the R-5.2 AC2 evidence trail (§3.3), recorded per-run, not just asserted.
			console.log(`R-5.2 AC2 evidence (production): ${route.path} => ${jsBytes} bytes of JS`);
			expect(jsBytes, `${route.path} transferred ${jsBytes} bytes of JS on production`).toBeLessThan(50 * 1024);
		});
	}
});
