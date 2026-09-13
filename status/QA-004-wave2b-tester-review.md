# QA-004 — Independent Tester Review, Wave 2b (Page Content)

Reviewer: Tester (independent of Engineer)
Date: 2026-09-12
Under review: PR #3, `haroonie-ai-ops/public-site`, branch `wave-2b-page-content`,
head `d890e1164b70069330ee5071939fd90a9ab946db`, base `f411480fdff238313dcd256a18d4a32ef86bc495`
(`origin/main` tip).

## Method note on provenance

The Engineer's local worktree (`.claude/worktrees/agent-aac8b4aaf3ffb8ac9`) was at
local commit `f06f2a3`, not the pushed PR head `d890e116` — same 7 commit
messages, different SHAs (commit-metadata divergence, not content). Before
relying on that worktree for local test runs, I independently verified content
identity by diffing four files (`tests/about.spec.ts`, `src/content.config.ts`,
`tests/support/a11y.ts`, `status/placeholder-content.md`, plus later
`tests/smoke.spec.ts`, `tests/seo.spec.ts`, `tests/support/routes.ts`,
`playwright.config.ts`, `package.json`) fetched raw from GitHub at the exact
PR head SHA against the worktree's copies — all byte-identical (mod CRLF).
All local test execution below is against that worktree, standing in
verifiably for the true PR head.

## Overall verdict: PASS WITH FINDINGS

The engineering (tests, architecture, CI mechanics, honesty about R-2.3 AC1)
is sound and independently verified. One real product defect was found that
the Engineer's self-test did not catch and no test in the suite detects. It
should block sign-off on the Privacy/Terms pages specifically, not the whole
wave — see Finding 1.

---

## Finding 1 — PRODUCT_DEFECT, HIGH severity

**Scenario:** Privacy Policy and Terms pages, as actually rendered and as
actually deployed to the PR's Cloudflare Pages preview.

**Expected:** Per REQ-001 §1.3 ("no placeholder may reach production") and
ordinary professional standards for a public legal page, the rendered
Privacy/Terms body should contain only the policy text itself — no internal
program artifacts, file paths, or role names.

**Actual:** The rendered `/privacy/` page's intro paragraph (sourced from
`src/content/legal/privacy.md`'s Markdown body, passed straight through
`<Content />`) reads, verbatim, to any site visitor:

> "It has not yet undergone a separate legal review — see
> `status/placeholder-content.md` for tracking."

The rendered `/terms/` page similarly states:

> "This is agent-drafted boilerplate pending owner/legal review before
> go-live sign-off — see `status/placeholder-content.md`. It does not state
> a registered legal entity name, company number or address, since those
> values are not yet owner-supplied (REQ-001 §4 lists only test data for
> this, per the Project Manager's E6 assessment)."

This is not a comment or frontmatter field — it is body prose rendered
through Astro's content `render()`/`<Content />` pipeline into the live
`<div class="intro">...</div>` / `<div class="body">...</div>` on the actual
page. It repository path (`status/placeholder-content.md`), an internal
role name ("Project Manager"), an internal requirement ID
("REQ-001 §4"), and an unambiguous admission that the policy has not had
legal review — all exposed to the public.

**Evidence:**
- Local build: `dist/privacy/index.html` and `dist/terms/index.html`
  contain the strings above inside the rendered `.intro`/`.body` divs
  (confirmed by extracting the raw HTML around those elements).
- Live confirmation against the PR's actual Cloudflare Pages preview
  deployment (`https://d52eba4f.haroonie-ai-public-site.pages.dev`):
  `curl .../privacy/` and `curl .../terms/` both contain the literal string
  `status/placeholder-content.md`; the Terms page also contains
  `Project Manager`. This is live on the artifact CI actually produced and
  reported on the PR, not just a local build quirk.
- By contrast, the Engineer *did* correctly suppress the equivalent
  disclaimer for Home (`src/content/home/index.md`) by putting it inside an
  HTML comment explicitly marked "This body content is not rendered on the
  page" — proving the technique to avoid this was known and used elsewhere
  in the same PR, just not applied to Privacy/Terms.
- No test in the suite catches this. `tests/legal.spec.ts` only asserts the
  four required sections are present and non-empty; it does not assert
  anything about disallowed internal-reference strings. `axe-core` does not
  check content semantics, so R-5.1's accessibility scan cannot catch it
  either.

**Why this isn't just "pending legal review, logged as P13/P14":** The
placeholder register (`status/placeholder-content.md`) correctly notes that
Privacy/Terms are pending owner/legal sign-off and doesn't invent any
REQ‑001 §1.3-banned fact (client names, outcomes, etc.) — that judgement is
sound as far as it goes. But it does not surface, and the Engineer's
STATUS.md write-up does not mention, that the pending-review disclaimer
itself leaked into the rendered page. This is a materially different
problem: a fact invented (§1.3's list) is not the only way public copy can be
unfit for production — "the page tells your visitors it hasn't been legal
reviewed and points them at your issue tracker" is exactly the kind of thing
an independent Tester exists to catch, and it was asserted more strongly by
the Engineer's framing ("does not invent any banned fact, so no
PlaceholderNotice banner is shown") than the evidence supports — that
framing addresses whether a banner should show, not whether the body text
itself is safe to ship.

**Recommended action:** Before this PR is accepted, strip the
process-disclosure sentences from `src/content/legal/privacy.md` and
`src/content/legal/terms.md`'s rendered bodies (move them into an
HTML-comment-only note the way Home did, or into `status/placeholder-content.md`
exclusively) and add a regression test asserting the rendered Privacy/Terms
pages contain no internal file paths (`status/`, `.md`) or process role
names. This does not require new copy from the owner — it is a
mechanical fix to stop leaking existing internal notes, separable from the
E6 legal-review gate that both pages already, correctly, remain blocked on.

**Severity rationale:** High, not Critical — it does not misstate a legal
fact per se (the text is honest, just misplaced), and it's caught before
production merge. But it is a real defect that would embarrass the company
and expose internal tooling details if this PR were merged and deployed as
the actual public Privacy/Terms pages, and it is live on the PR's own
preview URL today.

---

## Item-by-item findings

### 1. Skip count (1 → 4)

Verified by running the full suite twice locally (207 passed / 4 skipped / 0
failed both times) and by reading CI's own log for the PR head commit
(identical: `Running 211 tests using 1 worker` → `4 skipped`, `207 passed
(1.8m)`). Every skip individually identified by name via
`playwright test --reporter=list`:

- `[chromium] about.spec.ts:17 … renders with no placeholder markers — BLOCKED on E6` (fixme)
- `[firefox] about.spec.ts:17 … renders with no placeholder markers — BLOCKED on E6` (fixme)
- `[webkit] about.spec.ts:17 … renders with no placeholder markers — BLOCKED on E6` (fixme)
- `[webkit] smoke.spec.ts:85 … a skip link is the first focusable element` (documented Wave 1 WebKit tab-order case, `test.skip(browserName === 'webkit', ...)`)

A repo-wide grep for `skip(`/`fixme(` across every `tests/**/*.ts` file found
no other conditional or hidden skip. All 4 are accounted for and legitimate:
1 is the pre-existing, previously-reviewed Wave 1 WebKit case; 3 are the
single `test.fixme` in `about.spec.ts`, replicated once per browser project
(not 3 separate hidden skips). **Verdict: legitimate, not a green-washing
tactic.**

### 2. R-2.3 AC1 — About page

Confirmed genuine. `src/content/about/index.md` sets `placeholder: true` and
its body is an honest, explicit statement that no owner-approved biography
exists, referencing E6 and explaining why the REQ-001 §4 test-data string
(`Test biography.`) was deliberately not used as if it were real copy.
`src/pages/about/index.astro` renders exactly that content plus the
`PlaceholderNotice` banner — no fabricated biography anywhere. `tests/about.spec.ts`
correctly represents this: `test.fixme` documents the literal AC1 assertion
("no placeholder markers") without pretending it passes, and a second,
real, currently-passing test asserts today's actual honest state (heading +
visible placeholder notice) so a future silent regression would be caught.
This matches REQ-001 R-8.3 precisely. **Verdict: accurate, not weakened,
not quietly dropped.**

### 3. R-2.8 AC1 — Markdown-sourced copy proof

The test (`tests/seo-preview.spec.ts`, "editing only a Markdown content file
changes the rendered page after a rebuild") was independently verified
sound:
- It asserts `modified !== original` before running the build, so it cannot
  pass vacuously if the frontmatter regex ever stops matching.
- It uses a timestamped proof string (`R-2.8 proof heading ${Date.now()}`)
  and asserts that exact string appears in the built HTML — not merely "the
  page still renders."
- It restores the original file in a `finally` block. Verified directly:
  after running the full suite twice (which runs this test twice), `git
  status --short` on the worktree was clean both times — no residual edit
  to `src/content/home/index.md`.
- Runs a real `astro build` (via `execSync`) into a fresh temp `--outDir`
  each time, not a cached or mocked build.

Independently re-checked (not just trusting the PR description) that no
page `.astro` file hard-codes body copy: read all six page files
(`index.astro`, `services/index.astro`, `about/index.astro`,
`contact/index.astro`, `privacy/index.astro`, `terms/index.astro`) — every
one sources its content via `getEntry`/`getCollection` + `render()`. The
only literal strings in these files are structural chrome (section
headings like "What we do", "Get in touch directly", "Send a message",
button microcopy, and `<title>` strings), which the placeholder register
itself already classifies as structural rather than copy, consistent with
Wave 2a's precedent. **Verdict: the R-2.8 test does what it claims and
cannot pass vacuously; no `.astro` file hard-codes page copy.**

### 4. R-5.1 accessibility

`tests/support/a11y.ts` calls `new AxeBuilder({ page }).analyze()` with no
`.withRules()`, `.disableRules()`, `.include()`/`.exclude()` — the full
default rule set runs unmodified. Filtering to `serious`/`critical` impact
happens only as a post-hoc JS `.filter()` over the results, which is an
exact match to R-5.1 AC1's own wording ("zero violations of serious or
critical impact"), not a narrowed scan. `tests/accessibility.spec.ts`
iterates the shared `allRoutes` fixture (all 6 pages), and
`npx playwright test accessibility.spec.ts --list` confirms 18 real test
instances (6 routes × 3 browser projects) actually exist and execute — all
18 are part of the 207 passing tests in both local runs and in CI's own
log. **Verdict: a genuine, unnarrowed scan across all six pages, not a scan
that passes because it checks nothing.**

### 5. R-2.1 AC1 "above the fold"

`tests/home.spec.ts` asserts exactly one `<h1>`, `.toBeVisible()`, and
additionally reads `boundingBox()` and asserts `box.y < viewport.height` —
run at both 1280×800 and 390×844 as two separate, real test executions (not
one test run twice with the same result cached; the site's CSS uses
`clamp()`-based responsive type sizing, so the two viewports genuinely
render differently). `toBeVisible()` alone would not prove "above the
fold" (Playwright's visibility check does not require the element be within
the current scroll position), so the explicit `box.y` check is a real,
additional, viewport-size-sensitive assertion, not merely a presence check.
**Minor note, not a defect:** the check only verifies the top edge of the
heading is within the fold, not that the heading's full height fits; for a
single-line/short heading this is a reasonable proxy, but it would not catch
a heading whose bottom edge is clipped by the fold. Not worth blocking on,
but worth the Engineer's awareness if headings get taller.

### 6. Placeholder integrity

Cross-checked `status/placeholder-content.md` against rendered output
entry-by-entry, both directions:
- Every `placeholder: true` collection entry (Home P1, Services page-meta
  P2, About P3, Services entries P9–P11) is registered and its
  `PlaceholderNotice` banner is confirmed present in the built `dist/`
  output for exactly those pages (home, services, about) — not on Contact,
  which correctly has `placeholder: false` and no banner in `dist/contact/index.html`.
- REQ-001 §4's test-data strings — `Test;Test1;Test3`, `Test biography.`,
  `1123 Test St Chicago, IL1` — were grepped for across the entire
  worktree (not just `src/`) and appear **nowhere** in rendered output or
  page source; the only hits are in `requirements/REQ-001-...md` and the
  two status docs, which is expected and correct.
- The judgement call to treat `dev@haroonie.ai` and the booking URL as
  genuinely real/usable is reasonable on its own terms — they are concrete,
  owner-supplied facts (an email address, a URL), not descriptive business
  copy — and is independently testable (`tests/contact.spec.ts` asserts the
  literal `mailto:` and booking `href`), which the current site does
  correctly.
- The decision to log agent-drafted Privacy/Terms text as P13/P14 without
  `placeholder: true` is defensible on the "no §1.3-banned fact invented"
  test the register applies — **but see Finding 1 above**: that framing
  missed that the drafted text itself leaks internal references into the
  live page, which is a distinct and more serious problem than the
  register's framing accounts for.

### 7. No existing assertion weakened

Diffed every pre-existing test file against `f411480` (fetched raw via the
GitHub Contents API at the exact base SHA, compared with CRLF stripped to
rule out line-ending noise): `tests/smoke.spec.ts`, `tests/seo.spec.ts`,
`tests/support/routes.ts`, and `playwright.config.ts` are **byte-identical**
to base. `tests/seo-preview.spec.ts` (pre-existing, modified in this PR) has
its three original SITE_ENV/sitemap/robots tests unchanged in assertion
content — the only changes are an added `timeout: 60_000` on each
`execSync` call and one new test appended (the R-2.8 proof). `package.json`'s
only real change (again CRLF-diff-obscured, confirmed with a stripped diff)
is adding `@axe-core/playwright` as a devDependency. **Verdict: no Wave
1/2a/3 assertion was weakened, narrowed, or removed.**

### 8. Blanket R-2 clauses (nav reachability, no console errors, responsive 320–1920px)

- No console errors: `tests/responsive.spec.ts` registers real
  `page.on('console', ...)` (filtered to `type() === 'error'`) and
  `page.on('pageerror', ...)` listeners per route, asserting zero
  collected errors — a genuine runtime check, not assumed.
- Responsive 320–1920px: the same file asserts
  `document.documentElement.scrollWidth <= width + 1` at both 320px and
  1920px for every route in `allRoutes` (6 pages × 2 widths = 12 checks) —
  a real layout-overflow assertion, not a static claim.
- Nav reachability: pre-existing `tests/smoke.spec.ts` (confirmed
  byte-identical to base above) already asserts all four primary nav links
  are visible on every one of the 6 routes.

**Verdict: genuinely asserted, not assumed.**

### 9. CI state

Confirmed independently via the GitHub REST API (not `gh`, which is not
installed): runs on `wave-2b-page-content` are `7af45888ce` (run #7),
`72c21606a1` (run #8), and `34706213541` (run #9, head `d890e1164b` — the
exact PR head). All three show `status: completed`, `conclusion: success`.
Run #9's job steps were inspected individually: `Install, lint, build,
Playwright` — every step (`npm ci`, lint, build, browser install, "Run
Playwright suite") succeeded; `Deploy PR preview (Cloudflare Pages)`
succeeded and posted the preview URL comment on the PR;
`Deploy production (Cloudflare Pages)` correctly shows `conclusion: skipped`
(this is a PR, not a merge to `main` — correct, not a masked failure).
Downloaded run #9's raw job log directly and confirmed the Playwright
step's own console output: `Running 211 tests using 1 worker` → `4 skipped`
/ `207 passed (1.8m)` — an exact match to both of my independent local runs
(same 211 total, same 207/4/0 split). CI ran the genuine full suite, not a
subset. **Verdict: PR head is CI-confirmed green on real, matching
evidence, not "cannot plausibly break anything."**

### 10. The two "defensive fixes"

- **`execSync` timeout (60s) on all four build-spawning tests in
  `tests/seo-preview.spec.ts`:** Diffed the exact change — it adds
  `timeout: 60_000` to the `execSync` options and nothing else. It does not
  retry, does not catch/swallow a failure, and does not change what's
  asserted afterward; a build that genuinely hangs now fails loudly with a
  timeout error after 60s instead of hanging the whole CI job (previously
  reproduced at 25+ minutes per the Engineer's comment). **Sound: turns an
  unbounded hang into a bounded, honest failure.**
- **Dropping `networkidle` in favor of a scoped retry in
  `tests/support/a11y.ts`:** Diffed the exact commit
  (`ba44ac75be...72c21606a1`). The retry catches exactly one error
  signature (`context was destroyed` / `Execution context`) — a known,
  narrowly-scoped Vite/Astro dev-server artifact where HMR tears down the
  page context axe-core just attached to, unrelated to the page's actual
  accessibility. On any other error it re-throws immediately; it retries
  the scan itself exactly once, not the pass/fail assertion, and the
  assertion logic (filter to serious/critical, `toHaveLength(0)`) is
  unchanged and runs after the (possibly retried) scan completes. This does
  not mask a real defect — a genuine accessibility violation would still
  surface on the retried scan, since the retry only recovers from a
  destroyed execution context, not from a failing assertion. **Sound, with
  one minor maintainability note:** matching by substring on an error
  message is a little brittle against future axe-core/Playwright wording
  changes; not a correctness concern today.

---

## What I could not verify, and why

- **Whether CI's Cloudflare secrets/credentials are the owner's real
  production values** — out of scope for this Tester review and correctly
  not something an agent should inspect; taken on trust per CLAUDE.md's
  credentials boundary.
- **R-5.2/R-5.3 (performance budget, cross-browser hardening)** — out of
  Wave 2b's scope per PLAN-001 (Wave 6), not reviewed here.
- **Owner/legal sign-off on Privacy/Terms wording** — explicitly still
  pending per the placeholder register; not something a Tester can grant.
- **Whether the preview URL's Cloudflare Pages *branch alias* URL
  (`wave-2b-page-content.haroonie-ai-public-site.pages.dev`) behaves
  identically to the unique deployment URL** — only the unique deployment
  URL was checked directly; no reason to expect divergence, but not
  independently confirmed.

## Evidence artifacts

- Two full local Playwright runs against the verified-identical worktree
  content, clean port state each time (`PW_PORT=4501 PW_PREVIEW_PORT=4502`):
  **207 passed / 4 skipped / 0 failed**, both times, identical.
- `npm run lint` (astro check + tsc --noEmit): 0 errors, 0 warnings.
- `npm run build`: 7/7 routes.
- GitHub Actions run `34706213541` (run #9), job `103587163538`: full raw
  log downloaded and inspected; Playwright step reports `Running 211 tests
  using 1 worker`, `4 skipped`, `207 passed (1.8m)`.
- Live curl checks against the PR's actual Cloudflare Pages preview
  (`https://d52eba4f.haroonie-ai-public-site.pages.dev`): home, about,
  services, contact all serve Wave 2b content (verified heading text, CTA
  label, placeholder notice text, service entry headings, mailto link);
  `/robots.txt` returns `Disallow: /`; `/privacy/` and `/terms/` both
  confirmed to leak `status/placeholder-content.md` (Finding 1).

## Recommendation

**Pass with findings.** Do not block CI/merge mechanics — those are
genuinely green on real evidence. Route Finding 1 to the Engineer as a
required fix before Privacy/Terms are considered production-ready content
(separate from, and in addition to, the pre-existing E6 legal-review gate
both pages already carry). No other finding in this review rises above a
low-severity note (see items 5 and 10's maintainability comments). This
does not require weakening or reinterpreting any acceptance criterion.

---

# Regression Verification — QA-004 remediation (Tester, independent)

Reviewer: Tester (independent of Engineer and of the coordinating session).
Date: 2026-09-12/13.

**Commit pinned for this review:** `e64ac08e70475984290b4831225109f0cd68214b`
(current true `origin/main` tip at time of review — the "Merge pull request
#3" commit; base `f411480fdff238313dcd256a18d4a32ef86bc495`, PR head
`4dfd5127d0c239c91c75957e34fb333b16c36dda`). All content/test file evidence
below is against this commit unless stated otherwise. Fetched via the
GitHub REST API (`tarball`/`commits`/`pulls` endpoints), not via local
`git`, because local `main` is confirmed diverged/stale (its own commit
graph shares none of the SHAs below) and `git fetch`/`push` hang against
this remote from this sandbox. A second commit, `382273ac73` (CI run #16,
in progress at review time), landed on `main` mid-review: `ci(production):
temporarily gate production indexing behind E6`. Diffed it directly —
touches only `.github/workflows/ci-cd.yml` and adds one new, purely
additive test to `tests/seo-preview.spec.ts`; `src/` is byte-identical to
`e64ac08e`. This is the owner-directed `SITE_ENV=prelaunch` robots.txt
change flagged as in-flight and out of scope for this review — confirmed
correctly scoped, not assessed further, and **not** treated as a QA-004
regression per the task's own instruction.

## Verdict: QA-004 Finding 1 is CLOSED

The leak is gone from source, build, and live production, on independently
reconstructed and independently fetched evidence, not on the Engineer's or
coordinating session's say-so. One new finding (Finding 2 below) is raised
against the regression test's coverage — it does not reopen QA-004, but it
should be fixed before this class of defect is considered durably
prevented.

## Important correction to this task's own framing

The task described `6a6c290f76` as "the pre-remediation commit" to diff
test files against. **That is incorrect, and I did not rely on it as
pre-fix evidence.** Reconstructing the PR's actual commit sequence via the
GitHub API (`/pulls/3/commits`, chronological, parent-linked, timestamped):

```
...7af45888ce → 72c21606a1 → d890e1164b → 5cedd71955 → 84be5df387 →
   031cd1a693 → 6a54834d2ec → 6a6c290f76 → 4dfd5127d0 (PR head)
```

`5cedd71955` ("fix(content): remove internal program artifacts…") **is**
the remediation commit, landed 2026-09-12T17:43:40Z. `6a6c290f76`
("docs(pm): publish PM-001…") landed a minute later, 2026-09-12T17:44:39Z,
**four commits after** the fix — it is a docs-only commit essentially at
the PR's final pre-merge state, not pre-remediation. `src/` and `tests/` at
`6a6c290f76` are byte-identical to `5cedd71955` (`diff -rq` confirmed, zero
output). The actual pre-fix commit — the immediate parent of the fix, and
the exact SHA this review's own original Finding 1 cited as the PR head it
tested against — is `d890e1164b70069330ee5071939fd90a9ab946db`. I used
that commit, not `6a6c290f76`, to reconstruct pre-fix state below. I also
completed the literal instruction (diff test files against `6a6c290f76`
and against `f411480`) for completeness — see Item 4 — but flag that the
instruction's characterization of which commit is "pre-remediation" does
not hold up and should not be repeated in future status writing.

## Item 1 — Does the regression test actually work? Yes, independently reproduced.

Downloaded the real repo tarballs for `d890e1164b` (pre-fix) and
`5cedd71955` (fix) via `/repos/.../tarball/{sha}`, extracted both. `diff
-rq` between them: only `src/components/PlaceholderNotice.astro`, eight
content `.md` files (about, contact, legal/privacy, legal/terms,
pages/services, services/service-1/2/3), `src/pages/contact/index.astro`,
and `tests/seo-preview.spec.ts` differ — matches the claimed scope exactly.

Built a clean sandbox from the fix commit's tree (`npm ci`, 273 packages;
Playwright browsers already cached on this machine), confirming the new
test passes on the real fixed content (6/6 routes, static-preview project,
which runs `npm run build && npm run preview` as its own `webServer` — the
test cannot be reading a stale or cached `dist/`, since Playwright's own
webServer contract rebuilds it fresh every invocation).

Then, **without touching the test file**, overwrote only the nine
content/component/page files in the sandbox with their pre-fix (`d890e1164b`)
versions, deleted `dist/`, and reran just the QA-004 regression block:

```
5 failed
  /services/, /about/, /contact/, /privacy/, /terms/
1 passed
  /
```

Exact match, independently reproduced, to the claim "5 of 6 routes failed
against unmodified pre-fix content, only `/` passed." This is not vacuous:
it built real HTML from real pre-fix Markdown, matched real substrings in
it (e.g. `Error: /privacy/ built output must not contain repository path
reference (status/...) — found "status/placeholder-content.md"`), and
flipped to 6/6 passing the moment only the content files (not the test)
were restored to their fixed versions.

**The raw-HTML-comment-in-Contact claim, verified directly, not taken on
trust:** grepped the pre-fix build's `dist/contact/index.html` myself and
found the literal comment compiled straight into the shipped file:
`<!-- Markup only (R-2.4 AC2) — no `action`, `method` or submit handler.
Wiring is Wave 5 (R-3.1), blocked on E4. ... -->`, sitting inside
`<section class="contact-form">` right after the visible paragraph text.
Confirmed post-fix this exact string is absent from `dist/contact/index.html`
via `grep -o "<!--[^>]*-->"` → no matches. The claim that this is a
different, more serious leak mechanism than a frontmatter `//` comment
(which Astro's content-schema parser discards before any HTML exists) is
correct and independently verified, not just plausible-sounding.

## Item 2 — Finding 2 (NEW): the pattern list is fitted to the instances found, not adequate for the general class — TEST_DEFECT, Medium

**Scenario:** `tests/seo-preview.spec.ts`'s `BANNED_PATTERNS` array (10
patterns: `status/` paths, `.md` refs, four named roles, `E1`-`E9`,
three literal phrases) is the sole permanent guard against this entire
class of defect reaching production again.

**Expected:** per the test's own doc-comment ("the same class of leak…
was also present" in multiple places, found by a *sweep*, not by guessing
each exact string), a new instance of the *same class* — an internal
program-tracking reference leaking into visitor copy — should be caught
by this test, not just the specific strings that happened to leak this
time.

**Actual:** it is not. Starting from the **fixed** content (all nine files
restored to their `5cedd71955` versions, test unmodified), I injected five
small, realistic probes of the same defect class into otherwise-clean
copy, one per page:

| Page | Injected text | Caught? |
|---|---|---|
| `services/service-2.md` body | "See REQ-001 R-2.2 for scope." | No |
| `services/service-3.md` body | "Tracked for delivery in PLAN-001." | No |
| `about/index.md` body | "Escalated to the coordinating session for review." | No |
| `legal/privacy.md` body | "See PR #3 for revision history." | No |
| `contact/index.md` `formIntro` | "(Ref REQ-001 R-3.1.)" | No |

Rebuilt and reran the regression block: **6 passed**, all five probes
shipped verbatim into `dist/**/index.html` (confirmed by grepping the built
files directly — `REQ-001 R-2.2`, `PLAN-001`, `coordinating session`, `PR
#3`, and `REQ-001 R-3.1` all present in their respective built pages) and
none flagged. Every one of these is the same *class* of leak QA-004
describes in its own title (an internal program artifact reaching visitor
copy) — an internal requirement/AC ID, an internal plan-document name, a
reference to an internal actor, and a PR number are not meaningfully
different in kind from the file paths and escalation IDs the test does
check for; they are simply strings the pattern list doesn't happen to
include.

This is not a hypothetical gap: `status/STATUS.md`'s own remediation
write-up (the "Verification" subsection under the QA-004 entry) states the
Engineer's **manual** sweep of `dist/` used a *broader* pattern set than
what was encoded into the permanent test — explicitly including `REQ-001`
and `Wave \d` — and found zero matches at the time. That broader set was
never promoted into `BANNED_PATTERNS`. The one-time manual check was
wider than the thing left standing guard afterward.

**Why TEST_DEFECT, not PRODUCT_DEFECT:** nothing currently shipped is
affected — my five probes are synthetic and were reverted, not real
content, and live production plus the current `dist/` are independently
confirmed clean (Item 3). This is a coverage gap in the regression test
itself: the exact test whose stated purpose is to make sure this "closes
this class of defect" for good does not close the class, only the
instances.

**Severity: Medium.** Not High/Critical — today's ships are clean and this
doesn't reopen Finding 1. But it directly undercuts the stated rationale
for the fix ("this is what actually closes this class of defect... not a
one-time sweep"), and the failure mode is exactly the one QA-004 exists to
prevent: a future content edit reintroducing internal jargon would go
straight to production believing it's covered.

**Recommended action (not performed — Tester must not fix product/test
code without assignment):** extend `BANNED_PATTERNS` with, at minimum, an
internal requirement/AC ID pattern (`/\bREQ-\d{3}\b/`, `/\bR-\d+\.\d+\b/`),
an internal plan-document pattern (`/\bPLAN-\d{3}\b/`), and either a
denylist of internal-actor phrases ("coordinating session", "the
Engineer", "the Tester" as a phrase distinct from the existing bare-word
check, "the owner" in a process-commentary sense) or — more robustly — an
allowlist-based approach (a small vocabulary of internal program nouns
checked as a single combined regex, reviewed each time a new internal
noun is introduced in `CLAUDE.md`/`status/`) rather than continuing to
enumerate exact strings after each new leak is found by hand.

## Item 3 — Is the leak actually gone from source, build, and live production, all six routes? Yes.

**Source:** the QA-004-class process commentary was moved into YAML
frontmatter comments (discarded by Astro's content-collection schema
parser before any HTML exists — not merely hidden by CSS/JS) or deleted
outright, not suppressed at render time. Confirmed by reading the actual
diffs (see the file-by-file diff in this review's working notes; identical
in substance to the `status/placeholder-content.md` and `status/STATUS.md`
narrative) — nothing rendered was replaced with a client-side hide, a
`display:none`, or an HTML comment inside a template's markup region
(the one place that pattern was previously used, Contact, had the comment
removed entirely).

**Built output:** `dist/**/index.html` for all six routes, built fresh
from `e64ac08e`'s tree, grepped for the full original `BANNED_PATTERNS`
set: zero matches on all six.

**Live production:** `https://haroonie-ai-public-site.pages.dev/` (the
Cloudflare Pages production deployment; `www.haroonie.ai` does not resolve
from this sandbox — DNS/zone delegation is still open per E1/E2, unrelated
to this review) — fetched all six routes directly with `curl`, all `200`:
`/`, `/services/`, `/about/`, `/contact/`, `/privacy/`, `/terms/`. Grepped
each live response for the full `BANNED_PATTERNS` set and for the five
Item 2 probe-style patterns (`REQ-\d{3}`, `PLAN-\d{3}`, "coordinating
session", `PR #\d+`, `R-\d+\.\d+`): **zero matches on all six, on both
pattern sets.** `robots.txt` at review time still read `Allow: /` (the
`SITE_ENV=prelaunch` gate from the concurrent, unrelated `382273ac73` was
still landing — expected per the task's own note, not a QA-004 regression).
Also directly confirmed the Contact page's raw HTML comment is absent from
the live response (`grep -o "<!--[^>]*-->"` → no matches).

## Item 4 — Did the fix break anything? No product/content regression; one environmental (pre-existing) flake pattern reproduced, unrelated to this fix.

**Diffs against both named commits, as instructed** (with the correction
above noted): `f411480` (true original base) → `d890e1164b` (Wave 2b,
pre-QA-004) → `6a6c290f76` (== `5cedd71955` in `src`/`tests`, i.e. actually
post-fix). In every comparison, only `tests/seo-preview.spec.ts` changes
among test files; every other test file (`smoke.spec.ts`, `about.spec.ts`,
`accessibility.spec.ts`, `contact.spec.ts`, `home.spec.ts`, `legal.spec.ts`,
`responsive.spec.ts`, `services.spec.ts`, `support/a11y.ts`,
`support/routes.ts`, `playwright.config.ts`) is either absent at the older
commit (added whole, Wave 2b) or byte-identical across the commits it
exists at. Within `seo-preview.spec.ts`, `expect(` call count only grows
(18 at base → 21 pre-QA-004 → +1 new `describe` block with the QA-004
assertions after the fix) — never shrinks; no pre-existing assertion body
changed. Skip sources are unchanged: `about.spec.ts:17`'s `test.fixme`
(×3 browser projects) and `smoke.spec.ts:90`'s documented WebKit skip — 4
total, matching every count below.

**Local runs, this sandbox, clean port state each time, three full runs**
(not two — the first two were inconclusive on their own and needed a third
to separate signal from this machine's known noise, see below):

| Run | Ports | Result |
|---|---|---|
| 1 | 4701/4702 | 211 passed, **2 failed**, 4 skipped |
| 2 | 4703/4704 | 212 passed, **1 failed**, 4 skipped |
| 3 | 4705/4706 (after clearing orphaned `firefox.exe`) | **213 passed, 0 failed, 4 skipped** |

All three failures, across all three runs, were: (a) exclusively in the
`firefox` project, (b) exclusively in `tests/smoke.spec.ts` (pre-existing
Wave 1 route-stub/nav tests, untouched by this remediation — confirmed
byte-identical above), and (c) browser-crash-class errors — `worker
process exited unexpectedly (code=3221226505...)` (Windows
`STATUS_ACCESS_VIOLATION`), `Test timeout of 30000ms exceeded`, `Target
page, context or browser has been closed` — never an assertion mismatch
against page content, and never a failure inside `seo-preview.spec.ts`
(all 6 QA-004 regression assertions passed in all 3 runs, 18/18). At the
time of run 1/2's failures, `tasklist` showed 20+ live `firefox.exe`
processes and ~4.8GB free physical memory. This is not a new problem: it
is the exact signature — same error codes, same "scattershot, different
test each run, never a content assertion" pattern, same process-count/
memory profile — that this Tester documented and classified **ENVIRONMENT
(primary)/FLAKY_TEST (symptom)** in `status/QA-002-wave2a-tester-review.md`
Finding 1, on this same machine, unrelated to any code change at the time.
Classification here: **ENVIRONMENT, Low severity** — not a regression
from this fix.

**Independent corroboration from CI**, a different environment entirely
(dedicated GitHub Actions runner, `workers: 1`, no concurrent agent load):
downloaded the actual raw log for run **#15** (`e64ac08e`, the real
merge/production-deploying run) via the Actions API —
`Running 217 tests using 1 worker` → `4 skipped` → `213 passed (1.9m)`,
**0 failed, 0 retries logged**. This exactly matches local run 3 and the
Engineer's claimed figure, and confirms the local Firefox flakiness is a
property of this shared sandbox, not of the code or the gating pipeline.

**Verdict: no product or test regression.** 217 total (211 pre-fix + 6 new
QA-004 tests), 213 passed / 4 skipped / 0 failed is the real, reproducible
result on the actual gating CI and (once machine noise is cleared) locally
too.

## Item 5 — Content integrity after the Privacy/Terms rewrite: R-2.5 AC1 holds; no §1.3 fabrication

R-2.5 AC1 requires stating what data is collected, the lawful basis, the
retention period, and how to exercise data-subject rights. The fix touched
only the intro paragraph (privacy) and the closing paragraph (terms) —
`diff` confirms the four structured frontmatter fields
(`dataCollected`, `lawfulBasis`, `retentionPeriod`, `rightsProcedure`) are
**untouched** by this remediation. `src/pages/privacy/index.astro` still
destructures and renders all four into their own labeled `<section>`
(confirmed by reading the file directly), and `tests/legal.spec.ts`
(byte-identical pre/post fix) still asserts all four headings are present
with non-empty body text — passing in every run above. Live production's
`/privacy/` response contains all four section headings and their
original body text, unchanged.

No REQ-001 §1.3 fabrication was introduced by the rewrite. §1.3 bans
inventing "client names, testimonials, project outcomes, headcount,
revenue, certifications, or years of experience" — none of those appear
anywhere in either rewritten paragraph. Specifically checked for the
task's named risks: no legal entity name was invented (Terms' new closing
sentence explicitly states "these terms do not currently name a registered
legal entity, company number, or registered address" — a disclosure of
absence, not a fabrication); no address was invented; the retention-period
wording was not touched by this fix at all (it predates QA-004 and was not
in scope here). The rewrite removed process commentary and added two
short, generic, non-factual sentences ("we may update this policy from
time to time; the version published on this page is the one in effect" /
similar for Terms) — housekeeping boilerplate, not new substantive claims.

## Item 6 — Placeholder register accuracy, both directions: accurate

Cross-checked `status/placeholder-content.md` against actual content, both
directions, at `e64ac08e`:
- Every `placeholder: true` entry in `src/content/**` (`grep`'d directly:
  `about/index.md`, `home/index.md`, `pages/services.md`,
  `services/service-{1,2,3}.md` — six files) has exactly one open register
  row (P1, P3, P2, P9, P10, P11) — six rows, six files, one-to-one.
- `contact/index.md`, `legal/privacy.md`, `legal/terms.md` are
  `placeholder: false` and are still logged (P13, P14; Contact's
  `formIntro` correctly *not* logged as a placeholder row per the
  register's own stated rationale — it's real, accurate copy that merely
  had leaked jargon, a materially different problem the register text
  itself draws this distinction for).
- The register's own "QA-004 remediation" section names the exact same
  scope I independently found by diffing: About + all three Services
  entries (found by sweep, not by the original finding), Contact's
  `formIntro` and its raw HTML comment (found "only by the new regression
  test... not by manual reading" — consistent with my Item 1 reproduction
  showing `/contact/` was the one failure whose root cause was a template
  HTML comment rather than a content-file body). No discrepancy found in
  either direction.

## Summary of new findings from this regression pass

| # | Classification | Severity | Summary |
|---|---|---|---|
| Finding 2 | TEST_DEFECT | Medium | `BANNED_PATTERNS` in `tests/seo-preview.spec.ts` catches the specific strings QA-004 found, not the general class of "internal program artifact in visitor copy" it claims to guard against. Five synthetic same-class probes (REQ ID, plan-doc name, internal-actor phrase, PR number) all shipped to `dist/` undetected. Recommend broadening the pattern set (see Item 2) before treating this class of defect as durably closed. |
| (documentation) | — | Low | This task's framing of `6a6c290f76` as "the pre-remediation commit" is factually incorrect (it is 4 commits and ~1 minute after the actual fix commit `5cedd71955`, with identical `src`/`tests`). Recommend future status/PM writing cite `d890e1164b` (the fix's actual parent) when a pre-fix reference point is needed. |

Nothing above reopens QA-004 Finding 1. **QA-004 is CLOSED** on the
evidence in this section: the original leak is independently confirmed
absent from source, build, and live production across all six routes, the
regression test that guards it is real (not vacuous, reproduced failing
against genuine pre-fix content), the full suite shows no product or test
regression once this sandbox's pre-existing, previously-documented
Firefox/Windows resource contention is accounted for (and CI — the actual
gate — shows none of that noise at all), and the Privacy/Terms rewrite
introduced no new content-integrity problem. Finding 2 is a forward-looking
coverage gap in the regression test, not evidence that the fix itself is
incomplete or that anything currently shipped is non-compliant.
