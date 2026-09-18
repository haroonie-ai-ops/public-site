# QA-003 — Independent Tester Review: Wave 3 (CI/CD Pipeline)

Status: Reviewed — **PASS WITH FINDINGS**, not yet acceptable for full Wave 3
exit (see Verdict). Nothing here blocks Wave 3 from continuing; E8 and the
owner's merge of PR #1 remain open exactly as already recorded.
Reviewed against: REQ-001-mvp-public-website.md R-6.1–R-6.7 (Approved);
PLAN-001-execution-waves.md §2 Wave 3 exit criteria
Reviewer: Tester (independent of Engineer)
Date: 2026-09-12
Artifacts reviewed: `.github/workflows/ci-cd.yml`,
`.github/workflows/bootstrap-pages-project.yml`, `package.json` (`lint`
script) — all on branch `wave-3-ci-cd-pipeline` (local worktree at
`.claude/worktrees/agent-a2afb7cd043f72dd4`, HEAD `d606ffc`, = PR #1 head
`5e0da1f`); `status/STATUS.md` on `main` (local HEAD `b4efc10` does not yet
carry the Wave 3 write-up — fetched Wave 3's actual STATUS.md content from
the `wave-3-ci-cd-pipeline` worktree instead, since local `main` is behind
`origin/main` per this task's own note. Recorded here so the discrepancy is
visible, not silently worked around.)

## Method

Did not take any STATUS.md claim, run-ID, or log excerpt at face value.
Independently:

- Listed every Actions run and PR on `haroonie-ai-ops/public-site` via the
  GitHub REST API (`curl` + PAT, never `git push`/`fetch`, never `gh`) and
  confirmed the full run/PR inventory matches what STATUS.md cites — **no
  additional runs exist** beyond the five listed (`34670431345`,
  `34670405376`, `34670392646`, `34620626345`, `34620416238`).
- Downloaded the raw job logs (not just job/step status) for the two runs
  that matter most — the real successful deploy (`34670405376`) and the
  deliberate gate-red proof (`34620626345`) — and read them directly.
- Fetched PR #1's actual posted comment via the API and diffed it
  character-for-character against STATUS.md's quoted text.
- Independently re-issued the two branch-protection/ruleset API calls E8
  cites, rather than trusting the recorded 403.
- Fetched the live preview deployment and its `robots.txt` directly with
  `curl`, not by re-reading STATUS.md's claim of having done so.
- Built the pinned commit twice from a clean `npm ci` and diffed the two
  `dist/` trees byte-for-byte for R-6.7.
- Reproduced QA-002 Finding 2's exact failure mode live (started a real
  orphaned `astro preview` process, confirmed a plain `astro preview`
  invocation on a different port is refused by it, then confirmed the
  shipped `--ignore-lock` fix passes with that orphan still alive and its
  PID/lock untouched afterward) — for Scope 2, but the same harness
  underpins every Wave 3 local check below.
- Probed the `cloudflare-api` OAuth MCP session myself, read-only, to check
  the E9 write-up's specific empirical claims — see Finding 4.
- Ran the full regression suite twice from a genuinely clean port state.

No application, workflow, or test file was modified. No write was made to
Cloudflare (all probes were GET). No git push/merge was attempted.

---

## Per-AC verdicts

| AC | Verdict | Evidence (mine) |
|---|---|---|
| **R-6.1 AC1** — install, build, lint, Playwright all execute | **PASS, with a naming caveat — see Finding 1** | Read raw logs of run `34670405376`: `npm ci` → `npm run lint` (`astro check && tsc --noEmit`, 0/0/0 on 19 files) → `npm run build` (7 routes + sitemap) → Playwright (`Running 99 tests using 1 worker`, `98 passed, 1 skipped`). All four steps genuinely executed and succeeded, in that order, on a real GitHub-hosted runner — not inferred from step names. |
| **R-6.1 AC2** — failing job reported, PR cannot be merged | **PARTIAL PASS (report) / FAIL (enforcement) — matches E8 exactly, independently reconfirmed** | Reporting: run `34620626345` shows `validate` genuinely failed (3 real Playwright failures, one per browser, on the deliberately-broken 404 assertion); PR #2 carried that red status. Enforcement: I independently called `GET /repos/haroonie-ai-ops/public-site/branches/main/protection` and `GET .../rulesets` myself — both returned `403 "Upgrade to GitHub Pro or make this repository public to enable this feature."`, identical to E8's recorded text. This is a genuine plan gate, confirmed by my own call, not a transcription of the Engineer's. Not a new finding — recorded here only to confirm E8 is accurate, per the task's instruction to verify rather than assume. |
| **R-6.2 AC1** — unique preview URL produced and reported on the PR | **PASS, independently verified live** | Fetched PR #1's comment via the API directly: id `5643169689`, from `github-actions[bot]`, body matches STATUS.md's quote character-for-character, including both URLs. `curl`'d both URLs myself: `https://2da3e3a2.haroonie-ai-public-site.pages.dev/` → `200`; alias `https://wave-3-ci-cd-pipeline.haroonie-ai-public-site.pages.dev/` → `200`. The deployment-specific hash (`2da3e3a2`) confirms uniqueness per deployment, not just per branch. |
| **R-6.2 AC2** — preview serves the branch's build, excluded from indexing | **PASS, independently verified live** | `curl https://2da3e3a2.haroonie-ai-public-site.pages.dev/robots.txt` myself → `200`, body exactly `User-agent: *` / `Disallow: /`. Same result on the alias URL. Fetched the root page and confirmed it is a real Astro-built page (title, canonical link, generator meta tag all present) — this is a live Cloudflare Pages deployment, not a stub. R-4.4's disallow mechanism (`SITE_ENV=preview`) is exercised for real here, not just unit-tested. |
| **R-6.3 AC1** — merge to `main` deploys to production | **UNPROVEN — correctly recorded as open, independently reconfirmed** | Called `GET /repos/haroonie-ai-ops/public-site/pulls/1` myself: `state: open`, `merged: false`. No push-to-`main` event has ever fired for this workflow (the run list contains zero `push` events). STATUS.md's own framing — that this needs the owner's merge — is accurate and this task explicitly instructs me not to merge it myself. |
| **R-6.3 AC2** — failing tests produce no deployment | **PASS for the mechanism that was actually tested; OVERSTATED for `deploy-production` specifically — see Finding 2** | The `needs: validate` skip genuinely fired for `deploy-preview` in the gate-red run (it runs on every PR when `validate` succeeds, and was skipped when `validate` failed — a real behavior change, not a tautology). But `deploy-production` was **already** going to show `conclusion: skipped` in that same run regardless of whether `validate` passed or failed, because its own `if: github.event_name == 'push' ...` guard excludes every `pull_request` event outright — I confirmed this by checking a **passing** PR run (`34670405376`), where `deploy-production` is *also* `skipped`, for the identical reason. See Finding 2. |
| **R-6.6 AC1** — scoped token from a repository secret | **PASS** | `ci-cd.yml` reads `${{ secrets.CLOUDFLARE_API_TOKEN }}` / `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` only; no literal value anywhere in the workflow file (I read it directly). |
| **R-6.6 AC2** — no secret value in CI logs | **PASS, verified from raw log text, not the YAML** | Downloaded and grepped the full raw logs of both `validate` and `deploy-preview` jobs from run `34670405376`. Every place a secret is consumed is masked by GitHub's own redaction: `CF_TOKEN: ***`, `CF_ACCOUNT: ***` in the credential-check step's env dump, `apiToken: ***` / `accountId: ***` in the `wrangler-action` step's `with:` dump, and the git checkout step's own bearer-token line prints `AUTHORIZATION: basic ***`. I did not print or otherwise attempt to read the two secrets' actual values at any point, consistent with this task's constraint. |
| **R-6.7 AC1** — reproducible build from locked deps + pinned Node | **PASS, independently reproduced, not just re-read** | On the exact `wave-3-ci-cd-pipeline` commit (`d606ffc`), with the installed toolchain at `node -v` → `24.21.0` (matches `.nvmrc` exactly), ran `npm ci && npm run build` twice in a row into separate output directories and diffed them recursively: **identical, byte-for-byte** (`diff -rq` reported no differences). `package-lock.json` is committed. CI itself uses `npm ci` (never `npm install`) and `actions/setup-node` with `node-version-file: '.nvmrc'`, both confirmed by reading the workflow directly. |

---

## Findings

### Finding 1 — "lint" is type-checking, not a linter; the AC's letter is satisfied, its likely intent is not fully

> **RESOLVED 2026-09-17 — owner decision. Verbatim:**
>
> > "QA-003 Finding 1 — 'lint' means type-checking, have @engineer add a
> > real linter now."
>
> The owner closed this ambiguity by choosing the substantive option: add a
> real linter, rather than amend R-6.1 AC1's wording to mean type-checking.
> The Tester's recommendation — that what mattered was a recorded decision
> rather than an assumption — is satisfied by this note plus the matching
> note on R-6.1 in `requirements/REQ-001-mvp-public-website.md`.
>
> **What was implemented.** ESLint 10 with `eslint-plugin-astro`,
> `typescript-eslint` (type-aware rules on `.ts`), and 31 accessibility
> rules via `eslint-plugin-jsx-a11y-x`, appended to `npm run lint`. The two
> `tsc --noEmit` passes and `astro check` are **retained unchanged** — the
> Tester's assessment that they catch real problems and genuinely gate the
> pipeline was accepted, so the linter is additive rather than a swap. All
> ESLint packages are devDependencies; the site still ships 0 bytes of its
> own JavaScript (R-5.2 AC2).
>
> **The finding's premise, confirmed empirically.** This review argued the
> type-check chain's substance was narrower than "lint" promises. That was
> measured rather than left as an argument: against a deliberate
> accessibility violation in an authored `.astro` file (an `<img>` with no
> `alt`, an `<a href="#">`), `tsc --noEmit` exits 0 silently and `astro
> check` reports 0 errors and 0 warnings, while `eslint .` reports 2 errors
> and `npm run lint` exits 1. The gap this finding described was real and is
> now closed.
>
> **What the first run found.** 12 problems across 5 files, none of which
> six waves of type-checking had any reason to surface: a literal U+200B
> ZERO WIDTH SPACE in an authored comment; five `async` test bodies with no
> `await` in them; four unsafe reads of an `any` escaping from
> `JSON.parse()` inside the R-4.3 structured-data assertions; and two
> `eslint-disable` directives written against rules this project had never
> enabled, which read as reviewed exceptions while suppressing nothing. All
> 12 were fixed at source. Nothing was blanket-disabled, no file-wide
> suppression was added, and no assertion was weakened (R-8.3 AC1). One
> rule, `no-await-in-loop`, was deliberately not enabled — it flags 18
> correct sequential `page.goto` sites — and that exclusion is recorded with
> its reason in `eslint.config.mjs` rather than left implicit.
>
> The Finding's original text is preserved unaltered below.

**Classification:** Requirements ambiguity (not a product, test, or automation defect) · **Severity: Low — informational, for the Business Analyst, not a blocker**

- **Scenario:** R-6.1 AC1 requires "install, build, lint and the Playwright suite" to all execute.
- **Expected (my independent reading of the AC's plain English):** "lint" ordinarily denotes static code-quality/style analysis — unused variables, import hygiene, accessibility or best-practice rules, formatting — distinct from type-checking.
- **Actual:** `package.json`'s `lint` script is `astro check && tsc --noEmit -p tsconfig.json`. I read the raw CI log directly: it runs, reports "0 errors, 0 warnings, 0 hints" across 19 files, and genuinely gates the pipeline (a real type error would fail this step and block both deploy jobs via `needs: validate`). There is no ESLint, Stylelint, or equivalent tool anywhere in the dependency tree (`package.json` devDependencies has no `eslint`).
- **My independent judgment (this task specifically asked for it):** the AC's *letter* is satisfied — a step literally named "lint" exists, executes, and genuinely gates the pipeline; it is not a no-op or a rename of an existing step for appearances. But its *substance* is narrower than what "lint" conventionally promises: `astro check`/`tsc` catch type errors and a handful of Astro-template diagnostics, not code-style, unused-import, or many accessibility-adjacent lint rules a dedicated linter would flag. I do not classify this as a defect, because REQ-001 does not specify a tool, and the Engineer's own commit message is transparent about the substitution ("no separate ESLint config exists yet ... this is the real static-analysis coverage the codebase has today, wired up rather than stubbed") — it is not hidden. But it is exactly the kind of interpretation gap CLAUDE.md's Tester role exists to surface rather than silently accept.
- **Recommended action:** Business Analyst to confirm whether R-6.1 AC1's "lint" is satisfied by type-checking alone, or whether the requirement intends a dedicated linter (e.g., ESLint via `eslint-plugin-astro`). Either answer is fine; what matters is that it's a recorded decision, not an assumption. Does not block Wave 3 exit either way — the step exists and gates real problems today.

### Finding 2 — R-6.3 AC2's evidence for `deploy-production` specifically is confounded, not proven; STATUS.md overstates it

**Classification:** Documentation overstatement (STATUS.md), not a product or automation defect — the underlying platform mechanism (`needs:` skip-on-failure) is sound and well-documented GitHub Actions behavior · **Severity: Medium — this is the single most load-bearing R-6.3 claim, and the record currently reads as stronger evidence than what was actually exercised**

- **Scenario:** STATUS.md's Wave 3 write-up states, of run `34620626345` (PR #2, deliberately broken): "`deploy-preview` and `deploy-production`: both **skipped**, because both are `needs: validate` and validate failed — no deployment was attempted against a red build. This is R-6.3 AC2's mechanism, **exercised for real**."
- **Expected, if that sentence is read literally:** the `validate`-failure is what caused `deploy-production` to skip in this specific run.
- **Actual, independently checked:** `deploy-production`'s `if:` condition is `github.event_name == 'push' && github.ref == 'refs/heads/main'`. PR #2's run was a `pull_request` event. I confirmed, by pulling the job list of a **passing** PR run (`34670405376`), that `deploy-production` is *also* reported `skipped` there — where `validate` succeeded. The event-type gate alone is sufficient to skip `deploy-production` on any PR, pass or fail; `needs: validate` never had an opportunity to be the operative cause in either observed run. In other words: I cannot distinguish, from any run that has actually happened, whether `deploy-production` skips on a failing `main`-push because of `needs: validate` or would skip anyway for an unrelated reason — because no `push`-to-`main` event, passing or failing, has ever triggered this workflow.
- **Why I am not calling this a PRODUCT_DEFECT:** GitHub Actions' `needs:` semantics (a dependent job is skipped when its dependency fails) are platform-level, deterministic, and documented — reading the YAML is sufficient to have high confidence the mechanism will work correctly once a real `push` to `main` occurs. I am not asserting R-6.3 AC2 is false. I am asserting the write-up's claim of having "exercised it for real" is not accurate for the `deploy-production` half specifically — only for `deploy-preview`, where the two observed runs (pass vs. fail) genuinely differ in that job's outcome for the reason claimed.
- **Evidence:** job lists for runs `34620626345` (gate-red, PR event) and `34670405376` (green, PR event) — `deploy-production` shows `conclusion: skipped` in **both**, with the job's own `if:` condition being the only thing that could explain the fail-run case (its dependency, `validate`, never even runs when the event-type gate already excludes the job). No `push` event exists anywhere in the five-run history.
- **Recommended action:** either (a) soften STATUS.md's wording for `deploy-production` to "unexercised for real; reasoned from GitHub Actions' documented `needs:` semantics, same as `deploy-preview`'s confirmed behavior," or (b) actually exercise it once, safely: push a commit with a deliberately failing test directly to a throwaway branch configured (temporarily, locally, never pushed as real `main`) to trigger the `push`-to-`main` path — this is exactly the kind of low-risk verification gap that's cheap to close before claiming R-6.3 AC2 fully proven. Not a blocker for Wave 3 continuing, but it should not be described as more thoroughly proven than it is going into acceptance.

### Finding 3 — The credential hard-fail path's negative case has an available, safe live test that was not used

**Classification:** Verification gap (automation defect / thoroughness), not a product defect — the code change itself is correct on inspection · **Severity: Low — residual risk is real but small, and a cheap mitigation exists**

- **Scenario:** the Engineer changed both deploy jobs' credential checks from a soft-skip to `::error:: + exit 1` on a missing secret, and explicitly did not verify the negative case live because doing so "would require removing a working secret from the repository."
- **My independent view, as this task asked for:** reasoning-without-observation is a reasonable interim stance here, and I agree removing the real `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` secrets to test this would be a disproportionate risk for a one-line `if [ -z ... ]` check. But it is not the only way to exercise the negative path safely. Two lower-risk options were available and neither was used:
  1. A throwaway branch/PR whose workflow copy references a **different, intentionally nonexistent** secret name (e.g., `secrets.CLOUDFLARE_API_TOKEN_DOES_NOT_EXIST`) instead of the real one — this exercises the exact `if [ -z "$CF_TOKEN" ]` / `::error::` / `exit 1` path on a real Actions runner without ever touching the real secrets, and the branch is deleted afterward (the same pattern already used for PR #2's gate-red proof).
  2. Simplest of all: the embedded bash snippet itself needs no GitHub Actions runner at all — `CF_TOKEN="" CF_ACCOUNT="x" bash -c '...'` locally reproduces the exact logic in seconds.
- I did not run either option myself — this task scoped my Cloudflare-side probing to reads only, and re-running CI workflows is Engineer/PM territory, not Tester's, per CLAUDE.md's role boundaries. I am flagging that the residual risk described ("reasoning-without-observation") was more avoidable than the write-up suggests.
- **Recommended action:** Engineer to run option 1 or 2 above (a few minutes of work) before Wave 3 is presented as fully closed on this point, or explicitly accept the residual risk in writing if not worth the effort. Does not block Wave 3 continuing.

### Finding 4 — E9's "corrected" root cause (read-only account-wide OAuth grant) is not fully supported by a read-only probe I ran that the write-up didn't include

**Classification:** UNKNOWN (diagnostic-accuracy gap in a closed escalation, not a live blocker — E9's actual *resolution* — bypassing OAuth via a real API token — works regardless of which explanation is correct) · **Severity: Low for Wave 3 (E9 is closed and its fix is independently proven to work), Medium as an accuracy note given CLAUDE.md's standard for recorded reasoning**

- **Scenario:** E9's corrected write-up concludes "the `cloudflare-api` OAuth MCP session is **read-only account-wide**," based on: `GET .../pages/projects` → 200, `POST .../pages/projects` → `10000`, and — the decisive control — `POST .../storage/kv/namespaces` (an unrelated product) → also `10000`.
- **Expected, if "read-only account-wide" is the correct explanation:** a **GET** (read) against any product, including the unrelated one used as the control, should succeed — only writes should fail with `10000`.
- **Actual, from my own read-only probes (all GET, no writes attempted, per this task's explicit constraint):**
  - `GET /accounts/{id}` → `200`
  - `GET /accounts/{id}/pages/projects` → `200` (I independently found both `haroonie-ai-public-site`, created `2026-09-12T03:28:29Z`, and the legacy `haroonie-bb8eb` — matches the write-up)
  - `GET /accounts/{id}/members` → `200`
  - `GET /accounts/{id}/roles` → `200`
  - `GET /accounts/{id}/storage/kv/namespaces` → **`10000: Authentication error`** (a read, not a write)
  - `GET /accounts/{id}/workers/scripts` → **`10000: Authentication error`**
  - `GET /accounts/{id}/r2/buckets` → **`10000: Authentication error`**
- **Why this matters:** a genuinely "read-only account-wide" grant predicts every one of those GETs should succeed. It does not: KV, Workers, and R2 fail on **read**, identically to how they fail on write, while Pages and core Account endpoints succeed on read. This pattern is more consistent with a **product-scoped** OAuth grant (Pages + Account/Members/Roles: granted, read-only; KV/Workers/R2: not granted at all, neither read nor write) than with an account-wide read/write split. The write-up's own control probe (comparing Pages-write to KV-write) could not have distinguished these two explanations, because it never tested a KV **read** — which is the one call that actually separates them, and which I ran independently.
- **What I am not claiming:** I am not saying the *original* hypothesis ("missing one Pages-specific write scope") was right either — Pages reads work fine, which is consistent with either theory. I am saying the specific written justification for ruling out product-scoping in favor of "account-wide" is incomplete, because the one test that would have settled it was never run, and when I ran it, the account-wide theory did not hold up cleanly.
- **Why this doesn't reopen E9 as a blocker:** the *resolution* used — a real Cloudflare API token in GitHub secrets, bypassing the OAuth MCP session entirely for CI purposes — works regardless of which explanation is correct, and I independently confirmed the Pages project it created (`haroonie-ai-public-site`) exists and is live. Nothing about this finding threatens Wave 3's actual deploy path.
- **Recommended action:** correct E9's write-up to either narrow the claim to "Pages and Account-level reads work, Pages writes and at least one unrelated product's reads and writes do not — consistent with a scoped grant, not confirmed as account-wide" — or, if the Engineer/PM wants the stronger "account-wide" claim to stand, run a GET against one more unrelated product to settle it either way. Low effort either way; not urgent since it's already a closed, non-blocking item.

---

## Known-open items — confirmed accurate, not re-litigated

- **E8** (branch protection / rulesets unavailable on GitHub Free for a private repo, blocking R-6.1 AC2's enforcement clause): independently reconfirmed via my own `GET .../branches/main/protection` and `GET .../rulesets` calls — both returned the identical 403 and message text STATUS.md records. This is the owner's decision to make (public repo / GitHub Pro / amend the AC); not something for me to resolve.
- **R-6.3 AC1** (merge to `main` → production deploy): independently confirmed unproven — PR #1 is open, unmerged (`GET .../pulls/1` → `state: open`, `merged: false`), and no `push` event to `main` has ever triggered this workflow. Per this task's explicit instruction, I did not merge PR #1 or push to `main`.

---

## What I could not verify, and why

- **R-6.3 AC1 and the true `deploy-production` skip-on-failure path (Finding 2):** both require a real push to `main`, which is the owner's action, explicitly out of my authority for this review.
- **The credential hard-fail path's negative case (Finding 3):** I did not trigger it myself — re-running CI with intentionally broken secret references is an Engineer-side change to the workflow, not a Tester read-only verification, so I recorded it as a gap rather than closing it myself.
- **The true scope of the `cloudflare-api` OAuth grant (Finding 4):** I ran enough read-only probes to show the "account-wide" characterization is incomplete, but did not exhaustively enumerate every Cloudflare product's read/write matrix — that would take many more calls for a question that doesn't currently block anything.
- **R-6.4/R-6.5** (post-deploy smoke, rollback): correctly out of Wave 3's scope per PLAN-001 (deferred to Wave 7); not reviewed here.

---

## Verdict

**Pass with findings.** Wave 3's actual delivered mechanism — the three-job workflow, the credential hygiene, the pinned/locked build, the real preview deploy, and the real gate-red proof — is independently verified and holds up under direct inspection of raw logs, live HTTP responses, and my own GitHub/Cloudflare API calls, not just a re-read of the Engineer's report. Where I reached the same conclusion as STATUS.md (R-6.1 AC1's steps genuinely execute; R-6.2 AC1/AC2 genuinely work against a live deployment; R-6.6 AC1/AC2 hold under raw-log inspection; R-6.7 is genuinely reproducible; E8 is a genuine plan gate), I reached it on my own evidence, gathered independently, not by trusting the write-up.

Four findings, none of which is a PRODUCT_DEFECT and none of which blocks Wave 3 from continuing:

- **Finding 2 (Medium)** is the one I'd most want the Engineer/PM to see before Wave 3 is called fully closed: STATUS.md currently claims R-6.3 AC2's mechanism was "exercised for real" for both deploy jobs, but only `deploy-preview`'s skip was actually caused by the thing being tested — `deploy-production`'s skip in every observed run is fully explained by an unrelated event-type gate that would have fired either way. The underlying GitHub Actions semantics are sound; the claim of having observed them for `deploy-production` specifically is not.
- **Finding 4 (Low/Medium)** revises a closed escalation's stated root cause without changing its outcome — E9's fix works either way, but "read-only account-wide" is not what my own read probes show.
- **Finding 1 (Low)** and **Finding 3 (Low)** are informational/thoroughness notes, already substantially self-disclosed by the Engineer's own commit messages.

**Recommendation on acceptance:** Wave 3 should **not** be marked fully Accepted yet, for reasons already correctly on record and independent of my findings above — R-6.1 AC2's enforcement half is blocked on an owner plan decision (E8), and R-6.3 AC1 needs the owner's merge of PR #1. Everything that **can** be verified without those two owner actions has been, by me, independently, and passes. Once the owner acts on E8 and merges PR #1, the remaining verification (a real production deploy, and ideally closing Finding 2's gap with a real or throwaway push-triggered run) should be quick.
