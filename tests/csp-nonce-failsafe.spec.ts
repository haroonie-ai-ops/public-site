import { test, expect } from '@playwright/test';

// REQ-001-A2 R-7.5 AC1e — "verified by deliberately forcing a Function
// error in a non-production deployment and inspecting the fallback
// response."
//
// This requires a DEDICATED, non-production Cloudflare Pages deployment
// with FORCE_CSP_MIDDLEWARE_ERROR=true set in ITS OWN environment
// variables (functions/_middleware.ts reads this from context.env, never
// from request input — a visitor cannot trigger it, and it must never be
// set on the production deployment configuration).
//
// KNOWN GAP, disclosed rather than worked around: no such deployment exists
// yet as of this commit. The only way to set a Pages Function environment
// variable is at the PROJECT level (Cloudflare's direct-upload deployment
// API has no per-deployment env var field), and this project's `preview`
// environment config is shared by every in-flight PR preview deploy — so
// setting FORCE_CSP_MIDDLEWARE_ERROR there would force EVERY PR preview
// into the fail-safe path, not just a dedicated one. That is a live,
// shared-infrastructure change with a blast radius beyond this one
// workstream, which is bigger than a routine implementation decision to
// make unilaterally. See this workstream's status note for the
// recommendation (a second, dedicated Pages project or a Cloudflare
// Worker-level environment binding, scoped only to this test).
//
// tests/csp-module.spec.ts already proves the fallback branch's PURE LOGIC
// is correct (FALLBACK_CSP's exact value, never unsafe-inline, no nonce) in
// isolation — what remains unverified is specifically "does the real
// Cloudflare Pages Functions runtime actually reach and return that
// fallback when this Function's own code throws," which is what this file
// exists to check once CSP_FAILSAFE_BASE_URL is provided. Until then, this
// suite skips itself loudly rather than silently reporting a pass it never
// performed.
const FAILSAFE_BASE_URL = process.env.CSP_FAILSAFE_BASE_URL;

test.describe('R-7.5 AC1e — Function fail-safe degrades to the pre-Option-B static CSP on a real deployment', () => {
	test.skip(
		!FAILSAFE_BASE_URL,
		'CSP_FAILSAFE_BASE_URL not set — see this file\'s header comment and status/ for the open verification gap this documents.',
	);

	test('a forced Function error still serves 200 with the strict fallback CSP — never unsafe-inline, never zero CSP', async ({
		request,
	}) => {
		const res = await request.get(FAILSAFE_BASE_URL as string);
		expect(res.status()).toBe(200);

		const csp = res.headers()['content-security-policy'];
		expect(csp, 'must never ship with zero CSP (AC1f)').toBeTruthy();
		expect(csp).not.toMatch(/unsafe-inline/);
		expect(csp, 'fallback path must not carry a nonce token').not.toContain('nonce-');
		expect(csp).toContain("script-src 'self'");
		expect(csp).toBe(
			"default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'",
		);
	});
});
