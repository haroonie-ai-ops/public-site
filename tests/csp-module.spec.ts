import { test, expect } from '@playwright/test';
import { buildCsp, generateNonce, FALLBACK_CSP, NONCE_BYTE_LENGTH } from '../src/lib/csp';

// REQ-001-A2 — fast, deterministic, no-deployment-required coverage of the
// exact module functions/_middleware.ts calls on every request. This is the
// "engine" both the deployed Function and the production-hostname suite
// (tests/production-security.spec.ts's AC1a/AC1c checks) depend on; proving
// it correct in isolation here means a production failure of those checks
// points at deployment/runtime behavior, not this logic.

test.describe('src/lib/csp — nonce generation (R-7.5 AC1c)', () => {
	test('produces base64 values that decode to >= 128 bits, unique across many calls', () => {
		const nonces = Array.from({ length: 200 }, () => generateNonce());

		expect(new Set(nonces).size, 'no two nonces repeat').toBe(nonces.length);
		for (const nonce of nonces) {
			expect(Buffer.from(nonce, 'base64').length).toBeGreaterThanOrEqual(NONCE_BYTE_LENGTH);
		}
	});
});

test.describe('src/lib/csp — buildCsp (R-7.5 AC1b, U16)', () => {
	test('includes exactly one nonce token alongside self, never unsafe-inline, and carries every other directive verbatim', () => {
		const nonce = generateNonce();
		const csp = buildCsp(nonce);

		expect(csp).toContain(`script-src 'self' 'nonce-${nonce}'`);
		expect(csp.match(/nonce-/g)?.length).toBe(1);
		expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);

		// U16 — every directive except script-src carries over unchanged from
		// the pre-Option-B public/_headers baseline.
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
			expect(csp).toContain(directive);
		}
	});

	test('two calls with fresh nonces never produce the same header value', () => {
		const first = buildCsp(generateNonce());
		const second = buildCsp(generateNonce());
		expect(first).not.toBe(second);
	});
});

test.describe('src/lib/csp — FALLBACK_CSP (R-7.5 AC1e)', () => {
	test('matches the pre-Option-B baseline exactly, never unsafe-inline, no nonce', () => {
		expect(FALLBACK_CSP).toBe(
			"default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'",
		);
		expect(FALLBACK_CSP).not.toMatch(/script-src[^;]*unsafe-inline/);
		expect(FALLBACK_CSP).not.toContain('nonce-');
	});
});
