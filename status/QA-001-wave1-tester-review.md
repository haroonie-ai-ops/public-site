# QA-001 — Independent Tester Review: Wave 1 (Foundation)

Status: REMEDIATED — Wave 1 Accepted by Owner 2026-09-10; regression pass
below is post-acceptance verification, not a gate
Reviewed against: REQ-001-mvp-public-website.md (Approved), PLAN-001 Wave 1
exit criteria
Reviewer: Tester (independent of Engineer)
Date: 2026-09-10
Commits reviewed: `83794e4`..`e5a3965` (all 5 Wave 1 commits on `master`)

## Method

Did not take the Engineer's self-test report at face value. Independently:
- re-read REQ-001 R-1, R-2.6, R-2.7 against the actual committed files
- `git clone`d the repo into an isolated directory to reproduce "given a
  clean clone" literally, and ran `npm ci` (not `npm install`) as CI would
- ran `npm run build`, `npm run typecheck`, and `npm test` from that clean
  clone, independent of the working tree the Engineer built in
- additionally exercised the **built static output** via `npm run preview`,
  since Cloudflare Pages will serve static files, not `astro dev`'s server,
  and the Engineer's suite only ever ran against `dev`
- read `tests/smoke.spec.ts` line by line against the AC text, not just its
  pass/fail result

No application or test files were modified during this review.

---

## Finding 1 — `npm test` is not reproducible outside the Engineer's session

**Classification:** TEST_DEFECT (automation/harness configuration, not the
site itself) · **Severity: High — blocks Wave 3 (CI) entirely as configured**

- **Scenario:** R-1.3 AC1 — "Given a clean clone, When the dev server is
  started, Then every page in R-2 responds 200 on localhost." Verified by
  Playwright suite run against localhost.
- **Expected:** `npm test` starts its own dev server via
  `playwright.config.ts`'s `webServer` and passes, unassisted, on any machine
  with no prior state.
- **Actual:** On a genuinely clean port (no leftover process from an earlier
  manual `npm run dev`), `npm test` fails immediately:
  ```
  Error: Process from config.webServer exited early.
  ```
  **Root cause, confirmed:** Astro 7.2+ auto-detects an AI coding agent
  environment and silently runs `astro dev` in **background/daemon mode**
  (detaches, prints a status line, and the foreground process — the one
  Playwright's `webServer` is watching — exits immediately). Playwright
  interprets that exit as startup failure and aborts. This is a documented
  Astro behavior change (Astro 7.2 "Background dev server for AI coding
  agents"; see `docs.astro.build/en/guides/build-with-ai/#background-mode`),
  not an Astro bug and not flaky — it is deterministic given this run
  environment.
- **Why the Engineer's self-test didn't catch it:** the reported "32 passed,
  1 skipped, 0 failed" run happened in a working directory where an earlier
  interactive `npm run dev` had already left a background daemon listening
  on port 4321. Playwright's `reuseExistingServer` then silently reused that
  daemon instead of starting one itself, so the suite passed — but it passed
  *around* the broken startup path, not because the configured command is
  self-sufficient. I reproduced the original "exited early" failure myself
  by killing that lingering daemon and rerunning `npm test` in the
  now-genuinely-clean original working directory, then confirmed the fix
  below resolves it there too.
- **Evidence:**
  - Clean-clone failure: `npm test` → `Error: Process from config.webServer
    exited early.` (reproduced twice, including once after explicitly
    killing all node processes bound to :4321/:4322 first)
  - Fix verified: setting `ASTRO_DEV_BACKGROUND=0` in the environment before
    `npm test`, on a port confirmed clear via `netstat`, produces the same
    result the Engineer originally reported: **32 passed, 1 skipped, 0
    failed**, chromium/firefox/webkit.
- **Recommended action:** add `env: { ASTRO_DEV_BACKGROUND: '0' }` to the
  `webServer` block in `playwright.config.ts` so the fix travels with the
  suite regardless of who or what invokes it (local run, CI, another
  agent) — do not rely on callers to export the variable themselves. This
  must land before Wave 3 stands up GitHub Actions, since every CI runner is
  a clean environment with no lingering daemon to mask the defect; as
  configured today, R-6.1's test gate would fail on every single run.
- **Not in scope of this finding:** whether Astro's auto-background
  detection is desirable generally. It plausibly helps a human developer's
  own terminal; it is simply incompatible with Playwright's `webServer`
  contract unless disabled.

---

## Finding 2 — Default branch is `master`, not `main`

**Classification:** PRODUCT_DEFECT (deliverable does not conform to an
explicit, approved acceptance criterion) · **Severity: Medium — cheap now,
expensive later**

- **Scenario:** R-1.1 AC1 — "Given the working directory, When `git log` is
  run, Then a commit history exists with `main` as the default branch."
- **Expected:** default branch named `main`.
- **Actual:** `git symbolic-ref HEAD` → `refs/heads/master`. Confirmed via
  `git branch -a` on both the working directory and a fresh clone of it.
- **Evidence:** `git branch -a` output: `* master`.
- **Why it matters beyond a naming nitpick:** REQ-001 R-6.1 and R-6.3
  explicitly reference `main` ("pull request to `main`", "merge to `main`").
  If this isn't corrected before a GitHub remote exists (E3, still open),
  Wave 3's workflow YAML will either be written against the wrong branch
  name or someone will need to rename the default branch on GitHub after
  collaborators/PRs exist, which is disruptive. Right now — no remote, no
  PRs — is the cheapest point in the whole programme to fix this.
- **Recommended action:** `git branch -m master main` before any GitHub
  remote is added (E3). Not performed by me — Tester does not modify
  implementation; this is Engineer remediation work.

---

## Finding 3 — Nav test doesn't check what its name claims

**Classification:** TEST_DEFECT (coverage overclaim) · **Severity: Low**

- **Scenario:** the test titled "every page exposes Home, Services, About,
  Contact in the header" (`tests/smoke.spec.ts:21`).
- **Expected (per the test's own name):** the assertion runs against every
  page.
- **Actual:** it navigates to `/` once and checks the nav there; the other
  five routes are never visited by this test. In practice this is low-risk
  — `BaseLayout` is the single shared component all six pages import, so a
  regression would very likely show up on `/` too — but the automated
  evidence does not actually prove "every page," and the acceptance
  criteria are written per-page (R-2.7 AC1 says "Given any page..."). The
  route-stubs `describe` block two lines above already shows the correct
  pattern (loop over `allRoutes`).
- **Evidence:** `tests/smoke.spec.ts:20-30`.
- **Recommended action:** either loop this assertion over `allRoutes` the
  same way the "route stubs respond" block does, or rename the test to say
  what it actually checks ("the header nav renders on the home page"). Low
  priority — does not block Wave 1 acceptance, but should not be carried
  into Wave 2 as a pattern.

---

## Finding 4 — Non-trailing-slash paths 404 instead of canonicalizing (informational, not a Wave 1 defect)

**Classification:** UNKNOWN / forward risk, logged for Wave 4 ·
**Severity: informational**

- **Observed:** against the built static output (`npm run preview`),
  `GET /services` (no trailing slash) returns **404**, while `/services/`
  returns 200. `astro.config.mjs` sets `trailingSlash: 'always'`, which
  determines Astro's *own* canonical link generation but does not, by
  itself, make the static file server redirect the non-slash form — it
  simply has no file at that exact path.
- **Why this isn't a Wave 1 finding:** R-7.6 ("any in-scope path without a
  trailing slash resolves consistently to a single canonical form") is
  explicitly Cloudflare/hosting scope, assigned to Wave 4 in PLAN-001, and
  Wave 1 has no hosting layer to configure yet.
- **Why I'm logging it now anyway:** it's a real, confirmed behavior of the
  current build output, and it's cheap to record while fresh so Wave 4
  doesn't rediscover it from scratch. A visitor typing `haroonie.ai/services`
  without a trailing slash — a very plausible thing to type — will see a 404
  unless Wave 4 adds an explicit redirect (Cloudflare bulk redirect rule or
  a `_redirects` file) rather than relying on Astro alone.
- **Recommended action:** no action for Wave 1. Carry this into Wave 4's
  scope as a known requirement, not a surprise.

---

## What independently passed

Verified myself, not just accepted from the self-test report, all from a
clean `git clone` + `npm ci` unless noted:

| REQ-001 item | Result |
|---|---|
| R-1.1 (repo/branch exists) | Commit history present — **branch name fails, see Finding 2** |
| R-1.2 AC1 (clean-clone build, exit 0) | Pass — `npm ci && npm run build`, 7/7 routes |
| R-1.2 AC2 (Node version file + lockfile committed) | Pass — `.nvmrc`, `package-lock.json` present, `npm ci` succeeds from lockfile alone |
| R-1.3 AC1 (dev server serves every R-2 page 200) | Pass — but only once Finding 1 is fixed; see above |
| R-1.4 (no committed secrets) | Pass — grep scan of tracked files, `.env*` gitignored (note: R-1.4's "Verified by: secret scan in CI" is not literally satisfiable until Wave 3 exists; this is a manual approximation, not a gap in Wave 1) |
| R-2.6 (custom 404, HTTP 404 status) | Pass — verified against **both** `astro dev` and the built static `astro preview` output (the latter is what the Engineer's suite never exercised, and what Cloudflare Pages will actually serve) |
| R-2.7 AC1 (nav on every page, current-page indicated) | Pass in substance — aria-current logic is correct for all six routes (traced manually) — **test coverage gap noted in Finding 3** |
| R-2.7 AC2 (footer: company name, year, legal links) | Pass |
| astro check (typecheck) | Pass, 0 errors, clean clone |

---

## Verdict

Wave 1 is **not yet Accepted**. Findings 1 and 2 must be remediated before
this wave can close per CLAUDE.md's completion definition ("automated tests
pass" cannot honestly be claimed while the test command only passes by
accident of leftover local state; "acceptance criteria... mapped to tests"
cannot be claimed while R-1.1's explicit `main` requirement is unmet).
Finding 3 should be fixed but does not block acceptance. Finding 4 requires
no action now.

Per CLAUDE.md failure policy, this is remediation cycle 1 of the allowed 3
before this would need to be raised as a blocker — these are both small,
well-diagnosed fixes, not expected to need further cycles.

## Recommended next step

Hand back to `@engineer` for remediation of Findings 1–3, then re-run this
review (regression) before Wave 1 is marked Accepted in `status/STATUS.md`.

---

## Remediation Report (Engineer, 2026-09-10)

Commits: `35efd4e` (Findings 1 + 3), branch rename (Finding 2, ref-only, no
commit object). No application or test logic was changed beyond what each
finding specifically required.

### Finding 1 (HIGH) — fixed

`playwright.config.ts`'s `webServer` now sets `env: { ASTRO_DEV_BACKGROUND:
'0' }`, so the fix travels with the suite rather than depending on a caller
to export it. Verification, deliberately repeating the Tester's own method
rather than trusting the first green run:

1. Killed every process listening on :4321/:4322 first (`netstat` confirmed
   no LISTENING socket before starting).
2. Ran `npm test` **with no `ASTRO_DEV_BACKGROUND` exported manually** —
   proving the config-level fix, not an ambient env var, is what's doing the
   work. Result: 47 passed, 1 skipped, 0 failed.
3. Repeated in a **freshly cloned** copy of the repo (`git clone` from this
   working directory after the fix was committed), with `npm ci` (not
   `install`), port confirmed clear beforehand, no env var exported: build,
   typecheck, and the full three-browser suite all passed the same way in
   that clone too — this was the specific scenario in which the original
   defect reproduced 100% of the time, and it no longer does.

**One honest caveat, not swept under the rug:** a second, unrelated clone
attempt in this sandbox's `scratchpad` temp directory (a deeply nested path
under `AppData\Local\Temp`) hit `Error: Playwright Test did not expect
test.describe() to be called here` / `No tests found` — at config-load time,
before any server or browser involvement. This is **not** the defect this
finding is about (different error, different stage of execution), and it
reproduced identically in the Tester's own scratch clone during the original
review, never in this project's actual working directory. I did not chase it
further: it doesn't reproduce in the path that will actually become the
GitHub repository, and a GitHub Actions runner's checkout path looks nothing
like this sandbox's nested Temp/AppData structure. Flagging it here in case
it resurfaces once real CI exists, rather than asserting it's definitely
sandbox-only.

### Finding 2 (MEDIUM) — fixed

`git branch -m master main`. Confirmed via `git symbolic-ref HEAD` →
`refs/heads/main`, and via a fresh clone showing `remotes/origin/HEAD ->
origin/main`. Done before any GitHub remote exists (E3 still open), so
there's nothing downstream to reconcile.

### Finding 3 (LOW) — fixed

The nav test now loops over `allRoutes`, matching the pattern already used
by the route-stubs block. 6 route-parameterised nav checks now run per
browser instead of 1, which is why the totals below read 47/1 rather than
the original 32/1.

### Full regression, clean environment, all three browsers

```
47 passed, 1 skipped (documented WebKit tab-order behaviour, unchanged from
original review), 0 failed
```

`astro check`: 0 errors. `npm run build`: 7/7 routes. All from a state with
no pre-existing daemon and no manually exported environment variables —
exactly the condition that exposed Finding 1 in the first place.

**Recommendation:** ready for regression sign-off / acceptance.
