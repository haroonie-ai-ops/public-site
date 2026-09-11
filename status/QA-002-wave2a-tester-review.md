# QA-002 — Independent Tester Review: Wave 2a (Shared layout, nav, SEO plumbing)

Status: REMEDIATED (Finding 2) — see Remediation Report at bottom of this
document. Wave 2a itself was already "pass with findings; no product defect
blocks Wave 2b start" per the Tester's verdict below — this remediation
does not change that, it closes the one actionable harness finding.
Reviewed against: REQ-001-mvp-public-website.md R-2.7, R-4.1–R-4.4, R-5.1 (Approved);
PLAN-001 Wave 2a exit criteria; QA-001's standard of evidence
Reviewer: Tester (independent of Engineer)
Date: 2026-09-10
Commits reviewed: `378df65`, `4d89d5a`, `3fc3619`, `c7f70e9`, `fe44706`, `5820915`
(all on `main`)

## Method

Did not take the Engineer's self-test report at face value. Independently,
in `D:\dev\public-site` (the actual project directory, per this task's
constraints — not a separate clone, since `npm install` state and node
version pinning were already established there):

- read every file touched by the six commits in scope, not just the commit
  messages
- **deliberately broke** the required-props claim by editing
  `src/pages/index.astro` to omit `description`, ran `npm run typecheck`,
  confirmed a real compile error, then restored the file and re-confirmed
  clean typecheck
- ran `npm run typecheck` (`astro check`) and `npx tsc --noEmit -p
  tsconfig.json` independently
- built the site four separate times with different env var combinations
  (`SITE_ENV` unset, `SITE_ENV=preview`, `CF_PAGES_BRANCH=main`,
  `CF_PAGES_BRANCH=feature-x`) and read the resulting `robots.txt` and
  `sitemap-0.xml` directly from disk — not via the Playwright assertions,
  as a second independent channel
- read the rendered home page HTML directly (`grep` on the built
  `index.html`) to confirm the JSON-LD block, OG tags and canonical link
  exist as real output, not just as passing assertions
- diffed `tests/smoke.spec.ts` and `src/layouts/BaseLayout.astro` against
  their pre-Wave-2a state (`35efd4e`, the Wave 1 remediation commit) line by
  line to check for weakened or dropped assertions
- ran the full Playwright suite with `PW_PORT=4341` / `PW_PREVIEW_PORT=4342`
  per this task's instructions, **four times**, because the first three runs
  produced inconsistent results under real concurrent load from another
  agent on the same machine (see Finding 1)
- cross-checked `status/placeholder-content.md` against the actual page
  source files, entry by entry, for both completeness and byte-accuracy

No application or test files were left modified. No destructive or
irreversible git operations were performed.

---

## Finding 1 — Full suite is flaky under real concurrent machine load; not reproducible on the first three attempts

**Classification:** ENVIRONMENT (primary), with FLAKY_TEST as the observed
symptom · **Severity: Low for Wave 2a acceptance (the claim did reproduce),
Medium as a forward-risk note for Wave 3 CI capacity planning**

- **Scenario:** Engineer's self-test claim — "full Playwright suite: 96
  passed / 1 skipped / 0 failed."
- **Expected:** running `npm test` with the assigned ports on a machine with
  available resources reproduces this result.
- **Actual, run by run:**
  1. First run: **89 passed, 7 failed, 1 skipped.** Failures were Chromium/
     Firefox/WebKit crashes and timeouts — `JavaScript error: ... uncaught
     exception: out of memory`, `Test timeout of 30000ms exceeded while
     setting up "page"`, `worker process exited unexpectedly (code=
     3221226505...)` (a Windows access-violation exit code). Failures hit
     unrelated tests in unrelated browsers each time (a route-stub test in
     Chromium, a JSON-LD test in Firefox, a uniqueness test in WebKit) — the
     scattershot pattern of resource starvation, not a defect tied to
     specific functionality.
  2. Second run: crashed outright — `[low_level_alloc.cc]: RAW: Check
     new_pages != nullptr failed: VirtualAlloc failed` followed by `Error:
     spawn UNKNOWN` from Node's own child-process fork. This is Windows
     refusing to allocate memory / spawn a process, not an application bug.
  3. At the time of both failures, `tasklist` showed 20+ live `firefox.exe`
     processes and `wmic OS get FreePhysicalMemory` showed ~4.8–6.2 GB free
     out of 16.7 GB total — consistent with this task's own stated
     precondition that another agent was running tests concurrently on the
     same physical machine.
  4. Third run (after clearing an unrelated harness issue — Finding 2):
     **95 passed, 1 skipped, 1 failed** — a single WebKit failure, `Error:
     page.goto: Target page, context or browser has been closed`, again a
     browser-stability symptom, not a functional assertion failure.
  5. Fourth run: **96 passed, 1 skipped, 0 failed** — matches the Engineer's
     claim exactly, reproduced independently.
- **Why this is ENVIRONMENT, not PRODUCT_DEFECT or TEST_DEFECT:** every
  failure was a browser/process-level crash or resource exhaustion, never an
  assertion mismatch against actual page content. The set of failing tests
  changed between runs with no code changes in between, which is the
  signature of external resource contention, not a deterministic defect in
  the site or the test logic. A clean run reproduces the exact claimed
  result.
- **Evidence:** raw run output captured for all four attempts; `tasklist`
  and `wmic` output showing memory pressure at the time of failure.
- **Recommended action:** no change required to Wave 2a's implementation.
  For Wave 3 CI, note that this suite (4 browser projects, `fullyParallel:
  true`, `workers: undefined` locally) is memory-hungry; a GitHub Actions
  standard runner (7 GB RAM) running solo should be fine, but if CI ever
  runs multiple heavy jobs concurrently on self-hosted infrastructure, this
  failure mode will recur. Logged for Wave 3 awareness, not a blocker now —
  same treatment QA-001 gave its Finding 4.

---

## Finding 2 — `astro preview`'s lock file is not scoped by `PW_PREVIEW_PORT`; a crashed run blocks every subsequent run from the same working directory

**Classification:** TEST_DEFECT (automation/harness robustness gap) ·
**Severity: Medium — doesn't block Wave 2a's own acceptance, but undermines
commit `5820915`'s stated purpose and will recur during Wave 2b**

- **Scenario:** commit `5820915` ("test(config): make Playwright ports
  configurable and stop reusing servers") states its purpose is that
  "Wave 2b runs five page engineers in parallel, each in its own worktree
  ... `PW_PORT`/`PW_PREVIEW_PORT` override the defaults, so each agent gets
  its own pair," specifically to prevent one agent's tests running against
  another agent's server.
- **Expected:** two `npm test` invocations using different
  `PW_PREVIEW_PORT` values do not interfere with each other.
- **Actual:** after the crashed second run in Finding 1 (Node's own `spawn
  UNKNOWN` killed the Playwright runner before it could tear down its
  `astro preview` child process), every subsequent `npm test` — including
  one deliberately run on **different ports** (`4351`/`4352`, chosen
  specifically to test port isolation) — failed immediately with:
  ```
  [WebServer] Another astro preview server is already running.
  [WebServer]   URL:  http://localhost:4342
  [WebServer]   PID:  18784
  [WebServer] Run `astro preview stop` to stop it, or use `astro preview --force` to replace it.
  ```
  Reading `node_modules/astro/dist/core/dev/lockfile.js` directly confirms
  why: the lock file is `<project-root>/.astro/preview.json`, keyed on the
  **project root directory**, not the port. `astro preview`'s own
  concurrency guard has no awareness of `--port` at all. Changing
  `PW_PREVIEW_PORT` does not help — any second `astro preview` invocation
  from the same working directory refuses to start while a lock file from a
  (possibly dead) prior run exists, regardless of which port either one
  requested.
- **Why this matters for Wave 2b specifically:** the commit message's
  isolation guarantee holds *between separate git worktrees* (each has its
  own untracked `.astro/` directory), so five engineers in five worktrees
  are fine. But it does **not** hold for two processes sharing one working
  directory — which is exactly the situation this review ran in (this task
  explicitly directed the review to run against `D:\dev\public-site`
  itself, not an isolated clone, while another agent was concurrently
  active), and exactly the situation that reproduces after any non-graceful
  crash (OOM, a killed process, a lost SSH/RDP session) in that shared
  directory. This is the same failure *class* QA-001 Finding 1 documented —
  a webServer lifecycle assumption that silently breaks under real-world
  interruption — one layer down, in the newly-added `astro preview`
  webServer rather than `astro dev`.
- **Evidence:** the exact `[WebServer] Another astro preview server is
  already running` output above; `node_modules/astro/dist/core/dev/
  lockfile.js:5-7` (`getLockFileURL` keys on `root`, no port parameter
  anywhere in the lock read/write path).
- **Recovery used for this review:** `npx astro preview stop` cleanly
  killed the orphaned process and removed the lock, after which the suite
  ran normally (Finding 1's third and fourth runs). This is a documented
  Astro CLI command, not a workaround — but nothing in the current harness
  does this automatically, and a Tester/Engineer who doesn't know to run it
  would misdiagnose "another astro preview server is already running" as a
  mystery failure.
- **Recommended action:** Engineer to harden the `static-preview` webServer
  entry in `playwright.config.ts` — e.g. pass `--force` to the `astro
  preview` invocation (per the tool's own suggestion) so a stale lock from a
  crashed prior run is replaced rather than blocking, or add a pretest
  cleanup step. Do this before or alongside Wave 2b, since PLAN-001 assumes
  multiple engineers will have test runs in flight around the same time.
  Not performed by me — Tester does not modify implementation.

---

## Probe 1 — Required-props claim (SeoHead `title`/`description`)

**Result: CONFIRMED, holds under direct adversarial testing.**

I did not just read the TypeScript interface and trust it. I edited
`src/pages/index.astro` to remove the `description` prop from its
`<BaseLayout>` call and ran `npm run typecheck`:

```
src/pages/index.astro:7:2 - error ts(2322): Type '{ children: any[]; title: string; }' is not assignable to type 'IntrinsicAttributes & Props'.
  Property 'description' is missing in type '{ children: any[]; title: string; }' but required in type 'Props'.
```

This is a real, blocking compile-time error — not a lint warning, not
something that could ship silently. Restored the file and re-ran: back to
`0 errors, 0 warnings, 0 hints`. `npx tsc --noEmit -p tsconfig.json` also
exits clean independently of `astro check`.

This claim is the one QA-001's regression review flagged as the highest-
stakes claim to verify ("a claim of compile-time safety that does not hold
is a high-severity finding, because all five Wave 2b pages are about to
depend on it") and it holds.

Also confirmed via `git diff 35efd4e..HEAD -- src/layouts/BaseLayout.astro`:
before Wave 2a, `description` was **optional with a shared default**
(`'haroonie.ai — tech consulting.'`). Had that default survived into Wave 2b
unfixed, any page author who forgot to pass `description` would have
silently produced a duplicate, non-unique description — a direct R-4.1 AC1
violation with no compiler signal. Making it required is a genuine fix, not
cosmetic.

## Probe 2 — `SITE_ENV` / `CF_PAGES_BRANCH` robots.txt logic

**Result: CONFIRMED correct in the direction that matters.**

Built the site four times, reading `robots.txt` from disk directly (not
through the Playwright assertions) after each:

| Env vars | Result |
|---|---|
| none set | `Allow: /` + `Sitemap:` line (indexable) |
| `SITE_ENV=preview` | `Disallow: /` |
| `CF_PAGES_BRANCH=main` | `Allow: /` + `Sitemap:` line (indexable) |
| `CF_PAGES_BRANCH=feature-x` | `Disallow: /` |

All four match the documented logic exactly. Per this task's framing ("A
default that de-indexes production, or a preview build that is indexable,
is a serious defect — check which way the failure falls"): the failure mode
here is asymmetric by design, and correctly so — a *forgotten* env var
defaults to indexable/production, never to de-indexed. The residual risk is
the mirror case (a preview build that forgets to set `SITE_ENV` **and**
isn't built inside Cloudflare's own git integration, so `CF_PAGES_BRANCH` is
also absent, would be indexable) — but that is explicitly Wave 3's
responsibility per both the code comment and PLAN-001 ("Wave 3's CI is
responsible for actually setting `SITE_ENV`"), correctly out of scope here,
and correctly flagged by the Engineer as unverified against a real
deployment. One informational note for whoever writes Wave 3's CI: the
`SITE_ENV` comparison is a case-sensitive exact string match
(`!== 'production'`) — `SITE_ENV=Production` would incorrectly disallow.
Not a Wave 2a defect (no CI exists yet to get this wrong), but cheap to flag
now per the same logic as QA-001 Finding 4.

Also independently confirmed: sitemap lists exactly the 6 public routes in
canonical trailing-slash form and excludes `/404` (`grep`'d directly from
`sitemap-0.xml`, not via the test).

## Probe 3 — Wave 1 regression

**Result: CONFIRMED — no assertion weakened, broadened into vacuity, or
dropped.**

`git diff 35efd4e..HEAD -- tests/smoke.spec.ts` shows exactly one change:
the single-route nav "current page" test was replaced with a loop over all
6 routes, asserting both that the current route's link carries
`aria-current="page"` **and** that no other primary-nav link does, for
every page. This is strictly more assertions than before (Wave 1 checked
one page; Wave 2a checks six, plus the negative case). `tests/smoke.spec.ts`'s
route-stub test, footer test, 404 test, and skip-link test are byte-for-byte
unchanged. `src/pages/404.astro`'s only change is adding the now-required
`description` prop — its heading, body copy and "Return home" link are
unchanged, so R-2.6's test still exercises the same behavior it always did.

## Probe 4 — Placeholder register accuracy

**Result: CONFIRMED accurate and complete for Wave 2a's introduced scope.**

Cross-checked every row (P1–P8) in `status/placeholder-content.md` against
the live source files with a direct `grep` across `src/pages`. All six
per-page `description` strings (P1–P6) match the register's quoted values
verbatim. P7 (`og:image` default) matches `SeoHead.astro`'s
`ogImage = '/favicon.svg'` default. P8 (JSON-LD description) matches
`index.astro`'s `OrganizationSchema` usage verbatim. No placeholder value
introduced by this wave's diff was found un-logged. One minor observation,
not a defect: `404.astro`'s description ("The page you're looking for
doesn't exist or has moved.") isn't in the register, but it reads as
intentional final copy rather than a "ships in Wave 2" stub — it doesn't
reference REQ-001 or say "ships in Wave 2" the way every other placeholder
does — so its omission is defensible, not an inconsistency. Worth the
Business Analyst confirming this is intended as final 404 copy rather than
also placeholder, but not something I'm flagging as a QA defect.

## Probe 5 — Engineer-reported known gap

The Engineer reported the `SITE_ENV`/`CF_PAGES_BRANCH` switch as "not
verified against a real Cloudflare Pages preview deployment, because none
exists yet." **Correctly characterised.** I could not verify this further
either — there is no live deployment to check against, and PLAN-001
explicitly scopes that verification to Wave 3/4. No forward-risk beyond
what's already noted in Probe 2 above.

---

## What independently passed

| REQ-001 / PLAN-001 item | Result |
|---|---|
| R-4.1 AC1 (unique, non-empty title/description) | Pass — read directly from built HTML for all 6 pages, cross-checked uniqueness |
| R-4.1 AC2 (canonical link, production form) | Pass — verified in built HTML (`https://www.haroonie.ai/...` regardless of build host) |
| R-4.1 AC3 (OG title/description/type/url/image) | Pass — verified in built HTML |
| R-4.3 AC1 (home page JSON-LD, valid, Organization/ProfessionalService, name + URL) | Pass — parsed directly from built `index.html`, not just via test assertion |
| R-4.2 AC1 (sitemap lists every public page) | Pass — `sitemap-0.xml` read directly, 6 routes present, `/404` absent |
| R-4.2 AC2 (`robots.txt` references sitemap) | Pass |
| R-4.4 AC1 (preview not indexed, production indexed) | Pass — all 4 env-var combinations tested directly against built output |
| Required-props typecheck enforcement | Pass — adversarially confirmed, not just read |
| `astro check` (typecheck) | Pass — 0 errors, 0 warnings, 0 hints, clean |
| `tsc --noEmit` | Pass — clean |
| Wave 1 regression (R-2.6, R-2.7 AC1/AC2) | Pass — no assertion weakened; nav coverage strictly improved |
| Placeholder register completeness | Pass — accurate against source, no un-logged entries found |
| Full Playwright suite, clean run | Pass — 96 passed, 1 skipped, 0 failed, reproduced independently (4th attempt; see Finding 1 for why it took four) |

---

## Verdict

**Pass with findings.** Wave 2a's actual deliverable — `SeoHead.astro`,
`OrganizationSchema.astro`, the `BaseLayout` refactor, `robots.txt.ts`, and
the sitemap integration — is correctly implemented and independently
verified against R-2.7 and R-4.1–R-4.4's acceptance criteria, including the
one claim (compile-time-required props) that this task specifically flagged
as high-stakes. No Wave 1 assertion was weakened. The placeholder register
is accurate. Nothing here is a PRODUCT_DEFECT.

Two findings, both about the **test harness**, not the site:

- **Finding 1 (ENVIRONMENT/FLAKY_TEST, Low for this wave)** — the full
  suite is sensitive to real concurrent machine load; the claimed 96/1/0
  result is genuine and reproduces on a clean run, but took four attempts
  under this review's actual (shared-machine) conditions. No action needed
  now; logged for Wave 3 CI capacity awareness.
- **Finding 2 (TEST_DEFECT, Medium)** — `astro preview`'s lock file is
  keyed on the project root directory, not on `PW_PREVIEW_PORT`, so a
  non-graceful crash of the `static-preview` webServer blocks every
  subsequent `astro preview` invocation from the same working directory
  regardless of port, contradicting the isolation guarantee commit
  `5820915` states for concurrent agents. Should be hardened (`--force` or
  a cleanup step) before or alongside Wave 2b, which explicitly assumes
  multiple engineers will have test runs in flight concurrently.

Neither finding blocks Wave 2a's acceptance or Wave 2b from starting on top
of it — the shared layout, nav, and SEO plumbing itself is sound. Finding 2
should be remediated promptly given Wave 2b's parallel-engineer model makes
it more likely to recur, not less.

## Recommended next step

Hand Finding 2 to `@engineer` for remediation (small, well-diagnosed — a
`playwright.config.ts` change, same shape as QA-001's Finding 1 fix). No
regression re-run of Wave 2a is required before Wave 2b starts, since
Finding 2 doesn't touch the mechanism Wave 2b's five pages depend on
(required props, `BaseLayout` composition, `SeoHead`, sitemap/robots), only
the built-preview test project's crash recovery. Finding 1 requires no
action beyond the note logged here for Wave 3. Wave 2b may proceed.

---

## Remediation Report (Engineer, 2026-09-10)

Scope: Finding 2 only (the actionable one), plus the two cheap informational
notes the Tester raised in Probes 2 and 4. Finding 1 was explicitly "no
action required" per the Tester's own verdict and was not touched — no test
was weakened, retried, or given reduced browser coverage to paper over it.

### Finding 2 (TEST_DEFECT, Medium) — fixed, but not the way the Tester's
own recommendation literally proposed

Before changing anything, re-derived the mechanism from source rather than
trusting the Tester's or Astro's own error message at face value, per this
task's instructions:

- Read `node_modules/astro/dist/core/dev/lockfile.js`. Confirmed the lock
  key (`getLockFileURL` → `<root>/.astro/${command}.json`, no port) and,
  importantly, that Astro **already** self-heals a lock whose PID is
  verifiably dead: `checkExistingServer` → `isLockFileProcessAlive` calls
  `isProcessAlive(pid)` (a bare `process.kill(pid, 0)`) *before* it ever
  consults `find-proc`, and returns `false` immediately if that fails —
  removing the lock and proceeding normally. So a truly-dead PID was never
  actually the reproducing case.
- Reproduced the real failure directly, with no crash needed: started
  `astro preview --port 4362` in the foreground and **left it running**
  (simulating a prior test run's process that outlived its parent, exactly
  as Finding 2 describes — "Node's own `spawn UNKNOWN` killed the
  Playwright runner before it could tear down its `astro preview` child
  process"). From the same directory, `astro preview --port 4363` — a
  **different, completely free port** — was refused:
  ```
  Another astro preview server is already running.
    URL:  http://localhost:4362
    PID:  18492
  Run `astro preview stop` to stop it, or use `astro preview --force` to replace it.
  ```
  This confirms Finding 2's core claim exactly: the block is keyed on the
  root directory, not the port, and it fires even when the second port is
  entirely uncontended.
- Tested the Tester's own suggested primary remedy, `--force`, against that
  same live process: `astro preview --port 4363 --force` **still refused
  to start**, with the identical error. Reading
  `node_modules/astro/dist/cli/preview/index.js` (Astro 7.3.2) explains
  why: `--force` is never wired up for `astro preview` at all — only
  `astro dev --force` (`dist/cli/dev/index.js:146`) actually calls
  `killDevServer()`. The CLI's own error message advertises `--force` as a
  remedy for `preview`, but in this installed Astro version it is a dead
  flag for that command. Recommending it as-is would not have fixed
  anything — worth surfacing since it contradicts the tool's own help text.
- Considered whether `--force` (or an equivalent kill-based cleanup, e.g.
  always running `astro preview stop` first) would be safe to add anyway,
  in case a future Astro version wires it up for `preview` too, or as a
  belt-and-suspenders pretest step. Rejected deliberately, per this task's
  explicit constraint: `killDevServer`'s force-path kills whatever PID the
  lock names with no further verification. If two agents ever shared this
  working directory with two genuinely live preview servers — exactly the
  scenario this finding warns Wave 2b about — a blind `--force`/`stop`
  would silently kill the other agent's real, running server. The lock
  file's contents alone cannot distinguish "my own crashed run's orphan"
  from "someone else's legitimate concurrent server"; both look identical
  (alive PID, `astro`-shaped command line). Any fix that resolves the
  block by killing based on that information trades one isolation bug for
  a worse, silent one.
- Fixed instead with `astro preview`'s own `--ignore-lock` flag, appended
  to the `static-preview` webServer's command in `playwright.config.ts`.
  It makes this invocation start its own server on its own port **without
  ever reading or writing the lock file** — it cannot be blocked by
  someone else's lock, and, critically, it never inspects or signals any
  other PID, so it cannot kill anyone else's process by construction (not
  just "with a safety check" — the code path that could do so is never
  reached). Verified against the exact scenario above: with the live
  process still on 4362, `astro preview --port 4363 --ignore-lock`
  started cleanly; both instances served HTTP 200; the 4362 process's PID
  and lock entry were byte-for-byte unchanged afterwards.
- End-to-end verification through the actual harness, not just the raw
  CLI, using this task's assigned ports: built the site, started an
  orphaned `astro preview --port 4399` and **left it alive** (a stand-in
  for a crashed prior run on yet another port), confirmed the *unfixed*
  command (`astro preview --port 4362`, no `--ignore-lock`) is refused
  against that live orphan, then ran
  `PW_PORT=4361 PW_PREVIEW_PORT=4362 npx playwright test --project=static-preview`
  with the fix in place and the orphan still running: **12/12 passed**.
  Confirmed afterwards that the orphan (PID, port 4399, lock file) was
  completely untouched — killed it manually only as cleanup.
- Documented all of the above reasoning directly in
  `playwright.config.ts`'s comment for that webServer entry, in the same
  style as the existing QA-001-derived comments there, so the next person
  reading this file doesn't have to re-derive it.
- Residual risk carried forward, not fixed here, and said so in the code
  comment: since `--ignore-lock` never writes a lock either, repeated
  crashes will now accumulate untracked orphan `astro preview` processes
  over time instead of being blocked outright. That's a resource-hygiene
  concern worth Wave 3 CI awareness (same treatment as Finding 1), not a
  correctness regression — it's strictly better than the current total
  block, and it never reintroduces the cross-agent-kill hazard above.

**Self-inflicted issue caught and fixed during this remediation, not part
of Finding 2:** the two new SITE_ENV regression tests added below (Probe 2)
each spawn a real `astro build`. Running them in Playwright's default
parallel mode raced against each other and the existing SITE_ENV=preview
test on the shared `.astro/.prerender` build cache (`--outDir` only
redirects final output, not that intermediate cache), causing an
`ERR_MODULE_NOT_FOUND` on a chunk file one concurrent build had already
rewritten out from under another. Fixed by
`test.describe.configure({ mode: 'serial' })` on that describe block —
serializes only the three build-spawning tests against each other, not the
rest of the suite. Caught by actually running the new tests, not assumed
from reading them.

### Finding 1 (ENVIRONMENT/FLAKY_TEST, Low) — no action taken, per the
Tester's own recommendation

Not touched. No retry logic, no reduced browser matrix, no timeout
loosening was added anywhere in the suite. One robustness point considered
and rejected as unnecessary: capping `workers` locally to reduce memory
pressure. Rejected because the Tester's own Finding 1 already scoped this
as a Wave 3 CI capacity question, explicitly not something to act on now,
and because doing it unilaterally as "for good measure" would be
second-guessing a call CLAUDE.md assigns to the Tester's classification,
not the Engineer's judgment.

### Probe 2 (informational) — case-sensitive `SITE_ENV` comparison

Judged in-remit: one line in `src/pages/robots.txt.ts`, and it does not
touch the asymmetric failure direction the Tester specifically checked
(`isPreviewBuild` still falls through to `CF_PAGES_BRANCH` / the
production default whenever `SITE_ENV` is unset — that path is completely
unchanged). Changed the comparison to
`env.SITE_ENV.trim().toLowerCase() !== 'production'` so
`SITE_ENV=Production` (or a stray trailing space) resolves to indexable
instead of incorrectly de-indexing. Added three regression tests to
`tests/seo-preview.spec.ts`: `SITE_ENV=preview` still disallows (unchanged
behaviour), `SITE_ENV=Production` (mixed case) now allows, and
`SITE_ENV=staging` (an unrecognised value) still disallows — proving the
fix only widens what counts as "production," it doesn't loosen the safe
default in the other direction.

### Probe 4 (informational) — `404.astro`'s description string not in the
placeholder register

Not changed. The Tester correctly identified this as a Business Analyst
question, not an Engineer one: whether "The page you're looking for
doesn't exist or has moved." is intended as final copy or should be logged
in `status/placeholder-content.md` as a Wave 2/E6 stub. Deciding that
silently either way would be guessing at product intent, which CLAUDE.md
reserves for the Business Analyst. Flagging it here for that confirmation
rather than acting on it — this is the only item in this remediation that
still needs a human/BA decision; it does not block Wave 2b or this
remediation's own acceptance.

### Verification evidence

- `npm run typecheck` (astro check): 0 errors, 0 warnings, 0 hints.
- `npx tsc --noEmit -p tsconfig.json`: clean, no output.
- Stale/orphaned-lock reproduction against the real harness (see above):
  `static-preview` project, 12/12 passed with a live orphan on a different
  port present throughout.
- Full suite, `PW_PORT=4361 PW_PREVIEW_PORT=4362`, run twice from a clean
  port state: **98 passed, 1 skipped (the same documented WebKit tab-order
  case from Waves 1/2a, unchanged), 0 failed** — both times, identically.
  This is 2 more passing tests than Wave 2a's self-tested 96/1/0, entirely
  the two new SITE_ENV regression tests; no existing test was weakened,
  skipped, or had its assertions reduced.
- Confirmed clean teardown after each run: no `.astro/preview.json` left
  behind (expected — `--ignore-lock` never writes one) and no process left
  listening on either assigned port.

### Not attempted / explicitly out of scope for this remediation

- Did not touch the `dev` webServer entry's own `.astro/dev.json` lock.
  The same lock-key-is-root-not-port mechanism could theoretically affect
  it too, but Finding 2 only reported it for `static-preview`/`astro
  preview`, and QA-001 already hardened `astro dev`'s own background-daemon
  issue separately. Extending this fix there wasn't asked for and wasn't
  reproduced as a live problem — flagging it here as a latent question
  rather than silently fixing or silently ignoring it.
- Did not add any general "kill stale processes" hygiene job. The
  untracked-orphan accumulation risk noted above is real but was judged a
  Wave 3 CI concern, not something to solve unilaterally here.

### No blockers raised

This did not reach CLAUDE.md's three-repair-cycle threshold — the fix was
diagnosed from source and verified empirically in one cycle, matching Wave
1's and Wave 2a's own precedent of reading Astro's source rather than
trial-and-error.

**Recommendation:** ready for independent Tester regression re-verification
of Finding 2's fix. Per the Tester's own verdict above, this remediation
was not a precondition for Wave 2b starting; it closes the one finding that
was outstanding against the shared test harness.
