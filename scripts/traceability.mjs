// R-8.1 — generates and checks status/R8-TRACEABILITY-MATRIX.md.
//
// WHY THIS IS IN THE REPOSITORY. The first matrix was produced by a script
// that lived in a temp directory and was never committed, while the document
// it produced claimed that "the generator asserts that the mapping covers
// exactly the extracted set, so this document cannot silently drift". QA-006
// found the generator absent and the drift claim therefore unverifiable —
// the "135 criteria" headline could not be reproduced by anyone.
//
// Two modes:
//   node scripts/traceability.mjs            rewrite the matrix from MAP
//   node scripts/traceability.mjs --check    fail if the file on disk differs
//
// `--check` runs in CI (see .github/workflows/ci-cd.yml), which is what makes
// the drift guard real: edit REQ-001 to add an AC and the build fails until
// the AC has a verdict; edit the matrix by hand and the build fails until the
// edit is made here instead.
//
// WHAT A VERDICT MEANS. The previous matrix had five verdicts and reported
// GAP: 0, which required criteria that were struck, unverifiable, or
// deliberately deviated from to be filed under a passing verdict. Three more
// exist now, and the honest headline is longer than "0 gaps" as a result.

import { readFileSync, writeFileSync } from 'node:fs';

const A = 'AUTOMATED'; // a named test asserts the criterion
const M = 'MANUAL'; // a dated, recorded verification exists
const C = 'CI'; // enforced by pipeline or platform configuration
const B = 'BLOCKED'; // cannot be verified yet, by an owner-acknowledged dependency
const L = 'ACCEPTED-LIMITATION'; // the owner accepted that it cannot be verified
const D = 'DEVIATION'; // the product deliberately departs from the AC as written
const X = 'N/A'; // struck, or governs something that does not exist
const G = 'GAP'; // not verified, and none of the above

const ORDER = [A, M, C, B, L, D, X, G];

const MEANING = {
	[A]: 'A named test asserts it',
	[M]: 'A dated, recorded verification exists',
	[C]: 'Enforced by pipeline or platform configuration',
	[B]: 'Cannot be verified yet, by an owner-acknowledged dependency',
	[L]: 'Cannot be verified; the owner accepted the limitation rather than calling it a pass',
	[D]: 'Verified, and the product deliberately departs from the AC as written. Each row states whether the owner has ruled on it',
	[X]: 'Struck, or governs something that does not exist. Not counted as verified',
	[G]: '**Not verified, and not covered by any verdict above**',
};

// ---------------------------------------------------------------------------
// The mapping. Every entry was re-derived for the QA-006 remediation pass by
// reading the AC text in REQ-001, then reading what the named test ASSERTS —
// not what it is named after. That distinction is the root cause QA-006
// identified: "the matrix was assembled by reading what a test was for rather
// than what it asserts".
// ---------------------------------------------------------------------------
const MAP = {
	// R-1 — foundation
	'R-1.1 AC1': [M, 'QA-001 Wave 1 — recorded the default branch as `master` (PRODUCT_DEFECT), remediated to `main`. Corrected here: the matrix credited "scaffold builds and serves", which is R-1.2 AC1.'],
	'R-1.2 AC1': [C, 'ci-cd.yml validate job — `npm ci` then `npm run build` on a fresh checkout on every PR, exit 0 required. Corrected here: AC1 and AC2 were transposed in the previous matrix (QA-006 Finding 10).'],
	'R-1.2 AC2': [M, '`.nvmrc` and `package-lock.json` are both committed; `engines.node` in package.json pins 24.21.0. QA-001 verified `npm ci` reproduces.'],
	'R-1.3 AC1': [A, 'smoke.spec.ts — every route in R-2 returns 200 against the dev server, which is the server this AC names.'],
	'R-1.4 AC1': [C, 'Two controls, and the scope of each is now stated accurately (QA-006 Finding 5). Per-commit: ci-cd.yml `secret-scan` (gitleaks over the EVENT RANGE — one commit under squash merge), a required merge check, gating both deploy jobs. Full history: .github/workflows/secret-scan-history.yml, weekly and on demand, which is the only mode gitleaks-action scans everything. Plus GitHub secret_scanning and push protection, enabled by the owner 2026-09-18. The previous row claimed "full history" of the per-commit job, which was not true of it.'],

	// R-2 — pages and content
	'R-2.1 AC1': [A, 'home.spec.ts — exactly one visible h1, above the fold at 1280x800 and 390x844. Corrected here: the previous row described AC2 (the CTA).'],
	'R-2.1 AC2': [A, 'home.spec.ts — a single primary CTA is present and links to /contact/.'],
	'R-2.1 AC3': [A, 'home.spec.ts — a visible service summary links through to /services/.'],
	'R-2.2 AC1': [A, 'services.spec.ts — between two and six distinct entries, each with a heading and description.'],
	'R-2.2 AC2': [A, 'services.spec.ts — a CTA to /contact/ is present. Corrected here: the previous row described the content-collection sourcing, which is R-2.8.'],
	'R-2.3 AC1': [A, 'about.spec.ts — the owner-approved biography renders, with no placeholder markers.'],
	'R-2.4 AC1': [A, 'contact.spec.ts — the mailto is visible and actionable, the telephone number likewise, and no booking link is rendered. Booking clause STRUCK by owner decision 2026-09-18 ("Cancel e22 and p17").'],
	'R-2.4 AC2': [A, 'contact.spec.ts — name, email and message each have a programmatically associated label.'],
	'R-2.4 AC3': [M, 'External resolution of all six mail records against 8.8.8.8, re-run 2026-09-18T14:47Z by this pass and recorded in WAVE4-dns-evidence.md, plus the byte-identical API comparison. E12 approved "API comparison PLUS an external dig"; QA-006 Finding 12 found only the API half had been run. Both halves now exist.'],
	'R-2.5 AC1': [A, 'legal.spec.ts — all four required privacy sections present and non-empty.'],
	'R-2.5 AC2': [A, 'smoke.spec.ts — the footer links to /privacy/ and /terms/ on every page.'],
	'R-2.6 AC1': [A, 'smoke.spec.ts — an unknown path returns HTTP 404 and the branded page links home.'],
	'R-2.7 AC1': [A, 'smoke.spec.ts (four nav links, current page marked and no other) + brand-tokens.spec.ts (the indicator is not colour-only) + brand-identity.spec.ts (the header home link is the logo, R-9.3 AC2).'],
	'R-2.7 AC2': [A, 'smoke.spec.ts — the footer shows the company name, a copyright year and the legal links.'],
	'R-2.8 AC1': [A, 'seo-preview.spec.ts — editing only a Markdown content file changes the rendered page after a rebuild.'],

	// R-3 — enquiry
	'R-3.1 AC1': [B, 'E4 — no transactional email credential. The form is markup only; contact.spec.ts asserts it is NOT wired (no action attribute, submit disabled).'],
	'R-3.1 AC2': [B, 'E4 — inline validation is part of the unwired form.'],
	'R-3.1 AC3': [B, 'E4 — spam protection is part of the unwired form.'],

	// R-4 — SEO and analytics
	'R-4.1 AC1': [A, 'seo.spec.ts — title and description present, non-empty and unique across every page.'],
	'R-4.1 AC2': [A, 'seo.spec.ts — canonical present and in the https://www.haroonie.ai form.'],
	'R-4.1 AC3': [A, 'seo.spec.ts asserts the OG tags are PRESENT, which is all AC3 requires of them; icons.spec.ts constrains the image VALUE per R-9.7 AC3, including twitter:image, which nothing tested before (QA-006 Finding 10).'],
	'R-4.2 AC1': [A, 'seo-preview.spec.ts — the sitemap index is served and lists every public page, excluding the 404. Measured on the built output, which is the artefact the production host serves.'],
	'R-4.2 AC2': [A, 'seo-preview.spec.ts — /robots.txt returns 200 as text/plain and references the sitemap. Corrected here: the previous row described AC1.'],
	'R-4.3 AC1': [A, 'seo.spec.ts — the home page carries a valid Organization/ProfessionalService JSON-LD block with the company name and canonical URL.'],
	'R-4.4 AC1': [D, 'OWNER-ACCEPTED 2026-09-19 ("#4 option A") with a recorded exit condition; AC1\'s text is unchanged. First clause, asserted: seo-preview.spec.ts builds four SITE_ENV variants, including a fail-safe on an unrecognised value, and every non-production variant disallows crawling. Second clause ("while the production host does not") is FALSE today by deliberate choice — production runs SITE_ENV=prelaunch and serves `Disallow: /`, verified live 2026-09-19. QA-006 Finding 15. EXIT CONDITION: the deviation ends when SITE_ENV is changed at go-live, at which point the clause becomes true and both this row and REQ-001\'s note must be struck. Written down because the row would otherwise start passing by itself at exactly the moment nobody is re-reading it, and a silently-corrected criterion is indistinguishable from one that was never checked.'],
	'R-4.5 AC1': [M, 'Owner amendment 2026-09-18. In force and satisfied, with the reason recorded: it passes because the site collects nothing at all, not because a cookieless product was chosen.'],
	'R-4.5 AC2': [X, 'STRUCK by owner amendment 2026-09-18 — unimplementable as written (no analytics product, no dashboard). Adding analytics is a scope decision touching the CSP, the Privacy Policy and A4, not a gap-fill.'],

	// R-5 — accessibility and performance
	'R-5.1 AC1': [A, 'accessibility.spec.ts — axe-core scan, zero serious or critical violations, all six routes.'],
	'R-5.1 AC2': [A, 'keyboard-focus.spec.ts — walks the ENTIRE tab order on every route and compares each stop\'s focused computed style against its own unfocused style. Rewritten for QA-006 Finding 4: it previously sampled six stops (the shared header, and nothing else) and accepted any non-`none` box-shadow, which a decorative shadow satisfies without there being a focus indicator at all.'],
	'R-5.1 AC3': [A, 'contrast.spec.ts — per-element computed contrast against the real composited backdrop on all six routes, 4.5:1 body / 3:1 large; plus accessibility.spec.ts, whose axe `color-contrast` rule covers the same ground generically. Corrected here: brand-tokens.spec.ts, which the previous row credited, contains no such assertion (QA-006 Finding 2).'],
	'R-5.1 AC4': [A, 'accessibility.spec.ts — axe `image-alt` is a serious-impact rule and runs on all six routes; ESLint jsx-a11y alt-text gates the source at build time.'],
	'R-5.1 AC5': [A, 'contrast.spec.ts — every text pairing measured against the R-9.5 thresholds, plus the explicit prohibition on #2E83FF/#66B4FF as body-text foreground.'],
	'R-5.1 AC6': [A, 'contrast.spec.ts — the hero text is measured against the ACTUAL RENDERED PIXELS behind it at 320px, 768px and 1920px, by screenshotting the page with that text blanked and reading the worst pixel in each box. Previously credited to a brand-tokens.spec.ts test that did not exist; no test in the suite used a 768px viewport at all.'],
	'R-5.2 AC1': [A, 'RESOLVED 2026-09-19 by owner amendment ("#1 amend AC1"). AC1 now has two clauses, because two hosts legitimately answer differently. Clause (a), the built output at Performance >= 95 and LCP < 2.5s: ASSERTED CONTINUOUSLY by lighthouse.spec.ts, measuring 100 and 912ms. Clause (b), the production hostname at Performance >= 80 and LCP < 2.5s: measured on demand by the committed scripts/production-lighthouse.mjs and recorded dated in status/PERF-002-post-brand-production-audit.md — 83/83/92 and 900-1112ms on 2026-09-19. Clause (b) rests on a dated measurement, not a continuous assertion, and that is stated here rather than left to be inferred from the AUTOMATED label. The 80 floor sits below the worst observed run and detects growth in the cost of Cloudflare\'s JS Detections script (20,576 bytes, 351-695ms TBT), which is the entire difference between the two hosts; the site\'s own JavaScript remains 0 bytes. No assertion was weakened: clause (a) keeps AC1\'s original 95 verbatim, and clause (b) is a floor where there was previously no production measurement at all.'],
	'R-5.2 AC2': [A, 'cross-browser.spec.ts (built output, three engines) + production-security.spec.ts (the production hostname, per R-7.8 AC3). Production measures 20.5KB uncompressed against a 50KB budget.'],
	'R-5.2 AC3': [A, 'lighthouse.spec.ts — reads `cumulative-layout-shift` and asserts < 0.1. Added by QA-006 Finding 1: no CLS assertion existed anywhere in the suite, and three rows credited one. Measured 0.000 on the built output and 0.000 on production.'],
	'R-5.2 AC4': [A, 'lighthouse.spec.ts — the comparison against the pre-brand baseline is now ASSERTED (Performance within 3 points, LCP within 600ms of the baseline range), not printed. QA-006 Finding 3: it was a `console.log` inside a test whose pass/fail bound was explicitly left unchanged, so a Performance-96 / LCP-2400ms regression would have printed itself into a green run. The production-hostname half is R-9.8 AC6.'],
	'R-5.3 AC1': [A, 'cross-browser.spec.ts — Chromium, Firefox and WebKit: layout intact at 320/1920 and zero console errors.'],

	// R-6 — pipeline
	'R-6.1 AC1': [C, 'ci-cd.yml validate job — install, lint (astro check + tsc x2 + ESLint), build, Playwright. QA-003 read the raw log.'],
	'R-6.1 AC2': [C, 'GitHub ruleset 23484592 "main-protection", enforcement=active, with the validate and secret-scan checks required. Verified live 2026-09-18.'],
	'R-6.2 AC1': [C, 'ci-cd.yml deploy-preview job; QA-003 fetched the PR comment and the live preview URL.'],
	'R-6.2 AC2': [M, 'QA-003 — the preview build served that branch and was excluded from indexing.'],
	'R-6.3 AC1': [C, 'ci-cd.yml deploy-production, gated on validate and secret-scan.'],
	'R-6.3 AC2': [C, '`needs: [validate, secret-scan]` — the deploy jobs skip when either fails. QA-003 Finding 2 recorded that the direct evidence for deploy-production specifically was confounded; the configuration is unambiguous.'],
	'R-6.4 AC1': [A, 'production-smoke.spec.ts — six routes return 200 from the live host, the home page primary heading is present, and each page renders its own structure. Runs in the post-deploy job.'],
	'R-6.4 AC2': [C, 'ci-cd.yml "Record rollback recommendation on failure" step.'],
	'R-6.5 AC1': [M, 'ROLLBACK-PROCEDURE.md — drilled twice against production 2026-09-18. Rollback measured at <= ~67s against a 10-minute bound, verified on `canonical_deployment.id` rather than on the page (consecutive deployments are frequently byte-identical). The roll-forward direction\'s "<= 48s" figure is WITHDRAWN: QA-006 Finding 16 showed it is not reconstructible from its own observations — the transition is timestamped 12s before sampling began, and a 3s cadence cannot produce a 48s window. The rollback figure stands; the roll-forward one needs a re-drill with the poll log retained.'],
	'R-6.6 AC1': [M, 'QA-003 — ci-cd.yml authenticates via secrets.CLOUDFLARE_*; no literal token anywhere in the workflow.'],
	'R-6.6 AC2': [M, 'QA-003 — the full raw CI log was grepped for the secret values; none present.'],
	'R-6.7 AC1': [M, 'QA-003 — the build was reproduced from the lockfile on the pinned Node version.'],

	// R-7 — hosting, DNS, security headers
	'R-7.1 AC1': [M, 'External query against 8.8.8.8, 2026-09-18T14:47Z: NS = alex.ns.cloudflare.com, zoe.ns.cloudflare.com. Zone STATUS was not re-read this pass — the credential available to this session has no zone scope — and rests on the earlier Wave 4 record.'],
	'R-7.2 AC1': [A, 'production-smoke.spec.ts — 200 from https://www.haroonie.ai on every route, in the post-deploy job, plus a structural check that the deployed build is the current one.'],
	'R-7.2 AC2': [M, 'Cloudflare Pages domains API, read 2026-09-18T14:48Z: www.haroonie.ai status=active, validation=active, certificate_authority=google. Live HTTPS serving confirmed by the production suite on every deploy.'],
	'R-7.2 AC3': [M, 'DISCHARGED 2026-09-18T14:48Z by inspecting the projects list, which is what AC3 asks for rather than inference: `haroonie-ai-public-site` holds [haroonie-ai-public-site.pages.dev, www.haroonie.ai]; `haroonie-bb8eb` holds [haroonie-bb8eb.pages.dev, www.haroonie.com]. The two are distinct and the .ai domain is on the right one.'],
	'R-7.3 AC1': [A, 'production-smoke.spec.ts — the apex is navigated and the redirect CHAIN asserted at 301, not merely the landing URL. Added by QA-006 Finding 13: this was credited to WAVE4-dns-evidence.md, a file containing no HTTP observation, and no test requested the apex host. Also verified by hand 2026-09-18: https://haroonie.ai/ -> 301 -> https://www.haroonie.ai/.'],
	'R-7.3 AC2': [A, 'production-smoke.spec.ts — /services/ from the apex preserves its path through the 301. Verified by hand the same day.'],
	'R-7.3 AC3': [M, 'External nslookup against 8.8.8.8, 2026-09-18T14:47Z: MX -> haroonie-ai.mail.protection.outlook.com (pref 0); TXT "MS=ms54040815" and "v=spf1 include:spf.protection.outlook.com ~all". Both pre-existing types present with unchanged content, by the external query AC3 requires.'],
	'R-7.3 AC4': [M, 'Satisfied as written and now by the method E12 approved. Verification is DNS-record-level only and no message was sent; the external half, missing until now (QA-006 Finding 12), was performed 2026-09-18T14:47Z.'],
	'R-7.4 AC1': [M, 'Verified live 2026-09-18: http://www.haroonie.ai/ -> 301 -> https://www.haroonie.ai/, and http://haroonie.ai/services/ -> 301 -> https://www.haroonie.ai/services/.'],
	'R-7.4 AC2': [D, 'The AC requires Strict-Transport-Security to be PRESENT. It is deliberately not set, and production-security.spec.ts asserts it stays unset — so the test verifies the opposite of the criterion. Found by this re-verification pass, not by QA-006; the previous matrix marked it AUTOMATED, which read as though the criterion were met. HSTS is a Cloudflare zone setting and one of the three QA-005 recorded as untouched on purpose; enabling it is a commitment that is hard to reverse (browsers cache max-age). Needs an owner decision: enable it, or amend AC2 to record that it is deliberately absent and why.'],
	'R-7.5 AC1': [A, 'production-security.spec.ts — nosniff, a Referrer-Policy and a CSP asserted present on the live response itself.'],
	'R-7.5 AC1a': [A, 'production-security.spec.ts — the nonce differs between two cache-busted requests to the same production URL.'],
	'R-7.5 AC1b': [A, 'production-security.spec.ts (live header) + csp-module.spec.ts (the builder) — `self` plus exactly one nonce token, never unsafe-inline, every other directive verbatim.'],
	'R-7.5 AC1c': [A, 'production-nonce-entropy.manual.spec.ts (the 20-sample uniqueness audit, manual suite — relocated because Bot Fight Mode challenges its request pattern from a runner) + production-security.spec.ts (the >=128-bit floor, CI-gated) + csp-module.spec.ts.'],
	'R-7.5 AC1d': [A, 'production-challenge-platform.manual.spec.ts, plus the CI-gated zero-CSP-violations assertion, which exercises the same path continuously.'],
	'R-7.5 AC1e': [L, 'The owner accepted this limitation on 2026-09-18 and it is recorded against the AC itself. The fallback logic is unit-tested (csp-module.spec.ts: byte-identical to the pre-amendment static CSP, never unsafe-inline, no nonce); whether the real Pages Functions runtime reaches that branch is UNVERIFIED, because forcing it needs a project-level environment variable affecting every in-flight preview. csp-nonce-failsafe.spec.ts skips loudly rather than reporting a pass it did not perform. QA-006 Finding 14 was right that MANUAL was the wrong label — no dated verification exists — and this verdict exists because of it.'],
	'R-7.5 AC1f': [A, 'production-security.spec.ts — exactly one CSP header, read through the async headersArray() raw-header channel rather than the coalescing sync accessor.'],
	'R-7.5 AC2': [A, 'production-security.spec.ts — zero CSP violations across 3 engines x 6 routes against the live host; security-headers.spec.ts covers the same policy shape locally.'],

	// R-7.6 — routing
	'R-7.6 AC1': [A, 'production-smoke.spec.ts — every un-slashed route answers 308 to its canonical trailing-slash form, asserted with redirects disabled so the redirect itself is observable. Added by this re-verification pass: the previous row credited "trailing-slash routing" to two files, neither of which requested an un-slashed URL. Written against the preview server first and moved: `astro preview` answers 404 where Cloudflare Pages answers 308, and R-7.6 is about what the Pages project serves.'],

	// R-7.7 — Wave 4 non-destructiveness
	'R-7.7 AC1': [M, 'WAVE4-AC1-dns-baseline.json — a complete, independently-queried enumeration of all six pre-existing records captured before any write.'],
	'R-7.7 AC1a': [M, 'E13 — a scoped API token (CLOUDFLARE_ZONE_TOKEN) selected by owner decision, not the interactive OAuth path.'],
	'R-7.7 AC2': [M, 'WAVE4-dns-evidence.md — create-only; the first write was the www record, never the apex.'],
	'R-7.7 AC3': [G, 'The post-change enumeration that exists (WAVE4-post-www-dns-snapshot.json) covers only the www stage: six originals plus the www CNAME, and NO apex record. The apex write, the always_use_https change and the redirect ruleset all post-date it, so the completed change set was never enumerated. Neither snapshot carries a timestamp. QA-006 Finding 11. NOT closed by this pass: the credential available to this session has no zone-read scope, so the current full-zone enumeration could not be captured. One read-only call closes it, and the exact request is written out under the "Still open: R-7.7 AC3" heading in status/WAVE4-dns-evidence.md.'],
	'R-7.7 AC4': [M, 'External nslookup against 8.8.8.8, 2026-09-18T14:47Z — all six records resolve identically to the AC1 baseline: the MX, both apex TXT records, and the autodiscover / enterpriseenrollment / enterpriseregistration CNAMEs. This is the external query the AC names, performed rather than inferred.'],
	'R-7.7 AC5': [M, 'DISCHARGED 2026-09-18T14:48Z by the inspection AC5 demands. GET /accounts/{id}/pages/projects returns www.haroonie.ai attached to `haroonie-ai-public-site` and www.haroonie.com attached to `haroonie-bb8eb`. The previous row credited "zero records removed, zero modified", which is AC2\'s evidence and unrelated (QA-006 Finding 11).'],
	'R-7.7 AC6': [X, 'Vacuous, and the antecedent is what matters: AC6 prescribes an incident procedure for the case where a record was altered or removed. AC4\'s external re-query above shows none was, so the procedure was never triggered and there is nothing to verify. Recorded as N/A rather than as a pass, because counting an untriggered procedure as verified is how an inapplicable criterion inflates a compliance number.'],

	// R-7.8 — production-hostname verification
	'R-7.8 AC1': [A, 'production-security.spec.ts — the live www hostname, three engines, six routes, zero CSP violations and zero console errors.'],
	'R-7.8 AC2': [A, 'production-security.spec.ts — the three headers asserted on the live response itself, not inferred from _headers.'],
	'R-7.8 AC3': [A, 'production-security.spec.ts — JavaScript transfer measured against the production hostname specifically. Note the drift this caught late: the figure is now 20.5KB, against ~938 bytes recorded in REQ-001-A2 section 3.3, all of it Cloudflare-injected (PERF-002).'],
	'R-7.8 AC4': [A, 'lighthouse.spec.ts\'s asserted baseline comparison for the continuous half, and status/PERF-002-post-brand-production-audit.md for the production-hostname half this AC names. Both halves were previously credited to the `console.log` (QA-006 Finding 3).'],
	'R-7.8 AC5': [C, 'ci-cd.yml — a failing production suite fails the job and records a rollback recommendation, per R-6.4 AC2\'s pattern.'],
	'R-7.8 AC6': [A, 'playwright.config.ts — the pre-merge projects exclude `production-*.spec.ts` by PATTERN rather than by filename list, after R-6.4\'s suite silently joined the gate when the list named only its sibling. Verified with --list: zero production specs in the pre-merge gate; the build-output suites are retained unchanged.'],

	// R-8 — assurance
	'R-8.1 AC1': [M, 'THIS DOCUMENT, and it is now reproducible: scripts/traceability.mjs extracts every AC from REQ-001, asserts the mapping covers exactly that set, and runs as `npm run trace:check` in CI. QA-006 found the previous generator absent from the repository, which made the "cannot silently drift" claim unverifiable.'],
	'R-8.2 AC1': [M, 'QA-001 through QA-006 — every Tester review classifies each failure as product / automation / flaky / environmental / test-data. QA-006 is the fullest example and classified 15 findings across five categories.'],
	'R-8.3 AC1': [M, 'Recorded each time it applied: the AC1c relocation, the booking-link fixme deletion, and the R-7.5 nonce interrogation — each with the owner instruction quoted verbatim. QA-006 states explicitly that no assertion was weakened in producing it, and none was weakened in remediating it: where a test was too weak for its criterion the test was strengthened, and where a criterion no longer describes the product the row says so.'],

	// R-9.1 — token source
	'R-9.1 AC1': [A, 'brand-tokens.spec.ts — changing the token source\'s brand colour repaints every page.'],
	'R-9.1 AC2': [A, 'brand-tokens.spec.ts — no colour literal outside the token source, across every .astro file.'],
	'R-9.1 AC3': [A, 'brand-tokens.spec.ts — headings and body text resolve their font-family through the token stack.'],

	// R-9.2 — typography
	'R-9.2 AC1': [A, 'brand-tokens.spec.ts — Manrope is the first resolved family for both headings and body text.'],
	'R-9.2 AC2': [A, 'brand-identity.spec.ts — every request on every route is recorded and asserted same-origin, with fonts.googleapis.com and fonts.gstatic.com named explicitly, and every font file asserted same-origin. Previously credited to "font served from /fonts", and the suite contained no match for googleapis or gstatic at all (QA-006 Finding 10).'],
	'R-9.2 AC3': [A, 'security-headers.spec.ts + csp-module.spec.ts — the policy is byte-identical to the pre-amendment value and font-src is self.'],
	'R-9.2 AC4': [D, 'AC4 requires "exactly three weights ship (Regular 400, Bold 700, ExtraBold 800)", reinforced by resolved ambiguity U21. One file ships: manrope-variable.woff2, 24,836 bytes, declared `font-weight: 200 800` — a continuous axis, not three weights. The subsetting half ("subset to the character ranges the site actually uses") has no record anywhere. QA-006 Finding 8. The variable font is very likely the better engineering outcome — 24KB for the whole axis beats three files — which makes this an AC to amend, the way R-2.4 AC1 and R-4.5 AC2 were amended. It is an owner decision and is not made here.'],
	'R-9.2 AC5': [A, 'Both halves. Layout shift: lighthouse.spec.ts asserts CLS < 0.1 (0.000 measured, built output and production). Invisible-text period: brand-identity.spec.ts reads every @font-face from the CSSOM and asserts font-display: swap, which is U22\'s resolved strategy.'],
	'R-9.2 AC6': [A, 'brand-identity.spec.ts — exactly one font file is preloaded, as woff2, with crossorigin. The count is the criterion. Previously credited to R-9.6 AC2\'s licence file (QA-006 Finding 10).'],

	// R-9.3 — the logo in the header
	'R-9.3 AC1': [A, 'brand-identity.spec.ts — on every route the brand link is in the header, has href="/", and its mark actually paints (naturalWidth > 0), not merely exists. smoke.spec.ts, which the previous row credited, has no logo assertion.'],
	'R-9.3 AC2': [A, 'brand-identity.spec.ts — the accessible name resolves to exactly "haroonie.ai" through the role/name query, the wordmark text is asserted, the mark carries alt="", and the link is asserted NOT to have an aria-label, which is AC2\'s "from real text" half.'],
	'R-9.3 AC3': [A, 'brand-identity.spec.ts — at 320px and 1920px: the mark\'s rendered aspect ratio is compared against its intrinsic ratio (distortion), the header and document are asserted not to scroll horizontally (overflow), and every nav link is asserted to be inside the viewport box (pushed out of view). Previously credited to a brand-tokens.spec.ts test that does not exist.'],
	'R-9.3 AC4': [A, 'brand-identity.spec.ts — the header mark\'s src is fetched and asserted to be served as image/svg+xml with SVG markup in the body. Read from the response, not from the file extension: the scaffold shipped a favicon.ico that was a PNG.'],
	'R-9.3 AC5': [A, 'keyboard-focus.spec.ts — the ring\'s width and style, 3:1 against the header surface composited over the page background, AND the second half now MEASURED rather than proxied: the page is screenshotted with the logo focused and the separating band between the mark and the ring is sampled pixel by pixel, requiring 3:1. QA-006 Finding 4.3. The ring is the same blue as the mark, so separation, not colour, is what makes it visible — which is exactly what outline-offset provides and what this now measures.'],
	'R-9.3 AC6': [A, 'smoke.spec.ts — the footer shows the company name as text, not as an image.'],

	// R-9.4 — icons
	'R-9.4 AC1': [A, 'service-icons.spec.ts — every icon is aria-hidden and no icon re-announces the heading beside it.'],
	'R-9.4 AC2': [A, 'service-icons.spec.ts — VACUOUS but checked. AC2 governs icons not accompanied by visible text; every icon here sits beside a heading, so nothing falls under it. The antecedent is what is asserted: no icon renders without visible text beside it. Previously credited to AC1\'s duplicate-announcement test (QA-006 Finding 10). If an unaccompanied icon is ever added, this fails and AC2 has to be satisfied for real.'],
	'R-9.4 AC3': [A, 'service-icons.spec.ts — zero script requests and no icon fetched at runtime; the icons are inlined SVG markup.'],
	'R-9.4 AC4': [A, 'service-icons.spec.ts — stripping every icon\'s geometry moves no heading and removes no text.'],

	// R-9.5 — colour and contrast
	'R-9.5 AC1': [A, 'contrast.spec.ts — both halves. The ratio: every text element on all six routes measured against its real composited backdrop at 4.5:1 (3:1 for large text). The prohibition: #2E83FF and #66B4FF asserted never to be the computed colour of body text, as a value check, because REQ-001 states it as one.'],
	'R-9.5 AC2': [A, 'contrast.spec.ts — every solid-filled control site-wide, label against its OWN fill, at 4.5:1. The disabled Contact submit is exempt under WCAG\'s incidental clause and is listed in the run output rather than silently filtered.'],
	'R-9.5 AC3': [A, 'contrast.spec.ts — the hero text measured against the ACTUAL PIXELS behind it at 320/768/1920, by blanking that text, screenshotting, and taking the worst pixel in each glyph box. The reasoning in index.astro\'s frontmatter is sound and was never the problem; it was not a gate, and a source comment cannot fail.'],
	'R-9.5 AC4': [A, 'brand-tokens.spec.ts — form-field borders and the focus ring, both measured at 3:1 against their adjacent background.'],
	'R-9.5 AC5': [A, 'brand-tokens.spec.ts — the current-page nav indicator is distinguishable by weight and underline, not colour alone, and carries aria-current.'],
	'R-9.5 AC6': [A, 'accessibility.spec.ts — the axe suite AC6 names by filename, zero serious or critical, color-contrast included. Previously credited to "palette values written exactly once", which is R-9.1 AC2 (QA-006 Finding 10).'],

	// R-9.6 — provenance
	'R-9.6 AC1': [M, 'public/brand/PROVENANCE.md, completed 2026-09-18 by this pass. The register now carries all four fields AC1 names — origin, creator, licence, commercial-use confirmation — per asset, and covers the two sets QA-006 Finding 17 found missing: src/icons/*.svg (AC1 names "icons") and public/favicon.svg, which is no longer a third-party file.'],
	'R-9.6 AC2': [M, 'public/fonts/manrope-OFL.txt ships beside the font, and the terms are confirmed in the register: SIL OFL 1.1 permits commercial use and self-hosted web distribution, which is AC2\'s second half.'],
	'R-9.6 AC3': [M, 'E20, raised and closed 2026-09-18. The owner confirmed the originals were AI-generated, which resolved the inbound question; trademark clearance was closed separately as an owner-accepted risk with what was and was not examined recorded. Nothing of unestablished provenance ships. Previously credited to AC2\'s licence file.'],

	// R-9.7 — icons and the share image
	'R-9.7 AC1': [A, 'icons.spec.ts — /favicon.svg is fetched and asserted to be served 200 as image/svg+xml, NOT to contain the Astro starter path data, and to be drawn in the brand palette. The head is asserted to declare that same file, so the criterion is about an icon browsers actually fetch. This was a real PRODUCT_DEFECT (QA-006 Finding 6): the URL served Astro\'s triangle in production while the matrix marked the row AUTOMATED against a test of the head.'],
	'R-9.7 AC2': [A, 'icons.spec.ts — every icon declared in the head is fetched: 200, content type matching the declared type, the apple-touch-icon asserted 180x180 from its own PNG header, the .ico asserted to carry 16/32/48 from its ICO directory, and every declared PNG size asserted against the file. The "each URL returns 200 with the declared content type" half had nothing behind it before.'],
	'R-9.7 AC3': [A, 'icons.spec.ts — og:image and twitter:image asserted identical, same-origin against the page\'s own canonical origin, and the file decoded from its bytes: JPEG, exactly 1200x630. seo.spec.ts, which the previous row credited, asserts only that the tag is non-empty (QA-006 Finding 10).'],
	'R-9.7 AC4': [M, 'Dated visual check, 2026-09-18, by this pass: public/og-image.jpg rendered at 240x126 and 400x210. At 240px the logo mark, the "haroonie.ai" wordmark, the headline "From Ideas to Real-World Impact." and the three service labels are all legible; the two decorative corner straplines ("A BRIGHTER TOMORROW TOGETHER", "CHICAGO SOLVES TOGETHER") are not. At 400px everything is legible. AC4 names "the logo and any text on it"; the judgement recorded is PASS on the logo and every load-bearing line, with the two corner micro-straplines noted as sub-legible at the smallest size and decorative. Previously credited to the .ico\'s magic bytes (QA-006 Finding 10).'],
	'R-9.7 AC5': [M, 'Dated visual check, 2026-09-18, by this pass: /favicon.svg rasterised at 16x16 reads clearly as the stylised H — both stems and the connecting ribbon survive; the pixel-dissolve cluster does not, which AC5 explicitly permits. Backed continuously by icons.spec.ts, which rasterises the file to a 16x16 canvas in a real browser and asserts ink coverage between 8% and 92%. That cannot judge recognisability, and does not claim to; it puts a floor under it, because the two ways a favicon actually fails at 16px — rendering as nothing, or as a solid block — are both mechanical.'],
	'R-9.7 AC6': [A, 'icons.spec.ts — the og:image is fetched and its transferred size asserted under 300KB, with the figure printed on every run. Measured 224,107 bytes (218.9KB), which matches QA-006\'s independent measurement exactly.'],

	// R-9.8 — brand imagery in the performance budget
	'R-9.8 AC1': [X, 'STRUCK — governs "the home page\'s hero image", and there is no hero image. The hero is a CSS gradient section containing text; the only <img> on the site is the header logo. PROVENANCE.md records why: the photographic hero was replaced by the owner with an illustration before anything shipped. QA-006 Finding 9 found all five of these credited to unrelated performance evidence — this one to "lighthouse.spec.ts Performance >= 95". Counting five inapplicable criteria as verified is what turns an honest scope change into an inflated number.'],
	'R-9.8 AC2': [X, 'STRUCK with AC1 — no hero image exists, so there is no intrinsic width/height to reserve. Previously credited to "lighthouse.spec.ts — LCP within budget".'],
	'R-9.8 AC3': [X, 'STRUCK with AC1 — no hero image, no fetchpriority, no loading= attribute anywhere on the site. Previously credited to "lighthouse.spec.ts — CLS under 0.1", an assertion that did not then exist.'],
	'R-9.8 AC4': [X, 'STRUCK with AC1 — there is no hero variant whose transferred bytes could be measured. Previously credited to cross-browser.spec.ts\'s JavaScript budget.'],
	'R-9.8 AC5': [X, 'STRUCK with AC1 — no hero image, so no alt text to judge. Previously credited to "stylesheet inlined, no render-blocking external CSS".'],
	'R-9.8 AC6': [A, 'Two halves, both real now. Continuous: lighthouse.spec.ts asserts the built output against the baseline within a stated tolerance. Production hostname, which is what AC6 names: status/PERF-002-post-brand-production-audit.md, measured 2026-09-18 over three runs and reporting the regression explicitly — which is what AC6 asks for and is why it is satisfied even though R-5.2 AC1 is not. The previous "roughly 290ms BETTER" claim is WITHDRAWN: it compared a local post-brand figure against the loosest end of a production pre-brand range.'],
	'R-9.8 AC7': [A, 'cross-browser.spec.ts + production-security.spec.ts — the site\'s own JavaScript is 0 bytes. The 20.5KB measured on production is Cloudflare\'s edge script, injected after the build, and PERF-002 separates the two explicitly.'],

	// R-9.9 — theme policy
	'R-9.9 AC1': [A, 'brand-tokens.spec.ts — identical rendering under light, dark and no-preference, read in a single navigation with three emulateMedia passes.'],
	'R-9.9 AC2': [A, 'brand-tokens.spec.ts — the document root declares color-scheme: light only.'],
	'R-9.9 AC3': [A, 'brand-identity.spec.ts — VACUOUS but checked. The on-dark variant is used only on dark surfaces because it is used nowhere: haroonie-logo-horizontal-dark.svg is referenced nowhere in src/, and that is what is asserted. The previous row\'s rationale — "used on OG card, app icons" — was factually wrong (QA-006 Finding 10). If it is ever rendered into a page, this fails and the row has to be re-decided against the surface it was placed on.'],
	'R-9.9 AC4': [A, 'icons.spec.ts — /favicon.svg is asserted to carry an internal prefers-color-scheme rule, which is the behaviour AC4 says must not be lost. It HAD been lost (QA-006 Finding 7): the file the head declared carried no such rule, and the only file that still had one was the Astro starter being replaced. /favicon.svg now holds the mark\'s own geometry with its three stops tokenised, and the dark block shifts the palette one step (Royal->Bright, Bright->Light) rather than recolouring the mark: measured against typical dark chrome #202124, #155BEF reaches only 2.89:1 where #66B4FF reaches 7.31:1.'],
};

// ---------------------------------------------------------------------------

const REQ_PATH = 'requirements/REQ-001-mvp-public-website.md';
const OUT_PATH = 'status/R8-TRACEABILITY-MATRIX.md';

/**
 * Pull every acceptance criterion out of REQ-001, in document order.
 *
 * Requirement headings appear in two shapes (`**R-1.1** ...` and
 * `#### R-9.1 — ...`), and AC bullets in two more (`- AC1 —` and
 * `- **AC1** —`), because the document grew through amendments. Both of each
 * are matched. Identifiers are de-duplicated: an amendment that annotates an
 * existing AC re-uses its identifier in a second bullet, and that is one
 * criterion, not two.
 */
function extractCriteria(markdown) {
	const requirementHeading = /^(?:#### |\*\*)(R-\d+\.\d+)\b/;
	const criterionBullet = /^- \*{0,2}(AC\d+[a-z]?)\*{0,2}\b/;

	const seen = new Set();
	const criteria = [];
	let requirement = null;

	for (const line of markdown.split('\n')) {
		const heading = requirementHeading.exec(line);
		if (heading) {
			requirement = heading[1];
			continue;
		}
		const bullet = criterionBullet.exec(line);
		if (bullet && requirement) {
			const key = `${requirement} ${bullet[1]}`;
			if (seen.has(key)) continue;
			seen.add(key);
			criteria.push({ requirement, ac: bullet[1], key });
		}
	}
	return criteria;
}

function render(criteria) {
	const counts = Object.fromEntries(ORDER.map((v) => [v, 0]));
	for (const { key } of criteria) counts[MAP[key][0]] += 1;

	const requirements = new Set(criteria.map((c) => c.requirement));
	const verified = counts[A] + counts[M] + counts[C];
	const total = criteria.length;

	const out = [];
	const w = (line = '') => out.push(line);

	w('# R-8.1 — Traceability matrix');
	w();
	w(`**Every acceptance criterion in REQ-001, mapped to what verifies it.** R-8.1 AC1 requires each AC identifier to map to a named test or a recorded manual result.`);
	w();
	w(`Generated by \`scripts/traceability.mjs\` from \`${REQ_PATH}\`. Do not edit this file by hand — \`npm run trace:check\` fails the build if it differs from what the script produces.`);
	w();
	w('## What this document is, after QA-006');
	w();
	w("This matrix was rebuilt on 2026-09-18 following QA-006's independent audit, which found its predecessor **not fit for acceptance as presented**. The product was in good shape; the certification of it was not. The root cause the Tester identified is worth restating, because it shaped every row below: *\"the matrix was assembled by reading what a test was for rather than what it asserts, and the AC text was not re-read at the point of mapping.\"*");
	w();
	w('So every row was re-derived: read the AC in REQ-001, then open the named test and read what it **asserts**. Where a criterion had no assertion, one was written or the row was re-marked. Where a criterion no longer describes the product, the row says so instead of finding evidence that fits.');
	w();
	w('Three verdicts are new, and they exist because the old five could not express the truth without distorting it:');
	w();
	w(`- **${L}** — the owner accepted that something cannot be verified. That is a legitimate position; calling it MANUAL, as the previous matrix did, put an unverified criterion inside the "verified" count.`);
	w(`- **${D}** — the criterion was checked and the product deliberately does something else. Neither a pass nor a gap: it is an owner call, and hiding it under either verdict loses that. A ruling does not remove the row — it records what was decided and, where the departure is temporary, the condition that ends it.`);
	w(`- **${X}** — struck, or governing something that does not exist. Counting inapplicable criteria as verified is what turns an honest scope change into an inflated compliance number.`);
	w();
	w('**What this matrix still does not do:** it records where verification lives, not how good it is. A row marked AUTOMATED means a named test asserts the criterion. Where a check is weaker than its criterion implies, the row says so.');
	w();
	w('## Summary');
	w();
	w('| Verdict | Count | Meaning |');
	w('|---|---|---|');
	for (const verdict of ORDER) {
		w(`| **${verdict}** | ${counts[verdict]} | ${MEANING[verdict]} |`);
	}
	w();
	w(`**${total} criteria across ${requirements.size} requirements.** ${verified} carry verification that exists and was re-read this pass. The remaining ${total - verified} are enumerated below by name — ${counts[B]} blocked, ${counts[L]} accepted limitation, ${counts[D]} deviations needing an owner decision, ${counts[X]} struck or inapplicable, ${counts[G]} gap.`);
	w();
	w("The honest headline is not \"0 gaps\". It is closer to the Tester's: *the product meets substantially all of these criteria; a small number need an owner decision rather than engineering; one is genuinely unevidenced.* That is a good position, and it is a better sentence than the previous one because it is true.");
	w();

	const section = (verdict, title, preamble) => {
		const rows = criteria.filter((c) => MAP[c.key][0] === verdict);
		if (rows.length === 0) return;
		w(`## ${title}`);
		w();
		if (preamble) {
			w(preamble);
			w();
		}
		for (const { key } of rows) {
			w(`### ${key}`);
			w();
			w(MAP[key][1]);
			w();
		}
	};

	section(
		G,
		'The gaps',
		'Not verified, and not covered by any other verdict. Enumerated rather than absorbed — finding them is what this exercise is for.',
	);
	section(
		D,
		'Deviations — verified, and not conforming',
		'Each of these was checked and the product deliberately does something other than what the AC says. They are listed separately from gaps because nothing is unknown about them. Each row states whether the owner has ruled: a ruled deviation names the decision and, where it is temporary, the condition that ends it; an unruled one is still waiting.',
	);
	section(
		L,
		'Accepted limitations',
		'Cannot be verified, and the owner accepted that rather than have it reported as a pass.',
	);
	section(
		B,
		'Blocked, not gaps',
		'A blocked criterion has a named, owner-acknowledged reason it cannot be verified yet. A gap does not.',
	);
	section(
		X,
		'Struck or inapplicable',
		'Not counted as verified anywhere in this document.',
	);

	w('## Full matrix');
	w();
	w('| Requirement | AC | Verdict | Verified by |');
	w('|---|---|---|---|');
	for (const { requirement, ac, key } of criteria) {
		const [verdict, evidence] = MAP[key];
		w(`| ${requirement} | ${ac} | ${verdict} | ${evidence.replaceAll('|', '/')} |`);
	}
	w();
	return out.join('\n');
}

const criteria = extractCriteria(readFileSync(REQ_PATH, 'utf8'));

// The drift guard, and the whole reason this file is in the repository. Both
// directions matter: an AC added to REQ-001 without a verdict is an
// un-assessed criterion, and a verdict for an AC that no longer exists is a
// row certifying nothing.
const extracted = new Set(criteria.map((c) => c.key));
const mapped = new Set(Object.keys(MAP));
const missing = [...extracted].filter((k) => !mapped.has(k));
const extra = [...mapped].filter((k) => !extracted.has(k));

if (missing.length > 0 || extra.length > 0) {
	console.error('Traceability mapping does not match REQ-001.');
	if (missing.length > 0) console.error(`  In REQ-001 but unmapped: ${missing.join(', ')}`);
	if (extra.length > 0) console.error(`  Mapped but not in REQ-001: ${extra.join(', ')}`);
	process.exit(1);
}

for (const { key } of criteria) {
	const verdict = MAP[key][0];
	if (!ORDER.includes(verdict)) {
		console.error(`${key} has an unknown verdict: ${verdict}`);
		process.exit(1);
	}
}

const rendered = render(criteria);

if (process.argv.includes('--check')) {
	// Line endings are normalised on both sides before comparing. The file is
	// written with LF and is LF in the repository, but git's autocrlf gives a
	// Windows checkout a CRLF working tree - so a byte comparison reported the
	// matrix as out of date on every Windows machine while passing in CI. A
	// gate that cries wolf locally is a gate people learn to bypass.
	const normalise = (text) => text.split('\r\n').join('\n');
	const onDisk = readFileSync(OUT_PATH, 'utf8');
	if (normalise(onDisk) !== normalise(rendered)) {
		console.error(
			`${OUT_PATH} is out of date. Run \`npm run trace\` and commit the result — ` +
				'do not edit the matrix by hand.',
		);
		process.exit(1);
	}
	console.log(`${OUT_PATH} is up to date (${criteria.length} criteria).`);
} else {
	writeFileSync(OUT_PATH, rendered, 'utf8');
	const counts = Object.fromEntries(ORDER.map((v) => [v, 0]));
	for (const { key } of criteria) counts[MAP[key][0]] += 1;
	console.log(
		`${OUT_PATH} written: ${criteria.length} criteria | ` +
			ORDER.map((v) => `${v} ${counts[v]}`).join('  '),
	);
}
