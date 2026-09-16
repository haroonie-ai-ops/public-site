// REQ-001-A2 — CSP nonce via Cloudflare Pages Function (Option B, E14
// approved). See requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md.
//
// This is the site's first server-side, request-time component (E14). It
// mints a per-response CSP nonce so Cloudflare's own JavaScript Detections
// / Bot Fight Mode injected bootstrap script — which this zone's Bot Fight
// Mode enables automatically and cannot disable (QA-005 Finding 1) — is
// authorized without weakening script-src to 'unsafe-inline'.
//
// U13 — global route match: this file's location (functions/_middleware.ts)
// applies to every request. CSP on non-document responses is inert in
// browsers, not harmful, and excluding paths only adds a new "did we forget
// one" bug class for no protective benefit.
//
// AUTHORITATIVE SOURCE (U15 / AC1f): this Function is now the ONLY place
// that sets Content-Security-Policy, X-Content-Type-Options and
// Referrer-Policy. `public/_headers` no longer declares any of the three —
// see that file's comment and tests/security-headers.spec.ts's structural
// guard against silently reintroducing them there (the double-emission /
// drift risk REQ-001-A2 §6 risk 2 names).
import { buildCsp, generateNonce, FALLBACK_CSP } from '../src/lib/csp';

interface Env {
	// REQ-001-A2 AC1e verification hook only. Deliberately forces this
	// Function's own header logic into its fail-safe path so the fallback
	// can be exercised against a real deployed Function, per the amendment's
	// "verified by" note for AC1e. Read from deploy-time configuration
	// (Cloudflare Pages environment variables), never from request input —
	// a visitor cannot trigger it. MUST NEVER be set on the production
	// deployment configuration; it exists only for a dedicated,
	// non-production verification deployment (see
	// tests/csp-nonce-function.spec.ts's AC1e test for how it's consumed).
	FORCE_CSP_MIDDLEWARE_ERROR?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
	// An upstream (next()-stage) failure is not this Function's header logic
	// to repair — rethrow unchanged so R-7.2 AC1 (availability) is governed
	// by exactly the same failure path that existed before this Function did.
	const response = await context.next();

	try {
		if (context.env.FORCE_CSP_MIDDLEWARE_ERROR === 'true') {
			throw new Error('REQ-001-A2 AC1e verification hook: forced Function error');
		}

		const headers = new Headers(response.headers);
		headers.set('X-Content-Type-Options', 'nosniff');
		headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		headers.set('Content-Security-Policy', buildCsp(generateNonce()));

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	} catch {
		// AC1e — this Function's own header/nonce logic failed (or was
		// deliberately forced to, above). Degrade CSP strictness back to the
		// pre-Option-B static policy rather than shipping with no CSP at all
		// (AC1f) or a 500 solely because of this fallback. Never
		// 'unsafe-inline', including on this path (AC1b).
		const headers = new Headers(response.headers);
		headers.set('X-Content-Type-Options', 'nosniff');
		headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		headers.set('Content-Security-Policy', FALLBACK_CSP);

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	}
};
