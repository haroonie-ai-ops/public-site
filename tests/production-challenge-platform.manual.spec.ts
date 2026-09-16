import { test, expect } from '@playwright/test';
import { cloudflareChallengeMessage } from './support/cloudflare';

// R-7.5 AC1d — "Given a request to any path under
// /cdn-cgi/challenge-platform/, When the CSP is inspected, Then that path
// resolves under 'self' (same-origin)."
//
// MOVED OUT of the CI-gated production suite (tests/production-security.spec.ts
// / playwright.production.config.ts / the `post-deploy-verify` job) on
// 2026-09-15, per owner direction, after PR #10 fixed 18 of 24 CI failures
// and this file's predecessor test remained one of the 6 that didn't
// convert cleanly to a browser navigation (see below for why).
//
// AC1d is NOT left unverified. It now has TWO verification paths:
//
// 1. PRIMARY, CI-gated, continuous (see
//    tests/production-security.spec.ts's R-7.8 AC1/AC2 describe block):
//    Cloudflare's own injected bootstrap script appends a nested
//    `<script nonce="..." src="/cdn-cgi/challenge-platform/scripts/jsd/main.js">`
//    inside a same-origin iframe that inherits the page's CSP (confirmed by
//    inspecting the injected script's actual source against production,
//    2026-09-15). If `'self'` did not authorize that path, loading it would
//    itself raise a `securitypolicyviolation` event — and the "zero CSP
//    violations" assertion already gating every deploy, on every route,
//    every engine, would catch that immediately. This is a stronger check
//    than a standalone status-code probe: it proves the path is actually
//    *used* successfully by a real browser under the real CSP, not merely
//    reachable.
// 2. SECONDARY, this file, manual: a direct, isolated request to the path
//    itself, independent of whether a given response happens to include
//    the injected script. Kept for the case AC1d's own wording most
//    literally describes ("a request to any path under
//    /cdn-cgi/challenge-platform/"), and to catch a scenario the primary
//    check couldn't: same-origin resolution when the injection is (for any
//    reason) absent from a particular response.
//
// Why this one didn't convert to a browser navigation like the other 5 CI
// failures PR #11 fixed: unlike the nonce checks (which only ever needed an
// HTML document's own response headers — safe to navigate to), this
// specifically requests a bare, non-HTML script file
// (application/javascript) via a 302 redirect chain with no referring page
// or established browsing context. Direct navigation to it was RE-TESTED
// (2026-09-15, all 3 engines) and did NOT reproduce a `net::ERR_ABORTED`
// download-abort in this Playwright/browser version — so that specific
// concern from PR #10 does not currently hold as stated, and is corrected
// here rather than repeated. The check still doesn't belong in the
// CI-gated suite, for a different, better-evidenced reason: it is a "cold"
// isolated request with none of the referrer/session signal a real page
// load carries, which is exactly the kind of client Bot Fight Mode is
// likeliest to challenge from a datacenter IP — the same failure mode the
// nonce checks hit before PR #10, now avoided here by not gating a deploy
// on it at all rather than by hoping a bot-scoring heuristic never flags a
// bare internal-path fetch.
//
// Runnable on demand: `npm run test:production:manual`
// (playwright.production-manual.config.ts). Deliberately excluded from both
// playwright.config.ts (fast pre-merge gate — needs a real deployment) and
// playwright.production.config.ts (`post-deploy-verify`'s required gate —
// this specific request pattern is exposed to Bot Fight Mode challenges,
// and this check does not need to gate every deploy given verification
// path 1 above already does, continuously).
const PRODUCTION_ORIGIN = process.env.PRODUCTION_BASE_URL ?? 'https://www.haroonie.ai';

test.describe('R-7.5 AC1d (manual) — /cdn-cgi/challenge-platform/ resolves under the same origin', () => {
	test('a request to the JS Detections script path is same-origin, not blocked at the network layer', async ({
		request,
	}) => {
		const path = '/cdn-cgi/challenge-platform/scripts/jsd/main.js';
		const res = await request.get(`${PRODUCTION_ORIGIN}${path}`, { failOnStatusCode: false });
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
