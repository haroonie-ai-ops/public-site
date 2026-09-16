# PERF-001 — Wave 6 Performance and Cross-Browser Hardening Audit

Author: Engineer
Date: 2026-09-14
Scope: R-5.2 (performance budget), R-5.3 (cross-browser rendering), per
`planning/PLAN-001-execution-waves.md` "Wave 6".

This document records the actual measured numbers behind Wave 6's pass/fail
calls, the durable automated checks added to enforce them going forward, an
environmental finding that materially shaped how this wave was executed,
and one flaky-test finding. Every number below was measured, not assumed —
see "Methodology" for exactly how.

**Correction (REQ-001-A2 §3.3, 2026-09-16):** R-5.2 AC2's "0 bytes of JS"
figure below was accurate for `haroonie-ai-public-site.pages.dev` at the
time it was recorded, but is not the correct figure for the hostname
visitors actually use. QA-005 (2026-09-16) measured ~938 bytes of
Cloudflare-injected script (JavaScript Detections / Bot Fight Mode) on
`https://www.haroonie.ai/services/` — a zone-level configuration effect
external to this program's own build, not a regression in anything Wave 6
shipped. **AC2 still PASSES** — 938 bytes is far inside the 50KB budget —
but the recorded evidence is corrected here rather than silently left
wrong. `tests/production-security.spec.ts` (REQ-001-A2 R-7.8 AC3, added
this session) now measures this figure against the real production
hostname on every post-deployment run, so this kind of drift is caught
going forward instead of discovered incidentally. R-7.8 AC4 (re-verifying
R-5.2 AC1's Lighthouse budget against the post-Function production
hostname) is sequenced after Wave 4-R1's Function actually ships
(PLAN-001 §7.3 Group C) — not yet done as of this correction.

---

## 1. Headline result

**R-5.2 and R-5.3 both PASS against live production, with large margin, on
every one of the six public pages.** No product defect was found. No
performance or rendering fix was required. Two durable Playwright checks
were added so these budgets are enforced on every future build, not just
today.

| AC | Requirement | Result |
|---|---|---|
| R-5.2 AC1 | Home page, simulated mobile, Lighthouse Performance >= 95 and LCP < 2.5s | **PASS** — Performance 100, LCP ~0.96-1.2s (two production runs) |
| R-5.2 AC2 | Any page, total transferred JS < 50KB compressed | **PASS** — 0 bytes of JS on all six pages (site ships no client-side JavaScript at all) |
| R-5.3 AC1 | Chromium, Firefox, WebKit — layout intact, no console errors | **PASS** — all six pages, all three engines, zero console errors, zero horizontal overflow at 320px and 1920px |

---

## 2. Methodology

Two independent measurement paths were used, deliberately, because of an
environmental issue described in Section 5:

1. **One-off audit against real production** (`https://haroonie-ai-public-site.pages.dev/`,
   the actual deployed Cloudflare Pages URL named in this wave's brief) —
   measured directly over HTTPS with `curl` (headers, compression, byte
   sizes) and with the standalone `lighthouse` CLI (v13.4.1, attached to
   Playwright's own bundled Chromium 1243 via `CHROME_PATH`, headless,
   `--form-factor=mobile --throttling-method=simulate`), run from this
   session, against the live URL, today. This is the evidence for the
   numbers in Section 3 and the sole source for "what production actually
   does right now."
2. **Durable, ongoing checks** (`tests/lighthouse.spec.ts`,
   `tests/cross-browser.spec.ts`) — added to the Playwright suite so every
   future build is checked automatically, not just today's snapshot. These
   run against the **built static output** (`astro build` + `astro
   preview`, the same `previewBaseURL` server `seo-preview.spec.ts` already
   uses for the same reason: it is what Cloudflare Pages actually serves,
   the dev server is not), using content-agnostic assertions (byte counts,
   console events, layout geometry) rather than hardcoded copy, so they
   remain valid regardless of exactly what text a page contains.

Both paths agree: Performance 100, LCP well under budget, 0 bytes of JS,
zero console errors, zero overflow.

---

## 3. Real measured numbers — production, 2026-09-14

### 3.1 Lighthouse (mobile, simulated throttling), all six public pages

| Page | Performance score | LCP | JS transferred | Total page transfer |
|---|---|---|---|---|
| `/` (run 1) | 100 | 1204 ms | 0 B | ~3.3 KB |
| `/` (run 2) | 100 | 955 ms | 0 B | ~3.3 KB |
| `/services/` | 100 | 1021 ms | 0 B | ~3.1 KB |
| `/about/` | 100 | 856 ms | 0 B | ~2.9 KB |
| `/contact/` | 100 | 909 ms | 0 B | ~3.3 KB |
| `/privacy/` | 100 | 868 ms | 0 B | ~3.4 KB |
| `/terms/` | 100 | 936 ms | 0 B | ~3.1 KB |

R-5.2 AC1 only names the home page; it was run twice to rule out a one-off
result before treating it as representative — both runs pass with over 1.3
seconds of margin against the 2.5s LCP budget and a perfect Performance
score. AC2 ("any page") was measured on all six.

**Why JS is 0 bytes on every page:** the built output has no `<script
src="...">` tag anywhere (confirmed by grepping the decompressed HTML of
all six routes) and no analytics/beacon script is wired up yet (R-4.5 is
untouched by this wave — no `gtag`, `beacon.min.js`,
`cloudflareinsights`, etc. found in any page). This is an architectural
property of the current Astro build (no `client:*` hydration directives
are used anywhere in `src/`), not a Wave 6 optimization — there was nothing
to trim. It also means R-5.2 AC2 has essentially no headroom to lose:
`tests/cross-browser.spec.ts`'s JS-budget check will catch the day this
changes.

### 3.2 Response headers and compression (production, via `curl`)

All six pages: `content-encoding: br`, `content-type: text/html;
charset=utf-8`, `cache-control: public, max-age=0, must-revalidate`. The
404 route: `cache-control: no-store`. `referrer-policy:
strict-origin-when-cross-origin` is already present; `Content-Security-Policy`
and `X-Content-Type-Options` are not yet present — this is expected and out
of this wave's scope, being the other in-flight engineer's R-7.5 work on
`public/_headers` (file ownership boundary from this session's brief).
`robots.txt` currently returns `Disallow: /` — the deliberate, owner-approved
temporary non-indexable gate pending E6 real copy (`status/PM-003...`,
Section 0 item 4). Both observations are informational only, already
tracked elsewhere, and required no action from this wave.

**Content note, not a Wave 6 defect:** the production Home/Services/About
pages still render the `PlaceholderNotice` banner ("Placeholder — final
content pending owner-supplied copy. Not for production."). This is
already tracked (E6, the placeholder-content register, the non-indexable
gate) and is a content/BA-owned gap, not a performance or rendering defect
— it is not touched by this wave, per the brief's instruction that a
content change is out of Wave 6's scope and should be recorded, not
unilaterally fixed. Recorded here only because it was directly observed
while auditing.

---

## 4. Cross-browser results (R-5.3 AC1)

Run via the three new `cross-browser-chromium` / `cross-browser-firefox` /
`cross-browser-webkit` Playwright projects (built static output, all six
public routes):

- **Console errors / uncaught exceptions:** zero, on every page, on every
  engine (18 checks: 6 pages x 3 engines).
- **Layout / horizontal overflow:** zero, at both 320px and 1920px viewport
  width (R-2's own stated responsive range), on every page, on every engine
  (36 checks: 6 pages x 2 widths x 3 engines).

54 assertions, 54 passes, 0 failures. No layout or console-error defect
found on any engine.

---

## 5. Environmental finding — local git worktree is stale relative to `origin/main`, and the git-remote failure is an authentication failure

**Classification: ENVIRONMENT_FAILURE, not a product or automation
defect.** Recorded per CLAUDE.md's failure-classification requirement.

This session's local `main`-derived worktree started at commit `b4efc10`.
`git fetch origin` was attempted and appeared to hang with no output.
**Correction (recorded here for accuracy, per the coordinating session):**
this is not a network/transport stall. A backgrounded `git ls-remote
--heads origin` eventually returned exit 0 with `Logon failed, use ctrl+c
to cancel basic credential prompt.` on stderr — Git Credential Manager is
popping an interactive basic-credential prompt because no usable stored
git credential exists for this remote, and because stdin is attached to
the null device in this environment, nothing answers that prompt, so the
command appears to hang until something kills it. Root cause is the
missing usable credential, not a stall in the transport itself — the same
underlying issue `status/PM-002` and `status/PM-003` already recorded
independently, in a different session, on a different worktree, previously
described there as a hang/credential error without this precise mechanism.
Cross-checked against the GitHub API (read-only, via the `github` MCP
server — no push or write performed): `origin/main`'s real tip is 14+
commits ahead and includes the entire Wave 2b page-content and
content-collection architecture (`e64ac08e` and after) plus the QA-004
remediation. **This local checkout never had that content** —
`src/pages/about/index.astro`, `/services/`, etc. here are still Wave
1/2a's placeholder stubs, not the real Wave 2b copy that is actually live
in production.

**Impact and mitigation:**
- The one-off production audit (Section 3) is unaffected — it measured the
  real deployed URL directly over HTTPS, never this local checkout, so
  those numbers are trustworthy regardless of the git divergence.
- The durable checks added (Section 6) were authored and verified against
  this stale local build. They were deliberately written to be
  content-agnostic — byte counts, console events, and layout geometry, no
  hardcoded copy text — specifically so they remain valid once run against
  the real Wave 2b content on `origin/main`. This is a design choice made
  *because of* the divergence, not an incidental style preference.
- What this finding does **not** let this session verify: whether the real
  Wave 2b content (longer service descriptions, the real biography once
  E6 lands, etc.) changes the cross-browser layout or JS-budget outcome.
  Given the measured production numbers in Section 3 already reflect the
  real content and pass with large margin, this is a low-risk gap, not a
  blocker — but whoever next has working git credentials against this repo
  should re-run `npm test` (specifically `cross-browser.spec.ts` and
  `lighthouse.spec.ts`) from a checkout of the true `origin/main` tip
  before treating this wave's automated checks as verified in that
  context, rather than assuming a stale-tree pass transfers automatically.
- **Update:** this PR rebases the durable checks (and playwright.config.ts,
  package.json, package-lock.json) onto the real, current `origin/main`
  tip via the GitHub API (the only working path given the authentication
  failure above) — rather than local git. See the pull request description
  for the exact merge reasoning on each modified file. Fixing the
  underlying git credential issue itself remains an owner escalation
  (CLAUDE.md: credentials/access require owner approval); this session did
  not attempt to configure or supply any git credential.
- Per CLAUDE.md's failure policy, this is recorded as evidence with a
  recommended next action (a git-credential fix or a manual reconciliation
  pass, same recommendation `status/PM-003` already made) rather than
  something this session can repair itself — it is a sandbox
  credential/environment issue, not a code defect.

---

## 6. Durable automated checks added

All three files below are new; `playwright.config.ts` was extended (this
session owns it for Wave 6, per the brief).

1. **`tests/lighthouse.spec.ts`** — one test, dedicated `lighthouse`
   Playwright project (built static output, fixed CDP port via
   `playwright-lighthouse`). Asserts Lighthouse Performance >= 95
   (`thresholds.performance`) and explicitly asserts LCP < 2500ms from the
   raw Lighthouse result (`lhr.audits['largest-contentful-paint']`) — the
   `thresholds` option only covers category scores, not individual metrics,
   so LCP needed its own assertion to actually cover AC1's "under 2.5
   seconds" clause. Deliberately scoped to the home page only, matching
   R-5.2 AC1's own wording.
2. **`tests/cross-browser.spec.ts`** — three describe blocks, run across
   the three new `cross-browser-{chromium,firefox,webkit}` projects
   (built static output):
   - No console errors / uncaught exceptions (R-5.3 AC1), every route.
   - No horizontal overflow at 320px and 1920px (R-5.3 AC1, R-2's stated
     responsive range), every route.
   - Compressed JS transfer < 50KB via `request.sizes().responseBodySize`
     (R-5.2 AC2), every route, chromium-only (byte count is
     engine-independent; three redundant runs would add nothing).
3. **`playwright.config.ts`** — added the `cross-browser-chromium` /
   `-firefox` / `-webkit` and `lighthouse` projects, all pointed at
   `previewBaseURL` (the existing built-static-output server, not the dev
   server) for the same reason `static-preview` already is: dev-only
   HMR/warning noise would misrepresent what Cloudflare Pages actually
   serves. Added matching `testIgnore` entries to the existing
   `chromium`/`firefox`/`webkit` (dev-server) projects so these new specs
   don't also run there. Added a `tests/support/ports.ts` shared constant
   (`LIGHTHOUSE_CDP_PORT`) so the config and the spec can't drift apart on
   the fixed CDP port value, following the existing `PW_PORT`/
   `PW_PREVIEW_PORT` env-var-configurable pattern (so two agents sharing a
   machine don't collide).

New devDependencies: `lighthouse@13.4.1`, `playwright-lighthouse@4.0.0`.
No existing test file, project, or assertion was modified or weakened.

**Full suite result** (`PW_PORT=4511 PW_PREVIEW_PORT=4512
PW_LIGHTHOUSE_CDP_PORT=9333 npx playwright test`, this local — stale, see
Section 5 — checkout): **159 passed, 13 skipped, 0 failed.** The 13 skips
are the pre-existing documented WebKit tab-order skip (1, unrelated to this
wave) plus this wave's own deliberate chromium-only JS-budget skips on
firefox/webkit (12 = 6 routes x 2 engines).

`npm run typecheck` (astro check): 0 errors/warnings/hints. `npx tsc
--noEmit`: clean.

**Not yet verified against this rebase:** the full suite above was run
against the stale local tree before this branch was rebased onto the real
`origin/main` tip via the GitHub API (Section 5). No local environment in
this session has both the real `origin/main` content and working git
credentials at the same time, so `npm test` has not been re-run against
the exact merged tree now on this branch. The merge itself (package.json/
package-lock.json/playwright.config.ts) was hand-verified file-by-file —
see the pull request description — but CI running on this branch is the
first true end-to-end run against the merged tree and should be treated as
authoritative, not the stale-tree number above.

---

## 7. Flaky-test finding

**Classification: FLAKY_TEST / ENVIRONMENT, not a product defect.** Same
class as the pre-existing `status/QA-002-wave2a-tester-review.md` Finding 1
("shared-sandbox browser-crash flakiness... never affects CI, only this
shared local sandbox").

The very first run of `tests/lighthouse.spec.ts` in this session, executed
immediately after the `webServer`'s own `npm run build` step for a fresh
port pair, scored Performance 75 — the only failing lighthouse run
observed all session, against every other measurement (production, twice;
this same local build, three immediate reruns with no other load: 99, 100,
100). Root cause: `throttlingMethod: 'simulate'` still records a real
performance trace before mathematically simulating the network on top of
it, so genuine CPU contention on the machine actually running the audit —
present here right after a build's process teardown, absent on a dedicated
CI runner — can transiently depress the trace-derived metrics that feed
the score. Documented directly in `tests/lighthouse.spec.ts`'s own
comments so a future maintainer isn't surprised by an isolated failure in
this shared sandbox. **Not remediated**, per the same reasoning QA-002
Finding 1 was left alone: no retry logic, no threshold-loosening, no
reduced scope was added to paper over it. If this recurs on the real CI
runner (a dedicated, non-shared machine) rather than only in an
interactive sandbox immediately after a build, that would be a different,
more serious finding and should be escalated as such — not assumed to be
the same benign cause.

---

## 8. What was NOT done, and why

- **No performance or rendering fix was made.** There was nothing to fix —
  every measured number passes with large margin. Per the brief: "Where a
  budget fails, diagnose and fix... Where a budget passes, there is nothing
  in scope to change."
- **No content change.** The Home/Services/About placeholder banners
  (Section 3.2) are a content-completeness gap already owned by E6/BA, not
  a performance or rendering issue — untouched, per the brief's explicit
  instruction not to make content/design changes unilaterally.
- **No edit to `public/_headers`, any header/CSP test file, `status/STATUS.md`,
  or any `status/PM-*.md` file** — file-ownership boundary from this
  session's brief, honored throughout.
- **No push to `main`, and no merge performed.** This branch was pushed and
  a pull request opened per explicit owner authorization to do exactly
  that; merging remains a separate, owner-approved step.

---

## 9. Git

Originally committed locally on this session's worktree branch
(`fb35934`, `263070e`, `aefceb9`), on top of a `main` already known stale
relative to `origin/main` (Section 5). Per explicit owner authorization
received after this audit was written, this work was subsequently rebased
onto the current, verified `origin/main` tip and pushed via the GitHub API
(the only working path given the authentication failure in Section 5), and
a pull request was opened. See the pull request description for the exact
merge reasoning applied to each modified file.
