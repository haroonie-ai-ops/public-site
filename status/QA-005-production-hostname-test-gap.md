# QA-005 — Test suites target a hostname that is no longer production

**Raised:** 2026-09-16
**Classification:** PRODUCT_DEFECT (Finding 1) + TEST_DEFECT (Finding 2)
**Severity:** Finding 1 High · Finding 2 High
**Status:** OPEN

## Finding 1 — PRODUCT_DEFECT (High): CSP blocks a Cloudflare-injected script on every production page

**R-7.5 AC2** ("no page produces a CSP violation in the console") and
**R-5.3 AC1** ("no console errors") both FAIL against `https://www.haroonie.ai/`.

Evidence — Playwright, three engines, six routes, 2026-09-16:

| Engine | Pages failing | Violation |
|---|---|---|
| chromium | 6/6 | `script-src-elem` blocked inline |
| firefox | 6/6 | `script-src-elem` blocked inline |
| webkit | 6/6 | `script-src-elem` blocked inline |

Total: 18 CSP violations, 18 console errors, 0 page errors. VERDICT: FAIL.

WebKit's message states the mechanism plainly: *"Refused to execute a script
because its hash, its nonce, or 'unsafe-inline' does not appear in the
script-src directive of the Content Security Policy."*

**Cause.** On proxied hostnames Cloudflare injects an inline bootstrap for
`/cdn-cgi/challenge-platform/scripts/jsd/main.js` (JavaScript Detections,
under Bot Fight Mode). R-7.5's CSP is `script-src 'self'` with no
`'unsafe-inline'` and no nonce, so the browser correctly blocks it.

- `www.haroonie.ai/services/` → 7361 bytes, injected script present
- `haroonie-ai-public-site.pages.dev/services/` → 6423 bytes, absent
- `cf-cache-status: DYNAMIC` — not a caching artifact

**The CSP is behaving correctly. The defect is the injection, not the policy.**

**Attempted fix that did NOT work.** `browser_check` was set `off`
(2026-09-16T00:47:22Z) on the hypothesis it was the source. It was not — the
injection persisted unchanged. `browser_check` remains `off` pending an owner
decision on reverting it. The real control is Bot Fight Mode / JavaScript
Detections, which `CLOUDFLARE_ZONE_TOKEN` cannot reach (`/bot_management` →
403 Forbidden), so it requires dashboard access.

**Rejected remedy.** Adding `'unsafe-inline'` to `script-src` would turn the
suite green by removing the principal protection the CSP provides. That is
assertion-weakening under CLAUDE.md and REQ-001 R-8.3, and is not proposed.
Hashing is not viable either: the inline content embeds a per-request ray ID,
so no stable hash exists.

**Also affected:** R-5.2 AC2's recorded "0 bytes of JS" is no longer true on
the production hostname (~938 bytes injected). Still far inside the 50 KB
budget, but the recorded figure is wrong for the host users visit.

## Finding 2 — TEST_DEFECT (High): the suites cannot observe production

Every automated check that should have caught Finding 1 targets a hostname
that no longer represents production:

- `tests/cross-browser.spec.ts`, `tests/lighthouse.spec.ts` — built static
  output via local preview server
- `tests/security-headers.spec.ts` — re-applies the CSP by route interception
  against local output; cannot see a live response at all
- `status/PERF-001-wave6-audit.md` — measured
  `haroonie-ai-public-site.pages.dev`

None traverse the Cloudflare zone proxy, which is where the injection occurs.
**This is why Finding 1 was invisible to five green CI runs and a full Wave 6
audit — all of them honest, none of them looking at production.**

The gap opened at the moment `www` and the apex became proxied records
(2026-09-15). Before that, the pages.dev origin *was* production. No prior
result was wrong when recorded; they were silently invalidated by a
configuration change elsewhere.

### Recommendation

Add a production-target smoke suite running against `https://www.haroonie.ai/`
— CSP violations, console errors, security headers on live responses, and JS
transfer size — separate from the build-output suites, which stay as fast
pre-merge gates. This also closes R-7.5 AC1's known deploy-time gap, which
currently has no automated coverage at all.

### Note for the Tester

Finding 1 was discovered incidentally while verifying R-7.6 (trailing-slash
canonicalization), via an unexplained body-hash difference between two URL
forms. R-7.6 AC1 itself PASSES: all five routes 308 to the slashed form and
only one form serves 200.

### Engineer update, 2026-09-16 — implementation open in PR #9, not yet merged

Both findings addressed via REQ-001-A2 (E14/E15 owner-approved), Wave 4-R1
(`planning/PLAN-001-execution-waves.md` §7): `functions/_middleware.ts`
mints a per-response CSP nonce so Cloudflare's own injected script is
authorized without `'unsafe-inline'` (Finding 1's fix), and
`tests/production-security.spec.ts` + `playwright.production.config.ts`
give this program its first suite that ever requests the real production
hostname (Finding 2's fix), wired into `ci-cd.yml` as a new
`post-deploy-verify` job.

Engineering self-test against current (unpatched) production reproduced
Finding 1's exact numbers with the new suite: 18/18 CSP-violation failures
(3 engines × 6 routes), confirming the new suite genuinely detects what
this report describes, not a suite that would have passed regardless. This
is expected to reach 0 once PR #9 merges and deploys — not something this
session can do (no merge authority). Full detail: PR #9,
`status/STATUS.md`'s top entry.
