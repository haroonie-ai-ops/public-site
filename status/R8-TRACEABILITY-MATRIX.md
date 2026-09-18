# R-8.1 — Traceability matrix

**Every acceptance criterion in REQ-001, mapped to what verifies it.** R-8.1 AC1 requires each AC identifier to map to a named test or a recorded manual result.

Generated 2026-09-18 against `REQ-001 as of main`.

## Method, and its limits

Built in three passes. First, every AC was extracted mechanically from REQ-001 — **135 criteria across 48 requirements** — so none could be omitted by oversight. Second, the repository was scanned for citations of each AC identifier. Third, and most importantly, every result was reviewed by hand, because citation-matching is not evidence: a test that quotes an AC may not assert it, and a test that never names one may cover it completely. The first pass found 58 ACs with no citation anywhere; most turned out to be covered by tests that simply do not quote identifiers.

The generator asserts that the mapping covers exactly the extracted set, so this document cannot silently drift from the requirement it describes.

**What this matrix does not do:** it records where verification lives, not how good it is. A row marked AUTOMATED means a named test asserts the criterion — not that the assertion is strong. Where a check is weaker than its criterion implies, that is stated in the row.

## Summary

| Verdict | Count | Meaning |
|---|---|---|
| **AUTOMATED** | 78 | A named test asserts it |
| **MANUAL** | 38 | A dated, recorded verification exists |
| **CI** | 7 | Enforced by pipeline configuration |
| **BLOCKED** | 3 | Cannot be verified yet, by an acknowledged dependency |
| **GAP** | 9 | **Not verified, and not previously recorded as blocked** |

**R-8.1 AC1 is satisfied for 126 of 135 criteria.** The 9 gaps are enumerated below rather than absorbed — finding them is what the exercise is for.

## The gaps

### R-1.4 AC1

AC text says "Verified by: secret scan in CI". NO secret-scanning tool (gitleaks/trufflehog/equivalent) is wired into ci-cd.yml. GitHub push protection is repo-level and was used ONCE, pre-publication ("all 91 commits secret-scanned clean", E8). No per-commit gate exists.

### R-4.5 AC1

VACUOUSLY TRUE. No cookie is written and no consent banner appears because the site has NO analytics at all — verified: zero tracking scripts, CSP is 'self' throughout. Passing for a reason the AC did not contemplate.

### R-4.5 AC2

UNIMPLEMENTABLE AS WRITTEN. Requires a page view "recorded in the analytics dashboard". No analytics product is installed and no dashboard exists. This has never been recorded as an escalation or a scope cut.

### R-5.1 AC2

PARTIAL. responsive/accessibility specs assert a skip link is the first focusable element, but nothing walks the full tab order or asserts a visible focus indicator on every interactive element. axe does not test keyboard operability. A focus ring exists in BaseLayout and is unasserted.

### R-5.2 AC4

Post-brand Lighthouse comparison against the pre-brand baseline was required by R-9.8 AC6 and never run as a stated comparison. Same gap as R-7.8 AC4.

### R-7.5 AC1e

csp-nonce-failsafe.spec.ts SELF-SKIPS. The fallback branch is unit-tested in csp-module.spec.ts, but whether the real Functions runtime reaches it has never been verified on a deployment. Forcing it needs a project-level env var that would put every in-flight preview into the fail-safe path.

### R-7.8 AC4

The post-Function Lighthouse re-run, compared against the pre-Function baseline, was deferred to "Group C" and never executed as a stated comparison. Lighthouse still scores 100, but no comparison was recorded, which is what the AC asks for.

### R-9.3 AC5

The logo link inherits the single focus ring defined in BaseLayout, but NOTHING asserts a visible focus indicator on it, nor the 3:1 contrast this AC requires against BOTH the header background AND the adjacent pixels of the logo itself. Same underlying gap as R-5.1 AC2 — keyboard focus is unasserted across the site.

### R-9.8 AC6

Same gap as R-7.8 AC4 / R-5.2 AC4: the post-brand comparison against the pre-brand baseline was never recorded as a stated comparison.

## Blocked, not gaps

Distinguished deliberately: a blocked criterion has a named, owner-acknowledged reason it cannot be verified yet. A gap does not.

- **R-3.1 AC1** — E4 — no transactional email credential. Form is markup only; contact.spec.ts asserts it is NOT wired (no action, submit disabled).
- **R-3.1 AC2** — E4 — inline validation is part of the unwired form
- **R-3.1 AC3** — E4 — spam protection is part of the unwired form

## Full matrix

| Requirement | AC | Verdict | Verified by |
|---|---|---|---|
| R-1.1 | AC1 | MANUAL | QA-001 Wave 1 Tester review — scaffold builds and serves |
| R-1.2 | AC1 | MANUAL | QA-001 — toolchain pinned via .nvmrc |
| R-1.2 | AC2 | MANUAL | QA-001 — lockfile committed, npm ci reproducible |
| R-1.3 | AC1 | MANUAL | QA-001 — Playwright harness runs |
| R-1.4 | AC1 | GAP | AC text says "Verified by: secret scan in CI". NO secret-scanning tool (gitleaks/trufflehog/equivalent) is wired into ci-cd.yml. GitHub push protection is repo-level and was used ONCE, pre-publication ("all 91 commits secret-scanned clean", E8). No per-commit gate exists. |
| R-2.1 | AC1 | AUTOMATED | home.spec.ts — single primary CTA present and links to /contact/ |
| R-2.1 | AC2 | AUTOMATED | home.spec.ts — a single primary CTA is present and links to /contact/ |
| R-2.1 | AC3 | AUTOMATED | home.spec.ts — a visible summary links through to /services/ |
| R-2.2 | AC1 | AUTOMATED | services.spec.ts — renders a list of distinct service entries |
| R-2.2 | AC2 | AUTOMATED | services.spec.ts — entries come from the content collection |
| R-2.3 | AC1 | AUTOMATED | about.spec.ts — owner-approved biography present, no placeholder markers |
| R-2.4 | AC1 | AUTOMATED | contact.spec.ts — mailto visible/actionable; telephone visible/actionable. Booking clause STRUCK by owner decision 2026-09-18. |
| R-2.4 | AC2 | AUTOMATED | contact.spec.ts — name/email/message each have an associated label |
| R-2.4 | AC3 | MANUAL | WAVE4-dns-evidence.md — mail records byte-identical before/after Wave 4 |
| R-2.5 | AC1 | AUTOMATED | legal.spec.ts — all four required privacy sections present, non-empty |
| R-2.5 | AC2 | AUTOMATED | legal.spec.ts / BaseLayout footer links |
| R-2.6 | AC1 | AUTOMATED | smoke.spec.ts — unknown path returns 404 and links home |
| R-2.7 | AC1 | AUTOMATED | smoke.spec.ts / brand-tokens.spec.ts — nav present, current page indicated and not colour-only |
| R-2.7 | AC2 | AUTOMATED | smoke.spec.ts — footer shows company name, year, legal links |
| R-2.8 | AC1 | AUTOMATED | seo-preview.spec.ts — editing only a Markdown file changes the rendered page |
| R-3.1 | AC1 | BLOCKED | E4 — no transactional email credential. Form is markup only; contact.spec.ts asserts it is NOT wired (no action, submit disabled). |
| R-3.1 | AC2 | BLOCKED | E4 — inline validation is part of the unwired form |
| R-3.1 | AC3 | BLOCKED | E4 — spam protection is part of the unwired form |
| R-4.1 | AC1 | AUTOMATED | seo.spec.ts — title and description unique across every page |
| R-4.1 | AC2 | AUTOMATED | seo.spec.ts — canonical present |
| R-4.1 | AC3 | AUTOMATED | seo.spec.ts — OG/Twitter image tags present; R-9.7 AC3 constrains the value |
| R-4.2 | AC1 | AUTOMATED | seo-preview.spec.ts — sitemap index served, points at a sitemap |
| R-4.2 | AC2 | AUTOMATED | seo-preview.spec.ts — sitemap lists every public page, excludes the 404 |
| R-4.3 | AC1 | AUTOMATED | seo.spec.ts — valid Organization/ProfessionalService JSON-LD |
| R-4.4 | AC1 | AUTOMATED | seo-preview.spec.ts — four SITE_ENV builds, including fail-safe on an unrecognised value |
| R-4.5 | AC1 | GAP | VACUOUSLY TRUE. No cookie is written and no consent banner appears because the site has NO analytics at all — verified: zero tracking scripts, CSP is 'self' throughout. Passing for a reason the AC did not contemplate. |
| R-4.5 | AC2 | GAP | UNIMPLEMENTABLE AS WRITTEN. Requires a page view "recorded in the analytics dashboard". No analytics product is installed and no dashboard exists. This has never been recorded as an escalation or a scope cut. |
| R-5.1 | AC1 | AUTOMATED | accessibility.spec.ts — axe scan, zero serious/critical, all six routes |
| R-5.1 | AC2 | GAP | PARTIAL. responsive/accessibility specs assert a skip link is the first focusable element, but nothing walks the full tab order or asserts a visible focus indicator on every interactive element. axe does not test keyboard operability. A focus ring exists in BaseLayout and is unasserted. |
| R-5.1 | AC3 | AUTOMATED | brand-tokens.spec.ts — computed contrast against the R-9.5 table |
| R-5.1 | AC4 | AUTOMATED | ESLint astro/jsx-a11y alt-text (build gate) + axe image-alt rule |
| R-5.1 | AC5 | AUTOMATED | brand-tokens.spec.ts — every pairing checked against R-9.5 |
| R-5.1 | AC6 | AUTOMATED | brand-tokens.spec.ts — contrast at 320/768/1920 widths |
| R-5.2 | AC1 | AUTOMATED | lighthouse.spec.ts — Performance >= 95, LCP < 2.5s, simulated mobile |
| R-5.2 | AC2 | AUTOMATED | cross-browser.spec.ts + production-security.spec.ts — JS transfer budget |
| R-5.2 | AC3 | AUTOMATED | lighthouse.spec.ts — CLS under 0.1 |
| R-5.2 | AC4 | GAP | Post-brand Lighthouse comparison against the pre-brand baseline was required by R-9.8 AC6 and never run as a stated comparison. Same gap as R-7.8 AC4. |
| R-5.3 | AC1 | AUTOMATED | cross-browser.spec.ts — chromium/firefox/webkit, layout and console errors |
| R-6.1 | AC1 | CI | ci-cd.yml validate job — install, lint (astro check + tsc + ESLint), build, Playwright. QA-003 read the raw log. |
| R-6.1 | AC2 | CI | GitHub ruleset 23484592 "main-protection", enforcement=active, required status check. Verified live 2026-09-18. |
| R-6.2 | AC1 | CI | ci-cd.yml deploy-preview job; QA-003 fetched the PR comment and the live URL |
| R-6.2 | AC2 | MANUAL | QA-003 — preview build served, excluded from indexing |
| R-6.3 | AC1 | CI | ci-cd.yml deploy-production, gated on validate |
| R-6.3 | AC2 | CI | needs: validate — deploy jobs skip on failure. QA-003 Finding 2 recorded that the evidence for deploy-production specifically was confounded. |
| R-6.4 | AC1 | AUTOMATED | production-smoke.spec.ts — six routes 200 from the live host, home heading present, structure rendered. Live in the post-deploy job. |
| R-6.4 | AC2 | CI | ci-cd.yml "Record rollback recommendation on failure" step |
| R-6.5 | AC1 | MANUAL | ROLLBACK-PROCEDURE.md — drilled twice on production 2026-09-18. Rollback <= ~67s, roll-forward observed 11:51:14 UTC within <= 48s, both directions canonical_deployment MATCH, against a 10-minute bound. |
| R-6.6 | AC1 | MANUAL | QA-003 — ci-cd.yml reads secrets.CLOUDFLARE_*; no literal token |
| R-6.6 | AC2 | MANUAL | QA-003 — grepped the full raw CI log for secret values, none present |
| R-6.7 | AC1 | MANUAL | QA-003 — reproduced the build from the lockfile on the pinned Node |
| R-7.1 | AC1 | MANUAL | STATUS.md — Pages project serves production; confirmed live repeatedly |
| R-7.2 | AC1 | MANUAL | WAVE4 DNS evidence + live 200s on www.haroonie.ai |
| R-7.2 | AC2 | MANUAL | Live TLS verified — HTTPS serving on the custom domain |
| R-7.2 | AC3 | MANUAL | WAVE4-dns-evidence.md — www CNAME points at haroonie-ai-public-site |
| R-7.3 | AC1 | MANUAL | WAVE4-dns-evidence.md — apex records untouched |
| R-7.3 | AC2 | MANUAL | WAVE4-dns-evidence.md |
| R-7.3 | AC3 | MANUAL | WAVE4-dns-evidence.md |
| R-7.3 | AC4 | MANUAL | WAVE4-dns-evidence.md — mail records byte-identical, per E12 (no send test) |
| R-7.4 | AC1 | MANUAL | Live — HTTPS serves on www.haroonie.ai |
| R-7.4 | AC2 | AUTOMATED | production-security.spec.ts — asserts HSTS stays deliberately UNSET |
| R-7.5 | AC1 | AUTOMATED | production-security.spec.ts — nosniff, Referrer-Policy, CSP on the live host |
| R-7.5 | AC1a | AUTOMATED | production-security.spec.ts — nonce differs between two requests |
| R-7.5 | AC1b | AUTOMATED | production-security.spec.ts + csp-module.spec.ts — self + one nonce, never unsafe-inline, other directives verbatim |
| R-7.5 | AC1c | AUTOMATED | production-nonce-entropy.manual.spec.ts (20-sample audit, manual suite) + production-security.spec.ts (>=128-bit floor, CI-gated) + csp-module.spec.ts |
| R-7.5 | AC1d | AUTOMATED | production-challenge-platform.manual.spec.ts (manual) + the CI-gated zero-CSP-violations assertion, which exercises the path continuously |
| R-7.5 | AC1e | GAP | csp-nonce-failsafe.spec.ts SELF-SKIPS. The fallback branch is unit-tested in csp-module.spec.ts, but whether the real Functions runtime reaches it has never been verified on a deployment. Forcing it needs a project-level env var that would put every in-flight preview into the fail-safe path. |
| R-7.5 | AC1f | AUTOMATED | production-security.spec.ts — exactly one CSP header, via async headersArray() |
| R-7.5 | AC2 | AUTOMATED | production-security.spec.ts — zero CSP violations, 3 engines x 6 routes, live |
| R-7.6 | AC1 | AUTOMATED | production-smoke.spec.ts + seo-preview.spec.ts — trailing-slash routing |
| R-7.7 | AC1 | MANUAL | WAVE4-dns-evidence.md — independent re-query and id-keyed diff before any write |
| R-7.7 | AC1a | MANUAL | STATUS.md E13 — CLOUDFLARE_ZONE_TOKEN selected by owner decision |
| R-7.7 | AC2 | MANUAL | WAVE4-dns-evidence.md — create-only; first write was www, never the apex |
| R-7.7 | AC3 | MANUAL | WAVE4-dns-evidence.md — proxied=true on the www record |
| R-7.7 | AC4 | MANUAL | WAVE4-dns-evidence.md — six mail records byte-identical under original ids |
| R-7.7 | AC5 | MANUAL | WAVE4-dns-evidence.md — zero records removed, zero modified |
| R-7.7 | AC6 | MANUAL | WAVE4-dns-evidence.md — no apex record changed |
| R-7.8 | AC1 | AUTOMATED | production-security.spec.ts — zero CSP violations and console errors, live host |
| R-7.8 | AC2 | AUTOMATED | production-security.spec.ts — headers asserted on the live response |
| R-7.8 | AC3 | AUTOMATED | production-security.spec.ts — JS transfer recorded against the production host |
| R-7.8 | AC4 | GAP | The post-Function Lighthouse re-run, compared against the pre-Function baseline, was deferred to "Group C" and never executed as a stated comparison. Lighthouse still scores 100, but no comparison was recorded, which is what the AC asks for. |
| R-7.8 | AC5 | CI | ci-cd.yml — failure surfaces as a CI failure and records a rollback recommendation |
| R-7.8 | AC6 | AUTOMATED | playwright.config.ts testIgnore pattern + --list verification: 0 production specs in the pre-merge gate; build-output suites retained unchanged |
| R-8.1 | AC1 | MANUAL | THIS DOCUMENT |
| R-8.2 | AC1 | MANUAL | QA-001..QA-005 — every Tester review classifies failures (product / automation / flaky / environmental / test-data). QA-005 Finding 3 is the clearest case. |
| R-8.3 | AC1 | MANUAL | Recorded each time it applied: the AC1c relocation, the booking-link fixme deletion, and the R-7.5 nonce interrogation — each with the owner instruction quoted verbatim. |
| R-9.1 | AC1 | AUTOMATED | brand-tokens.spec.ts — changing one token moves every page |
| R-9.1 | AC2 | AUTOMATED | brand-tokens.spec.ts — no colour literal outside the token source |
| R-9.1 | AC3 | AUTOMATED | brand-tokens.spec.ts — no font-family except a token reference |
| R-9.2 | AC1 | AUTOMATED | brand-tokens.spec.ts — Manrope applied via the token |
| R-9.2 | AC2 | AUTOMATED | Build output — font served from /fonts, same-origin |
| R-9.2 | AC3 | AUTOMATED | security-headers.spec.ts + csp-module.spec.ts — CSP unchanged, font-src self |
| R-9.2 | AC4 | MANUAL | STATUS.md — single variable woff2, 24KB, weights 200-800 |
| R-9.2 | AC5 | AUTOMATED | lighthouse.spec.ts CLS budget — font-display swap, no layout shift |
| R-9.2 | AC6 | MANUAL | public/fonts/manrope-OFL.txt ships alongside the font (SIL OFL 1.1) |
| R-9.3 | AC1 | AUTOMATED | smoke.spec.ts — header home link present on every page |
| R-9.3 | AC2 | AUTOMATED | smoke.spec.ts — accessible name "haroonie.ai" from real text, not aria-label |
| R-9.3 | AC3 | AUTOMATED | brand-tokens.spec.ts — mark carries explicit dimensions (CLS) |
| R-9.3 | AC4 | AUTOMATED | BaseLayout renders /brand/haroonie-logo-mark.svg — vector at every size; production-smoke/build output confirm it serves as image/svg+xml |
| R-9.3 | AC5 | GAP | The logo link inherits the single focus ring defined in BaseLayout, but NOTHING asserts a visible focus indicator on it, nor the 3:1 contrast this AC requires against BOTH the header background AND the adjacent pixels of the logo itself. Same underlying gap as R-5.1 AC2 — keyboard focus is unasserted across the site. |
| R-9.3 | AC6 | AUTOMATED | smoke.spec.ts — footer shows the company name as text, not an image |
| R-9.4 | AC1 | AUTOMATED | service-icons.spec.ts — every icon aria-hidden |
| R-9.4 | AC2 | AUTOMATED | service-icons.spec.ts — no duplicate announcement; titles stripped |
| R-9.4 | AC3 | AUTOMATED | service-icons.spec.ts — no script requests, no icon fetches |
| R-9.4 | AC4 | AUTOMATED | service-icons.spec.ts — removing icon geometry moves no heading |
| R-9.5 | AC1 | AUTOMATED | brand-tokens.spec.ts — computed contrast for every pairing |
| R-9.5 | AC2 | AUTOMATED | brand-tokens.spec.ts — bright/light blue carry no text |
| R-9.5 | AC3 | AUTOMATED | brand-tokens.spec.ts — contrast at three viewport widths |
| R-9.5 | AC4 | AUTOMATED | brand-tokens.spec.ts — every form field border distinguishable (3:1) |
| R-9.5 | AC5 | AUTOMATED | brand-tokens.spec.ts — nav indicator legible and not colour-only |
| R-9.5 | AC6 | AUTOMATED | brand-tokens.spec.ts — palette values written exactly once |
| R-9.6 | AC1 | MANUAL | public/brand/PROVENANCE.md — origin recorded (AI-generated, owner-confirmed) |
| R-9.6 | AC2 | MANUAL | PROVENANCE.md — licensing position recorded, including what is NOT protected |
| R-9.6 | AC3 | MANUAL | public/fonts/manrope-OFL.txt — typeface licence ships with the asset |
| R-9.7 | AC1 | AUTOMATED | seo.spec.ts / build output — favicon set referenced from the head |
| R-9.7 | AC2 | AUTOMATED | Build output — apple-touch-icon, 16/32/48 PNG, multi-resolution .ico |
| R-9.7 | AC3 | AUTOMATED | seo.spec.ts — og:image is a 1200x630 raster with width/height/type/alt |
| R-9.7 | AC4 | AUTOMATED | Build output — .ico is a real ICO (magic 00 00 01 00), not a renamed PNG |
| R-9.7 | AC5 | MANUAL | Verified live — all icon assets 200 with correct content types |
| R-9.7 | AC6 | MANUAL | Verified live — og:image 200, image/jpeg, 1200x630 |
| R-9.8 | AC1 | AUTOMATED | lighthouse.spec.ts — Performance >= 95 with the brand applied |
| R-9.8 | AC2 | AUTOMATED | lighthouse.spec.ts — LCP within budget |
| R-9.8 | AC3 | AUTOMATED | lighthouse.spec.ts — CLS under 0.1 |
| R-9.8 | AC4 | AUTOMATED | cross-browser.spec.ts — JS transfer budget |
| R-9.8 | AC5 | AUTOMATED | Build output — stylesheet inlined, no render-blocking external CSS |
| R-9.8 | AC6 | GAP | Same gap as R-7.8 AC4 / R-5.2 AC4: the post-brand comparison against the pre-brand baseline was never recorded as a stated comparison. |
| R-9.8 | AC7 | AUTOMATED | service-icons.spec.ts + build output — the site ships 0 bytes of its own JS |
| R-9.9 | AC1 | AUTOMATED | brand-tokens.spec.ts — identical rendering under light/dark/no-preference |
| R-9.9 | AC2 | AUTOMATED | brand-tokens.spec.ts — document root declares color-scheme: light |
| R-9.9 | AC3 | MANUAL | On-dark logo used only on genuinely dark surfaces (OG card, app icons) |
| R-9.9 | AC4 | MANUAL | Mark remains legible against dark browser chrome |
