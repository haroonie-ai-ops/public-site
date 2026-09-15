import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';
import { siteWideHeaders } from './support/headers';

// REQ-001 R-7.5 — baseline security response headers.
//
// AC1 requires X-Content-Type-Options, Referrer-Policy and a
// Content-Security-Policy on every production page response.
// `public/_headers` is Cloudflare Pages' own header mechanism
// (https://developers.cloudflare.com/pages/configuration/headers/) — it is
// not understood by `astro dev` or `astro preview`, so no local server ever
// actually serves these headers. The "declared content" block below is the
// only part of AC1 verifiable from this machine; a real HTTP response
// carrying these headers can only be confirmed against a deployed
// Cloudflare Pages URL (preview or production) — see this workstream's
// status note for that follow-up.
//
// AC2 ("browsing the site produces no CSP violation in the console") *can*
// be verified locally and in a real browser: the "policy enforced" block
// re-applies the exact CSP string from `public/_headers` to every response
// via route interception, then listens for the `securitypolicyviolation`
// DOM event (the authoritative signal browsers raise for a CSP breach —
// more reliable than scraping console text) while visiting every R-2 route.

test.describe('public/_headers declared content (R-7.5 AC1)', () => {
	test('applies to every route via a site-wide "/*" block', () => {
		const headers = siteWideHeaders();

		expect(headers['X-Content-Type-Options']).toBe('nosniff');
		expect(headers['Referrer-Policy']).toBeTruthy();
		expect(headers['Content-Security-Policy']).toBeTruthy();
	});

	test('Content-Security-Policy is present and meaningfully restrictive', () => {
		const csp = siteWideHeaders()['Content-Security-Policy'];

		// Non-empty directives covering the fetch types this site actually
		// uses, each anchored to 'self' rather than left to default-src alone
		// or opened up with a wildcard.
		for (const directive of ['default-src', 'script-src', 'style-src', 'img-src']) {
			expect(csp).toContain(directive);
		}

		// Guardrails against the policy being quietly weakened over time.
		expect(csp).not.toContain('*'); // no wildcard source anywhere
		expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
		expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/);
		expect(csp).toContain("object-src 'none'");
		expect(csp).toContain("frame-ancestors 'none'");
	});

	test('does not set Strict-Transport-Security (R-7.4 scope, not R-7.5)', () => {
		// Deliberate scope boundary (see public/_headers comments): HSTS
		// belongs with the domain/TLS work in Wave 4, owner-blocked on
		// E1/E2. Update this test alongside R-7.4's implementation, not
		// before — an HSTS header shipped ahead of the zone/TLS setup is far
		// harder to safely undo than anything else in this file.
		const headers = siteWideHeaders();
		expect(headers['Strict-Transport-Security']).toBeUndefined();
	});
});

// Mirrors playwright.config.ts's own PW_PREVIEW_PORT default. That file's
// `static-preview` webServer entry (`npm run build && npm run preview`) is
// started once, globally, before any test in this run regardless of which
// project or spec file is selected — so hitting it directly by absolute URL
// works from every project without this file needing its own build. This
// matters here specifically because `astro dev` injects its own inline Vite
// HMR client script into every page, which is invisible in the real
// `astro build` output and would otherwise fail this test with a
// dev-server-only false positive (`script-src-elem` blocking `inline`) that
// says nothing about what Cloudflare Pages will actually serve.
const PREVIEW_PORT = process.env.PW_PREVIEW_PORT ?? '4322';
const PREVIEW_ORIGIN = `http://localhost:${PREVIEW_PORT}`;

test.describe('CSP enforced in a real browser produces no violations (R-7.5 AC2)', () => {
	const csp = siteWideHeaders()['Content-Security-Policy'];
	const routesUnderTest = [...allRoutes, { path: '/this-page-does-not-exist/', navLabel: '404' }];

	for (const route of routesUnderTest) {
		test(`${route.path} loads under the real CSP with zero securitypolicyviolation events`, async ({
			page,
		}) => {
			// Re-apply public/_headers' exact CSP to every response so the
			// browser enforces precisely what Cloudflare Pages will enforce in
			// production, without depending on a deployment to do it.
			await page.route('**/*', async (interceptedRoute) => {
				const response = await interceptedRoute.fetch();
				await interceptedRoute.fulfill({
					response,
					headers: {
						...response.headers(),
						'content-security-policy': csp,
					},
				});
			});

			await page.addInitScript(() => {
				(window as unknown as { __cspViolations: unknown[] }).__cspViolations = [];
				document.addEventListener('securitypolicyviolation', (event) => {
					(window as unknown as { __cspViolations: unknown[] }).__cspViolations.push({
						violatedDirective: event.violatedDirective,
						blockedURI: event.blockedURI,
					});
				});
			});

			const consoleCspMessages: string[] = [];
			page.on('console', (message) => {
				if (/content security policy/i.test(message.text())) {
					consoleCspMessages.push(message.text());
				}
			});

			await page.goto(`${PREVIEW_ORIGIN}${route.path}`);
			// Give any late-firing violation (e.g. from a deferred resource)
			// a moment to be dispatched before reading the collected list.
			await page.waitForLoadState('networkidle');

			const violations = await page.evaluate(
				() => (window as unknown as { __cspViolations: unknown[] }).__cspViolations,
			);

			expect(violations, JSON.stringify(violations)).toEqual([]);
			expect(consoleCspMessages, consoleCspMessages.join('\n')).toEqual([]);
		});
	}
});
