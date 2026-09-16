// REQ-001-A2 — shared Content-Security-Policy construction.
//
// This is the SINGLE place the CSP's directive text is written out. Both
// the Pages Function (`functions/_middleware.ts`, the sole authoritative
// source of the header on a real deployment — see U15/AC1f) and this
// repository's tests import from here, so there is exactly one string to
// keep in sync, not several copies that can silently drift apart.
//
// Framework/runtime-agnostic on purpose: only `crypto.getRandomValues` and
// `btoa` are used, both available in the Cloudflare Pages Functions runtime,
// in every evergreen browser, and in Node 20+ (this repo pins Node via
// .nvmrc well above that), so this file type-checks and runs correctly
// under the root tsconfig (DOM lib, for tests) and under
// `functions/tsconfig.json` (ES2022+DOM lib, for the Function itself)
// without needing two copies.

// U16 — every directive except script-src carries over verbatim from the
// pre-Option-B `public/_headers` baseline (REQ-001-A2 §3.4). Only
// script-src changes, to carry the per-response nonce.
const STATIC_DIRECTIVES = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data:",
	"font-src 'self'",
	"connect-src 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
] as const;

/**
 * The pre-Option-B static policy, byte-for-byte identical to what shipped
 * in `public/_headers` before this amendment (REQ-001-A2 §3.4's recorded
 * baseline). This is also AC1e's fail-safe fallback value: if anything in
 * the Function's nonce/header logic fails, the response must still carry
 * a CSP at least this strict — never zero CSP, never `'unsafe-inline'`.
 */
export const FALLBACK_CSP = [
	STATIC_DIRECTIVES[0],
	STATIC_DIRECTIVES[1],
	STATIC_DIRECTIVES[2],
	"script-src 'self'",
	...STATIC_DIRECTIVES.slice(3),
].join('; ');

/** Minimum nonce entropy per REQ-001-A2 AC1c / U14 (W3C CSP Level 3 recommendation). */
export const NONCE_BYTE_LENGTH = 16; // 128 bits.

/**
 * Builds the full CSP for a single response, authorizing exactly one
 * `nonce-<value>` token in `script-src` alongside `'self'`. Never adds
 * `'unsafe-inline'` (AC1b) — a browser that doesn't honor the nonce must
 * fail closed, not fall back to allowing all inline script.
 */
export function buildCsp(nonce: string): string {
	return [
		STATIC_DIRECTIVES[0],
		STATIC_DIRECTIVES[1],
		STATIC_DIRECTIVES[2],
		`script-src 'self' 'nonce-${nonce}'`,
		...STATIC_DIRECTIVES.slice(3),
	].join('; ');
}

/**
 * A cryptographically random, base64-encoded nonce, unique per call.
 * `crypto.getRandomValues` (Web Crypto, CSPRNG-backed) — never
 * `Math.random()`, a counter, a timestamp, or `crypto.randomUUID()` (fewer
 * effective random bits than a raw 128-bit value once its version/variant
 * bits are accounted for). See REQ-001-A2 U14.
 */
export function generateNonce(): string {
	const bytes = new Uint8Array(NONCE_BYTE_LENGTH);
	crypto.getRandomValues(bytes);
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary);
}
