# QA-005 — Test suites target a hostname that is no longer production

**Raised:** 2026-09-16
**Classification:** PRODUCT_DEFECT (Finding 1) + TEST_DEFECT (Finding 2) + TEST_DEFECT (Finding 3)
**Severity:** Finding 1 High (RESOLVED) · Finding 2 High · Finding 3 High
**Status:** OPEN (Finding 2 and Finding 3 remediation tracked; Finding 1 RESOLVED)

## Finding 1 — PRODUCT_DEFECT (High) — RESOLVED 2026-09-15: CSP blocks a Cloudflare-injected script on every production page

**Resolution.** Wave 4-R1 (PR #9, merged as `ab2b0018`) shipped Option B — a
Cloudflare Pages Function that mints a fresh CSPRNG nonce per response and
stamps it into both `script-src` and Cloudflare's own injected bootstrap
script. This is now **empirically confirmed in production**, not merely
documented:

- `https://www.haroonie.ai/` serves `script-src 'self' 'nonce-<fresh per
  request>'`.
- Cloudflare's own injected script carries the matching nonce attribute
  (`<script nonce="oTMHSMwgMSjydcf9Ad3sJw==">`), confirming the mechanism
  this program's own code does not control (Cloudflare's injection point)
  cooperates with the mechanism it does control (the Function's nonce).
- Independent Playwright probe, 2026-09-15, three engines (chromium,
  firefox, webkit) x 6 routes, against `https://www.haroonie.ai/`: **0 CSP
  violations, 0 console errors, 0 page errors** — down from 18/18 violations
  at the time this finding was raised.
- R-7.5 AC2 and R-5.3 AC1 now PASS on the real production hostname.
- The nonce is confirmed per-response (differs across repeated requests) and
  CSPRNG-length (>= 128 bits decoded), per R-7.5 AC1a/AC1c.

The rejected remedies below were correctly rejected; Option B is what
shipped, and it removes the injected-script CSP violation without
`'unsafe-inline'` or a hash-based allowance.

## Finding 1 (original text, retained for record) — CSP blocks a Cloudflare-injected script on every production page

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

## Finding 3 — TEST_DEFECT (High), environmental trigger: the new production-verification suite couldn't run from CI, the moment it started needing to

**Raised:** 2026-09-15, immediately after PR #9 (Wave 4-R1) merged as
`ab2b0018` and Finding 1 was resolved in production (see the revised
Finding 1 above).

**Headline: Wave 4-R1 works.** This is not a regression in the product. The
`post-deploy-verify` CI job failed on the very first run after merge, but
every real-browser check in that same run — the ones that actually exercise
R-7.5 AC2 / R-5.3 AC1, the whole point of this workstream — passed. The
failure was confined to one assertion, repeated across routes and engines.

**Symptom.** All 18 CI failures
(https://github.com/haroonie-ai-ops/public-site/actions/runs/35051739769/job/104654284619)
were the identical assertion in `tests/production-security.spec.ts:36`:

```
expect(apiResponse.status(), route.path).toBe(200);
Expected: 200
Received: 403
```

**Root cause.** That line's `apiResponse` came from
`request.get(PRODUCTION_ORIGIN + route.path)` — Playwright's
`APIRequestContext`, a plain HTTP client with no browser fingerprint or TLS
handshake profile a real browser would present. Cloudflare's Bot Fight Mode
scores that client as untrusted from the GitHub Actions runner's datacenter
IP and returns an HTTP 403 challenge before the test ever reaches its CSP
assertions. Confirmation this is client/IP-dependent, not a site fault:

- `curl` from a residential IP: 200 on every route, every time.
- The GitHub Actions runner: 403 on every route, every run.
- The 15 checks in the same CI run driven by a real browser (`page.goto()`)
  were not challenged and all passed — the same production hostname, the
  same run, a different client fingerprint.

**Why this is the direct, foreseeable-in-hindsight consequence of an
accepted trade-off, not a surprise defect.** This program deliberately kept
Bot Fight Mode enabled (REQ-001 E14/E15) — it is the entire reason Option
B's nonce work exists (Finding 1's fix authorizes the *script* Bot Fight
Mode injects, without weakening the CSP that Bot Fight Mode's presence
makes necessary in the first place). Bot Fight Mode's job is to challenge
traffic that doesn't look like a real browser. `post-deploy-verify`'s own
precondition check was, until this fix, exactly that kind of traffic. The
same protection this program chose to keep for site visitors was always
going to apply to the program's own verification client too, from CI's
non-residential IP range — this didn't need discovery in production to be
predictable, and it's written down here so it isn't rediscovered as a
surprise a second time.

**Fix (this session, not yet merged — see PR below).**
`tests/production-security.spec.ts`'s primary describe block (R-7.8 AC1/AC2)
now reads response status and all header assertions — including AC1f's
"exactly one CSP header" check — from the `Response` object returned by
`page.goto()`, a real browser navigation, instead of a separate
`APIRequestContext` call. This is strictly more faithful, not just a
workaround: it asserts what a visitor's browser actually receives, in the
same navigation that also drives the existing CSP-violation/console-error
checks (previously two separate HTTP requests to the same route; now one).

*AC1f caution, addressed rather than dropped:* a browser `Response`'s
`headersArray()` could in principle coalesce duplicate same-name headers
into one comma-joined entry, which would blind the "exactly one CSP header"
check to real double-emission (Function + a stale `public/_headers` entry
both firing). Verified against the installed Playwright version's own
source (`node_modules/playwright-core/lib/coreBundle.js`) rather than
assumed: Chromium's `ResponseExtraInfoTracker` builds raw headers from
`Network.responseReceivedExtraInfo`, newline-joining same-name duplicates
and then splitting them back into separate array entries; Firefox and
WebKit instead re-split an already-comma-joined value on `,`. Both paths
preserve duplicate `Content-Security-Policy` instances as separate
`headersArray()` entries across all three engines this program tests,
provided the async `headersArray()`/`allHeaders()` pair is used — not the
synchronous, `@deprecated` `headers()`, which reads "provisional" headers
captured before Playwright's raw-header round trip and is exactly the
coalescing risk described above. The fix uses the async pair. This
reasoning is preserved as an in-file comment so a future Playwright upgrade
that changes this behavior gets re-verified, not silently trusted.

The two remaining `request.get()`-based describe blocks (nonce-uniqueness
across repeated requests; the `/cdn-cgi/challenge-platform/` same-origin
check) were deliberately left on `APIRequestContext` rather than converted
to `page.goto()` — converting them would trade one failure mode (bot
challenge) for another (Chrome aborting navigation with `net::ERR_ABORTED`
when a raw script-file response is treated as a download rather than
rendered). Both are now wrapped with a shared `cloudflareChallengeMessage()`
helper: if Bot Fight Mode ever also challenges these, the failure names the
cause in one line instead of requiring log archaeology through a bare
status-code mismatch — the diagnosability gap this finding is really about.

**Verification performed.**
- `npm run typecheck` (`astro check`): 0 errors.
- `npm run test:production` against live `https://www.haroonie.ai/`, three
  engines: 33 passed, 15 skipped (AC3's JS-size checks are chromium-only by
  design; `csp-nonce-failsafe.spec.ts` self-skips without
  `CSP_FAILSAFE_BASE_URL`, an unrelated, pre-existing, disclosed gap), 0
  failed.
- **This local run does NOT prove the CI job will pass.** It ran from this
  session's residential-class IP, which Cloudflare does not challenge — the
  exact asymmetry this finding documents. The real test is the next
  `post-deploy-verify` run on `main` after this fix merges; if Bot Fight
  Mode ever challenges a real browser navigation too, `assertNavigationOk`'s
  Cloudflare-challenge detection is designed to make that immediately
  legible rather than requiring re-diagnosis from a bare status mismatch.

**Not touched, on purpose:** Cloudflare zone settings, Bot Fight Mode, HSTS.
No rollback was performed or recommended — `post-deploy-verify`'s rollback
recommendation on the original 403s was a false alarm, per the analysis
above.

**Status:** Fix implemented and locally verified against production; open
in a PR pending review and merge (main is protected). See
`status/STATUS.md` for the PR number once opened.
