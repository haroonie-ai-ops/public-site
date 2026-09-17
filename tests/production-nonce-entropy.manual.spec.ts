import { test, expect } from '@playwright/test';
import { assertNavigationOk, cacheBustedUrl } from './support/cloudflare';

// R-7.5 AC1c (the 20-sample half) — "Given a sample of at least 20
// consecutive production responses, When their nonce values are compared,
// Then no two repeat, and each decodes to at least 128 bits (16 bytes) of
// randomness from a cryptographically secure source."
//
// MOVED OUT of the CI-gated production suite (tests/production-security.spec.ts
// / playwright.production.config.ts / the `post-deploy-verify` job) on
// 2026-09-17, per owner direction, following the same pattern and the same
// reasoning as tests/production-challenge-platform.manual.spec.ts (R-7.5
// AC1d). Read that file's header first; this one only records what is
// different.
//
// WHY THIS ONE STILL FAILED AFTER PR #11. PR #11 converted this test from
// APIRequestContext to real browser navigations with per-request cache
// busting, which fixed 5 of the 6 remaining `post-deploy-verify` failures.
// This test was the 6th, and it kept failing — run #51 on `main`
// (b15914618, 2026-09-16): 29 passed, 1 failed, and the failure was this
// test, dying at request 3 of 20 with HTTP 403 / `cf-mitigated=challenge`,
// retried three times across three different Cloudflare edges (EWR, IAD,
// FRA), challenged every time.
//
// The diagnosis is structural, not a coding defect: the request PATTERN is
// the problem, not the client. Twenty rapid, uniquely cache-busted requests
// to the same URL from a datacenter IP is a bot signature, and Bot Fight
// Mode scores it as one no matter how faithfully a real browser issues it.
// That is why single-navigation checks in the same suite pass while this
// burst does not. Converting the client a third time would not change the
// outcome — the E14/E15 trade-off (Bot Fight Mode deliberately kept) means
// Cloudflare also challenges this program's own high-volume verification
// traffic, and that is a consequence to work with, not a bug to fix.
//
// NOTHING IN AC1c WAS WEAKENED TO ACHIEVE THIS (R-8.3 AC1). The sample size
// is still 20, the uniqueness assertion is still exact, and the >= 128-bit
// entropy floor is unchanged. The requirement text in REQ-001 is untouched.
// What changed is WHERE this runs, not WHAT it asserts — and AC1c's
// entropy half additionally remains CI-gated and continuous: the per-request
// difference test that stayed in tests/production-security.spec.ts now also
// asserts the >= 16-byte decode on every nonce it observes, on every deploy.
// So what moved here is specifically the 20-sample STATISTICAL UNIQUENESS
// audit, the one part that inherently needs request volume Bot Fight Mode
// will not tolerate from CI.
//
// Run it on demand, from an unchallenged network path (e.g. a residential
// IP): `npm run test:production:manual`.
const PRODUCTION_ORIGIN = process.env.PRODUCTION_BASE_URL ?? 'https://www.haroonie.ai';

const SAMPLE_SIZE = 20;
const MIN_NONCE_BYTES = 16; // 128 bits — REQ-001 R-7.5 AC1c / U14.

test.describe('R-7.5 AC1c (manual) — 20 consecutive production nonces are unique and >= 128 bits', () => {
	// Generous: 20 sequential real navigations over the network, and a
	// challenged run should fail with this suite's diagnosis rather than a
	// timeout that says nothing.
	test.slow();

	test(`${SAMPLE_SIZE} consecutive responses: no repeated nonce, each decodes to >= 128 bits from a real deployment`, async ({
		page,
	}) => {
		const nonces: string[] = [];
		for (let i = 0; i < SAMPLE_SIZE; i += 1) {
			// eslint-disable-next-line no-await-in-loop -- deliberately sequential: proves per-request generation, not batch/cached.
			const response = await page.goto(cacheBustedUrl(PRODUCTION_ORIGIN + '/', i), { waitUntil: 'commit' });
			assertNavigationOk(response, `/ (request ${i})`);
			const csp = (await response.headersArray()).find((h) => h.name.toLowerCase() === 'content-security-policy')
				?.value;
			const nonce = csp?.match(/'nonce-([^']+)'/)?.[1];
			expect(nonce, `response ${i} missing a nonce token`).toBeTruthy();
			nonces.push(nonce as string);
		}

		expect(new Set(nonces).size, `no two of ${SAMPLE_SIZE} consecutive nonces repeat`).toBe(nonces.length);
		for (const nonce of nonces) {
			expect(Buffer.from(nonce, 'base64').length, `nonce ${nonce}`).toBeGreaterThanOrEqual(MIN_NONCE_BYTES);
		}
	});
});
