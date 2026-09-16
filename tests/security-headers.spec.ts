import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';
import { parseHeadersFile } from './support/headers';
import { buildCsp, generateNonce } from '../src/lib/csp';

// REQ-001-A2 — R-7.5's authoritative source for X-Content-Type-Options,
// Referrer-Policy and Content-Security-Policy moved off `public/_headers`
// onto `functions/_middleware.ts` (U15/AC1f): a static file cannot mint a
// per-response nonce, and Cloudflare's own docs say the nonce must arrive
// via the response header, not a <meta> tag. Neither `astro dev` nor
// `astro preview` run Pages Functions at all, so nothing served locally
// ever exercises the real Function — AC1a-AC1d/AC1f/AC2's real, request-time
// behavior can only be verified against a deployed environment:
// tests/production-security.spec.ts (preview or production, via
// playwright.production.config.ts) and tests/csp-nonce-failsafe.spec.ts
// (AC1e specifically). What remains testable from this machine splits into
// two concerns, both below:
//   1. A structural guard — not a comment — that public/_headers can never
//      silently reintroduce these three headers (the double-emission/drift
//      risk REQ-001-A2 §6 risk 2 names).
//   2. The pre-existing local, in-browser check that browsing the built
//      static output under the real CSP *shape* produces zero
//      securitypolicyviolation events — still meaningful locally because
//      this site's build has no executable inline script that would ever
//      need the nonce (only non-executing ld+json), so this exercises the
//      CSP's structural validity, not the nonce-authorization mechanism
//      itself.

test.describe('public/_headers structural guard (REQ-001-A2 U15 / AC1f)', () => {
	test('never reintroduces Content-Security-Policy, X-Content-Type-Options or Referrer-Policy on any pattern', () => {
		const blocks = parseHeadersFile();
		const reintroduced: string[] = [];

		for (const block of blocks) {
			for (const name of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy']) {
				if (name in block.headers) {
					reintroduced.push(`${block.pattern} -> ${name}`);
				}
			}
		}

		expect(
			reintroduced,
			'functions/_middleware.ts is the sole authoritative source for these headers (REQ-001-A2 U15/AC1f). ' +
				'public/_headers must never declare them again, on any pattern, or the deployed response can carry ' +
				'two conflicting values for the same header name (AC1f) with no established Cloudflare precedence ' +
				'rule between them (U17).',
		).toEqual([]);
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

test.describe('CSP shape produces no violations against the built static output, local half (R-7.5 AC2)', () => {
	const routesUnderTest = [...allRoutes, { path: '/this-page-does-not-exist/', navLabel: '404' }];

	for (const route of routesUnderTest) {
		test(`${route.path} loads under the real CSP shape with zero securitypolicyviolation events`, async ({
			page,
		}) => {
			// Re-apply the exact CSP shape functions/_middleware.ts produces
			// (a fresh nonce, same as a real response would carry) to every
			// response so the browser enforces precisely what Cloudflare Pages
			// will enforce in production, without depending on a deployment to
			// do it. See tests/production-security.spec.ts for the real
			// zone-hostname half of AC2 that this local check cannot cover
			// (Bot Fight Mode's injection only occurs on the proxied production
			// hostname, never in this local build).
			const csp = buildCsp(generateNonce());

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
