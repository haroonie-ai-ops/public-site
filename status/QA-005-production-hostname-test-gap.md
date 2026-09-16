# QA-005 — Test suites target a hostname that is no longer production

**Raised:** 2026-09-16
**Classification:** PRODUCT_DEFECT (Finding 1) + TEST_DEFECT (Finding 2) + TEST_DEFECT (Finding 3)
**Severity:** Finding 1 High (RESOLVED) · Finding 2 High (RESOLVED) · Finding 3 High (remediation complete, pending final `post-deploy-verify` confirmation on `main`)
**Status:** Finding 1 RESOLVED; Finding 2 RESOLVED; Finding 3 fix for the remaining 6 CI failures implemented and locally verified — see 2026-09-16 update below. Final proof is the next `post-deploy-verify` run on `main` after merge (this program has no merge authority; PR pending review).

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

**Status (superseded by the 2026-09-16 update below):** Fix implemented and
locally verified against production; open in a PR pending review and merge
(main is protected). See `status/STATUS.md` for the PR number once opened.

### Engineer update, 2026-09-16 — PR #10 merged (`07f3e5f6`): 18→6. PR #11 (this update) closes the remaining 6.

**PR #10's real-browser conversion for the R-7.8 AC1/AC2 block worked
exactly as designed and is not being revisited or reversed here.** It
merged as `07f3e5f6` and the next `post-deploy-verify` run
(https://github.com/haroonie-ai-ops/public-site/actions/runs/35056161382)
confirmed it empirically: all 18 of the original 18/18 failures were gone —
every real-browser check (R-7.8 AC1/AC2, all 6 routes × 3 engines) passed
from the CI runner IP. The run's final tally was **6 failed, 27 passed, 15
skipped** — every one of the 6 remaining failures was the two
`request.get()`-based nonce checks (R-7.5 AC1a/AC1c), × 3 engines, each
self-diagnosing via the `cloudflareChallengeMessage()` helper PR #10 added:

```
/ (request 0): HTTP 403 with Cloudflare markers (cf-ray=a3bd31dcaf0a0585-IAD,
cf-mitigated=challenge, server=cloudflare) — almost certainly Bot Fight Mode
challenging this verification client's IP/fingerprint reputation (QA-005
Finding 3), not a product defect.
```

`cf-mitigated=challenge` is Cloudflare stating the cause outright: from a
CI runner IP this is not intermittent, it is deterministic — every future
`post-deploy-verify` run would fail on every deploy, on exactly these two
checks, forever, unless fixed. A job that always fails is worse than no job
at all: it gets ignored, and ignoring it would also mask any real
regression the job would otherwise catch. This is why the owner directed
completing the conversion rather than tolerating the remaining 6 (or
weakening/removing the checks, which R-8.3 forbids regardless).

**Fix: both nonce checks converted from `APIRequestContext` to real browser
navigations (`page.goto()`),** the same fix PR #10 already proved works for
the AC1/AC2 block, applied to the last two holdouts
(`tests/production-security.spec.ts`).

*Why PR #10 didn't already do this for these two:* PR #10's stated reason
was that a raw script-file response risks Chrome treating a navigation as a
download and aborting with `net::ERR_ABORTED`. Re-examined rather than
taken on faith, because the owner asked for that specifically: **this risk
does not apply to either nonce check**, and never did — both only ever need
an HTML document's own CSP response header, never a raw script file. The
actual raw-script-file case is the *separate* R-7.5 AC1d check (see below),
and even there, direct empirical testing (2026-09-15, chromium, firefox,
webkit, against `https://www.haroonie.ai/cdn-cgi/challenge-platform/scripts/
jsd/main.js` from this session's unchallenged IP) did **not** reproduce
`net::ERR_ABORTED` — the response has `content-type: application/javascript`
with no `Content-Disposition: attachment`, and all three engines navigated
to it and rendered it as a normal 200 response. So PR #10's specific
download-abort justification does not hold as stated in the current
Playwright/browser versions, for any of the three checks it was cited for.
That correction is recorded here rather than quietly repeated.

**Caching — the real correctness risk in this conversion, addressed
deliberately, not assumed away.** Repeated `page.goto()` calls to the same
URL risk the browser silently replaying an earlier cached response instead
of making a fresh request, which could make a uniqueness check compare two
copies of the same response. Investigated directly against production
before writing the fix:

- Production serves `Cache-Control: public, max-age=0, must-revalidate`
  with **no `ETag` or `Last-Modified`** on `/`. With no validator, a
  compliant cache cannot issue a conditional revalidation request — it must
  either treat the entry as unusable or refetch in full. Empirically
  (2026-09-15, 4 repeated same-URL/same-context navigations, all three
  engines): every navigation returned a distinct nonce; zero repeats. So
  today's header configuration already defeats this risk on its own.
- That is *today's* configuration, not a contract this test should quietly
  depend on forever, so the fix does not rely on it: every navigation in
  both tests now appends a unique cache-busting query string
  (`cacheBustedUrl()`, `tests/support/cloudflare.ts`), which guarantees a
  distinct cache key structurally, independent of `Cache-Control` now or
  after any future change to it. Confirmed this cannot silently route to a
  different page: Astro/Cloudflare Pages route matching ignores the query
  string (verified — cache-busted requests to `/` still served the actual
  home page in every trial).

**Proof the uniqueness check is not vacuous, not just internally
consistent.** The concern named in the assignment: a test that quietly
compares two cached copies of the same response could *pass* while proving
nothing. Verified directly rather than argued: the exact `page.goto()` +
cache-busting mechanics were run against two throwaway local HTTP
servers — one minting a fresh nonce per response (positive control), one
deliberately serving a **fixed, repeated** nonce on every response
(negative control, simulating a real regression such as `generateNonce()`
being accidentally memoized). Result: the positive control's
`new Set(nonces).size === nonces.length` check passed (6/6 unique); the
negative control's same check correctly reported `unique=1/6` and the
assertion failed. The mechanism genuinely discriminates a real per-response
nonce from a broken, static one — it is not a check that would pass
regardless of what the server does.

**R-7.5 AC1d relocated out of the CI-gated suite, per owner direction —
not deleted, and not left without a verification story.** The
`/cdn-cgi/challenge-platform/` same-origin check was "the one genuinely
awkward fetch": a bare internal script path reached via a redirect chain,
with none of the referrer/session context a real page load carries — even
though it didn't reproduce `net::ERR_ABORTED` in testing (above), it is
exactly the kind of "cold," context-free client request Bot Fight Mode is
likeliest to score as suspicious from a datacenter IP, the same failure
mode the nonce checks just got fixed for. Rather than gate every deploy on
a third check exposed to that same risk, it now has two verification paths:

1. **Primary, CI-gated, continuous, already in production since PR #9/#10:**
   the R-7.8 AC1/AC2 "zero CSP violations" assertion. Confirmed by reading
   the actual injected bootstrap script's source
   (`curl https://www.haroonie.ai/` output, 2026-09-15): it dynamically
   appends `<script nonce="..." src="/cdn-cgi/challenge-platform/scripts/
   jsd/main.js">` inside a same-origin iframe that inherits the page's CSP.
   If `'self'` did not authorize that path, loading it would itself raise a
   `securitypolicyviolation` event that the existing zero-violations
   assertion — already gating every route, every engine, every deploy —
   would catch immediately. This is a stronger guarantee than a point-in-
   time status-code probe: it proves the path is actually *used*
   successfully under the real CSP by a real browser, continuously, not
   merely reachable at one point in time.
2. **Secondary, manual, on demand:** the original isolated same-origin
   request, moved verbatim to `tests/production-challenge-platform.manual.spec.ts`
   (new `playwright.production-manual.config.ts`, run via
   `npm run test:production:manual`). Structurally excluded from both
   `playwright.config.ts` (the fast pre-merge gate) and
   `playwright.production.config.ts` (`post-deploy-verify`'s required
   gate) — verified by listing tests under both configs and confirming
   zero matches — so it can never accidentally start gating a deploy, while
   remaining fully discoverable and runnable for anyone who wants the
   direct check (e.g. after a Cloudflare-side change to this path).

**Verification performed (this session).**
- `npm run typecheck` (`astro check` + both `tsc --noEmit` projects): 0
  errors.
- `npm run test:production` against live `https://www.haroonie.ai/`, three
  engines: **30 passed, 15 skipped, 0 failed** (down from 45 total in PR
  #10's run because the AC1d test — 3 of those — moved to its own config;
  the remaining skips are AC3's chromium-only-by-design non-chromium runs
  and the pre-existing, disclosed `csp-nonce-failsafe.spec.ts` self-skip).
- `npm run test:production:manual`: 3 passed, 0 failed (the relocated AC1d
  check, all three engines).
- Listed tests under both `playwright.config.ts` and
  `playwright.production.config.ts` and confirmed zero matches for
  `production-challenge-platform.manual.spec.ts` in either — the exclusion
  is structural, not merely a naming convention.
- **This local run does NOT prove the CI job will pass**, for the same
  reason recorded in the previous update: it ran from this session's
  residential-class IP, which Cloudflare does not challenge — the exact
  asymmetry this finding documents throughout. The only real proof is the
  next `post-deploy-verify` run on `main` after this PR merges.

**Not touched, on purpose:** Cloudflare zone settings (including Bot Fight
Mode — never disabled, never weakened, no WAF bypass added), HSTS, and the
R-7.5 AC1d requirement text itself (`requirements/` was not edited; only
where and how AC1d is verified changed, not what it requires).

**Status:** Fix for the remaining 6 CI failures implemented and locally
verified against production (0 failures locally, both the CI-gated suite
and the relocated manual check). Open in a PR pending review and merge
(`main` is protected; this program has no merge authority). The 18→6
improvement from PR #10 is real, confirmed on `main`, and unaffected by
this change — this is the completion of that fix, not a reversal of it.
Final confirmation is the next `post-deploy-verify` run on `main` after
merge. See `status/STATUS.md` for the PR number.
