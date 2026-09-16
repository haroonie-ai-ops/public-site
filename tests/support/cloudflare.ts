import { expect, type APIResponse, type Response } from '@playwright/test';

// Shared by every production-hostname spec (QA-005 Finding 3): distinguishes
// a Cloudflare Bot Fight Mode challenge (HTTP 403 with Cloudflare markers)
// from a genuine product failure, so a CI failure self-diagnoses instead of
// requiring log archaeology from a bare status-code mismatch. Originally
// local to tests/production-security.spec.ts (PR #10); extracted here so
// tests/production-challenge-platform.manual.spec.ts (R-7.5 AC1d's
// relocated verification, see that file's header comment) can reuse it
// without duplicating the detection logic.
export function cloudflareChallengeMessage(
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
export function assertNavigationOk(response: Response | null, path: string): asserts response is Response {
	if (!response) {
		throw new Error(`${path}: navigation produced no response object`);
	}
	const challenge = cloudflareChallengeMessage(response, path);
	if (challenge) throw new Error(challenge);
	expect(response.status(), path).toBe(200);
}

// Same idea for the (now manual-only) APIRequestContext-based check.
export function assertApiResponseOk(response: APIResponse, path: string): void {
	const challenge = cloudflareChallengeMessage(response, path);
	if (challenge) throw new Error(challenge);
	expect(response.status(), path).toBe(200);
}

// R-7.5 AC1a/AC1c (nonce-uniqueness checks, PR #11): defeats browser HTTP
// caching deliberately rather than trusting the current
// `Cache-Control: public, max-age=0, must-revalidate` response header to
// keep forcing revalidation forever. A unique query string per navigation
// guarantees a distinct cache key regardless of Cache-Control semantics, so
// correctness never depends on that header's value continuing to hold in
// the future. Astro/Cloudflare Pages route matching ignores the query
// string (verified empirically against production, 2026-09-15: identical
// nonces were never observed across cache-busted requests), so this cannot
// change which page is served.
export function cacheBustedUrl(url: string, tag: string | number): string {
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}_verify=${Date.now()}-${tag}-${Math.random().toString(36).slice(2)}`;
}
