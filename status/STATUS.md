# Workstream Status — haroonie.ai Public Website

Last updated: 2026-09-12 — **QA-004 (Wave 2b independent Tester review)
Finding 1, PRODUCT_DEFECT/High, remediated.** Privacy, Terms, About, and all
three Services entries rendered internal program artifacts (a repository
file path, an internal role name, internal requirement/escalation IDs, and
process commentary such as "agent-drafted boilerplate pending review") into
visitor-facing copy; Contact's form intro and a raw HTML comment in its
markup carried a smaller instance of the same class of leak. All removed
from rendered output and relocated to frontmatter comments / this file's
placeholder register, which was updated in both directions to match. A new
regression test (`tests/seo-preview.spec.ts`) asserts the real built
`dist/` output for all six pages contains none of this class of artifact;
it was verified to fail against the pre-fix content before the fix landed.
See "QA-004 remediation (PRODUCT_DEFECT, High)" below for full detail.

Wave 2b (page content) was implemented and self-tested prior to this
remediation: content-collection architecture (R-2.8) plus Home, Services,
About, Contact (static), Privacy and Terms, with per-page R-5.1
accessibility scans. PR open against `origin/main`; CI and independent
Tester review (QA-004) both completed — QA-004 passed with the one High
finding remediated here. R-2.3 AC1 (owner-approved biography) remains
reported blocked on E6, not passing. See "Wave 2b — page content" below for
full detail. Wave 2a's QA-002 Finding 2 remediation and Wave 1 remain as
previously recorded (unchanged by this wave).

## Lifecycle position

Requirements → Planning → Implementation → Engineering self-test →
Independent QA review → Remediation → **Acceptance (Owner, 2026-09-10)** →
**Regression (Tester, 2026-09-10) — confirmed, no new defects** → Delivery

Owner accepted Wave 1 directly on the strength of the remediation evidence,
ahead of the Tester regression pass. The Tester then independently
re-verified all three code-level findings from a fresh clone — not a
re-print of the Engineer's numbers — and confirmed each holds: `main`
branch, the `ASTRO_DEV_BACKGROUND` fix, and the nav test's route coverage.
Full suite: 47 passed, 1 skipped, 0 failed. No new defects surfaced. Full
detail: `status/QA-001-wave1-tester-review.md` (Regression Pass section).

REQ-001 is Approved. PLAN-001 (execution waves) is drafted. Wave 1
(Foundation) has been implemented, self-tested, independently reviewed
(QA-001), and remediated. All findings addressed:

1. **High severity, fixed:** `npm test` was not actually reproducible
   outside the Engineer's original session — it only passed because a
   leftover background dev-server daemon happened to already be listening.
   Root cause: Astro 7.2+ auto-backgrounds `astro dev` for AI-agent
   environments, which broke Playwright's `webServer` contract. Fixed by
   setting `ASTRO_DEV_BACKGROUND=0` on the `webServer`'s own `env` in
   `playwright.config.ts`. Re-verified from a fresh clone with no env var
   manually exported and the port confirmed empty beforehand: 47 passed, 1
   skipped, 0 failed.
2. **Medium severity, fixed:** default branch renamed `master` → `main`
   (`git branch -m`), done before any GitHub remote exists.
3. **Low severity, fixed:** nav test now checks all six routes instead of
   only `/`.
4. **Informational (Wave 4 scope):** no action required yet — logged for
   when hosting/domain configuration starts.

Full detail and re-verification evidence:
`status/QA-001-wave1-tester-review.md` (Remediation Report section). One
honest open note there, not a blocker: a config-load-time error appeared in
this sandbox's nested Temp scratch-clone path specifically (never in the
actual project directory, and observed identically by both the Engineer and
the Tester independently) — flagged in case it resurfaces once real CI
exists, not asserted as resolved.

Wave 1 is Accepted and regression-confirmed. Closed.

## Wave 1 — verification evidence (post-remediation)

- `npm run typecheck` (astro check): 0 errors, 0 warnings — fresh clone
- `npm run build`: 7/7 routes generated (`/`, `/services/`, `/about/`,
  `/contact/`, `/privacy/`, `/terms/`, `/404.html`) — fresh clone, `npm ci`
- `npm test` (Playwright, Chromium + Firefox + WebKit): **47 passed, 1
  skipped** (documented WebKit tab-order behaviour), 0 failed — verified
  with no pre-existing daemon and no manually exported env vars
- Secret scan of tracked files: none found; `.env*` gitignored
- 7 commits on `main` (renamed from `master`): governance/spec docs, Astro
  scaffold + Node 24 LTS pin, shared layout + route stubs, Playwright
  harness, QA-001 review, remediation fixes

Environment note — **resolved 2026-09-11 by the owner.** This machine's
active `node` was previously v17.3.0, which Astro rejects outright
(`Node.js v17.3.0 is not supported`), so Wave 1 and Wave 2a build/test runs
invoked Node 24.21.0 directly via its nvm-managed path. The owner has since
switched nvm to 24.21.0, matching `.nvmrc` and `package.json`'s `engines`
pin. Verified on the current `main`: `astro check` 0/0/0, `tsc --noEmit`
clean, `npm run build` 7/7 routes, full Playwright suite **98 passed, 1
skipped, 0 failed**, and `npx wrangler` now resolves (4.131.1) where it
previously failed the engine check — all with no PATH override. Wave 3's CI
is unaffected either way, since `actions/setup-node` reads `.nvmrc`.

## Wave 2a — shared layout, nav, SEO plumbing (Engineer self-test, 2026-09-10)

Scope delivered per PLAN-001 §2 ("2a — sequential, must land first"):

1. **`src/components/SeoHead.astro`** — per-page `<head>` metadata (R-4.1).
   `title` and `description` are **required** props with no default value,
   so a Wave 2b page that omits either fails `astro check`/`tsc` at
   typecheck time rather than silently shipping an empty/duplicate tag.
   Emits `<title>`, `<meta name="description">`, `<link rel="canonical">`
   (computed from `Astro.site` + `Astro.url.pathname`), and full Open
   Graph + Twitter card tags (`ogType`/`ogImage` optional, default
   `'website'` / `/favicon.svg`).
2. **`src/components/OrganizationSchema.astro`** — JSON-LD structured data
   (R-4.3), type `Organization`/`ProfessionalService`. Only emits fields
   that are true today (real company name, real canonical URL, plus an
   optional description) — never invented address/contact/social data, per
   REQ-001 §1.3. Wired onto the Home page stub via a new `head` slot on
   `BaseLayout` so Wave 2b's Home engineer can extend it in place rather
   than re-plumbing it.
3. **`src/layouts/BaseLayout.astro`** — now composes `SeoHead` instead of
   inline title/meta tags; `Props` extends `SeoHead`'s `Props` so the
   required-field enforcement flows through automatically. Nav
   active-state (`aria-current="page"`) unchanged in logic, but the CSS
   indicator was strengthened to not rely on colour alone: current-page
   links now also get `font-weight: 600` **and** an underline, in addition
   to `aria-current` for assistive tech.
4. **`src/pages/robots.txt.ts`** + **`@astrojs/sitemap`** integration
   (R-4.2, R-4.4). Sitemap is generated automatically at build
   (`sitemap-index.xml` → `sitemap-0.xml`, all 6 public routes, 404
   excluded via the integration's `filter`). `robots.txt` is a prerendered
   endpoint that switches between "Allow all + link to sitemap" and
   "Disallow all" based on a `SITE_ENV` build-time env var (falling back to
   Cloudflare's own `CF_PAGES_BRANCH` if present, defaulting to
   production/indexable if neither is set — a forgotten env var can never
   accidentally de-index production). **This is the mechanism PLAN-001
   asks Wave 2a to build; Wave 3's CI is responsible for actually setting
   `SITE_ENV=preview` on PR-preview builds and `SITE_ENV=production` (or
   leaving it unset) on the `main` deploy build** — this project deploys
   via GitHub Actions (D-02), not Cloudflare's native Git integration, so
   `CF_PAGES_BRANCH` is not guaranteed to be present at build time.
5. All 7 existing route stubs (`/`, `/services/`, `/about/`, `/contact/`,
   `/privacy/`, `/terms/`, `/404`) updated with a required, unique
   `description` to satisfy the new prop contract — text is explicitly
   placeholder/stub-labelled, not final page copy (that's Wave 2b), and is
   logged in `status/placeholder-content.md` per PLAN-001 §4.
6. Playwright coverage added: `tests/seo.spec.ts` (per-page title/
   description/canonical/OG presence and cross-page uniqueness, R-4.1;
   home-page JSON-LD validity, R-4.3) against the dev server;
   `tests/seo-preview.spec.ts` (sitemap + robots.txt served correctly from
   the **built static output** via a second `astro preview` webServer —
   not the dev server, because QA-001/Wave 1 found real behavioural
   differences between the two; plus a standalone `SITE_ENV=preview` build
   asserting `Disallow: /`); `tests/smoke.spec.ts`'s nav active-state test
   was generalised from a single route to all 6, asserting exactly one nav
   link carries `aria-current` on every page.

### A second, distinct instance of QA-001 Finding 1's root cause

While wiring the built-preview Playwright project, `astro preview`
(**not** `astro dev`) also detached into a background daemon when run in
this environment, causing the same "Process from config.webServer exited
early" failure QA-001 diagnosed for `astro dev` in Wave 1. Root-caused by
reading `node_modules/astro/dist/cli/preview/index.js` directly rather than
guessing from the symptom: it is a **separate** auto-background check from
`dev`'s, gated on a **different** environment variable
(`ASTRO_PREVIEW_BACKGROUND`, not `ASTRO_DEV_BACKGROUND` — confirmed by
reading `dev/index.js` alongside it). Fixed the same way Wave 1 fixed
`dev`: `env: { ASTRO_PREVIEW_BACKGROUND: '0' }` on that `webServer` entry
in `playwright.config.ts`, so the fix travels with the suite. Verified by
running the full suite twice in a row from a genuinely clean port state
(no listening process on :4321/:4322 beforehand) with identical results
both times.

### Engineer self-test evidence

- `npm run typecheck` (astro check): **0 errors, 0 warnings, 0 hints** (19
  files) — confirms the required-prop enforcement compiles cleanly for
  every current caller, i.e. every stub was actually updated, not just the
  component.
- `npx tsc --noEmit -p tsconfig.json`: clean, no output — covers the new
  plain-`.ts` test files (`robots.txt.ts`, `seo-preview.spec.ts`) that
  `astro check` doesn't specifically target.
- `npm run build`: 7/7 routes + `sitemap-index.xml` + `sitemap-0.xml` +
  `robots.txt` generated. Manually inspected: sitemap lists exactly the 6
  public routes in canonical (`trailingSlash: always`) form, excludes
  `/404`; `robots.txt` defaults to `Allow: /` + a `Sitemap:` line;
  rebuilding with `SITE_ENV=preview` flips it to `Disallow: /`.
- `npm test` (Playwright, Chromium + Firefox + WebKit + a 4th
  `static-preview` chromium-only project against the built output): **96
  passed, 1 skipped** (the same documented WebKit tab-order case from Wave
  1, unchanged), **0 failed** — run twice from a clean port state
  (:4321/:4322 confirmed not listening beforehand each time), identical
  result both times. This is 49 more passing tests than Wave 1's 47,
  driven by the new SEO/preview specs and the nav test's route-loop
  expansion — no Wave 1 test was weakened, removed, or had its assertions
  reduced to get there.
- Secret scan of the diff (`git diff | grep -iE
  "api[_-]?key|secret|token|password|BEGIN .* PRIVATE KEY"`): no matches.

### Not attempted / explicitly out of scope for 2a

- No Home/Services/About/Contact/Privacy/Terms **page content** was
  written (headings, body copy, CTAs, form markup) — that is Wave 2b,
  assigned to separate parallel engineers per PLAN-001, starting now that
  2a is merged.
- The `SITE_ENV`/`CF_PAGES_BRANCH` robots.txt switch is verified by
  building locally with the env var set; it is **not** verified against a
  real Cloudflare Pages preview deployment, because none exists yet
  (Wave 3/4, blocked on E1-E3, E5). PLAN-001 explicitly scopes 2a to
  "make the mechanism exist now even though CI wires it later."

### No blockers raised

No issue in this wave reached the three-repair-cycle threshold in
CLAUDE.md's failure policy. The `ASTRO_PREVIEW_BACKGROUND` issue above was
diagnosed and fixed in a single cycle by reading Astro's own source rather
than trial-and-error.

## QA-002 remediation (Engineer, 2026-09-10)

Independent Tester review (`status/QA-002-wave2a-tester-review.md`) passed
Wave 2a's actual deliverable with two findings against the **test harness**,
not the site. Remediated:

1. **Finding 2 (TEST_DEFECT, Medium) — fixed.** `astro preview`'s
   concurrency lock is keyed on the project root directory, not on
   `--port`, so any live `astro preview` process in this working
   directory — including an orphan left behind by a crashed prior run —
   blocked every subsequent `astro preview` invocation regardless of port,
   contradicting commit `5820915`'s per-agent port-isolation guarantee.
   Reproduced directly (a live process on one port blocked a completely
   free different port, no crash needed to trigger it); the Tester's own
   suggested `--force` remedy was tested against that reproduction and
   found not to work at all in the installed Astro version (7.3.2) — it
   isn't wired up for `astro preview`, only `astro dev`. Fixed instead with
   `astro preview --ignore-lock` on the `static-preview` webServer entry in
   `playwright.config.ts`: it starts on its own port without ever reading
   or signalling any other process, so it cannot block on someone else's
   lock and — unlike `--force` — cannot kill another agent's genuinely
   running server either, by construction. Verified end-to-end through the
   real harness with `PW_PORT=4361`/`PW_PREVIEW_PORT=4362`: a live orphan
   left on a third port throughout, `static-preview` project 12/12 passed,
   orphan's PID and lock left byte-for-byte untouched. Full reasoning is in
   the `playwright.config.ts` comment and the Remediation Report section of
   `status/QA-002-wave2a-tester-review.md`.
2. **Finding 1 (ENVIRONMENT/FLAKY_TEST, Low) — no action taken**, per the
   Tester's own explicit recommendation (logged for Wave 3 CI capacity
   awareness only). No retry logic, timeout loosening, or reduced browser
   coverage was added anywhere.
3. **Probe 2 (informational) — fixed.** `src/pages/robots.txt.ts`'s
   `SITE_ENV` comparison is now case-insensitive and trimmed
   (`SITE_ENV=Production` no longer incorrectly de-indexes), without
   changing the asymmetric safe-default direction the Tester verified — an
   unset `SITE_ENV` still falls through to production/indexable. Three new
   regression tests added to `tests/seo-preview.spec.ts`.
4. **Probe 4 (informational) — flagged, not decided.** Whether
   `404.astro`'s description string is final copy or an unlogged
   placeholder is a Business Analyst call per CLAUDE.md's role boundaries,
   not an Engineer one. Not acted on either way; noted here for BA
   confirmation.

Full suite (`PW_PORT=4361 PW_PREVIEW_PORT=4362`), run twice from a clean
port state: **98 passed, 1 skipped, 0 failed** both times — 2 more passing
tests than Wave 2a's 96/1/0 (the new SITE_ENV regression tests), no
existing assertion weakened. `astro check` and `tsc --noEmit`: clean.

One self-inflicted issue caught and fixed during this remediation (not a
QA-002 finding): the two new SITE_ENV tests raced against each other and
the existing one on Astro's shared `.astro/.prerender` build cache when run
in parallel — fixed with `test.describe.configure({ mode: 'serial' })` on
that describe block. Found by actually running the new tests, not assumed.

**Recommendation:** ready for independent Tester regression re-verification
of Finding 2's fix. Per the Tester's own verdict, Wave 2b does not need to
wait on this remediation's sign-off — it was already cleared to proceed.

## Wave 2b — page content (Engineer, 2026-09-12)

Scope delivered per PLAN-001 §2 ("2b — parallel once 2a merges"), covering
REQ-001 R-2.1 through R-2.8 plus R-5.1 (accessibility) per page.

### Deviation from PLAN-001's parallel-engineer assignment (recorded per
instruction)

PLAN-001 §2 assigns Wave 2b's five pages to one engineer each, in parallel.
That assignment was overridden for this wave: R-2.8 requires all page copy
to originate from Markdown/content collections rather than hard-coded
markup, which makes the content-collection layer (`src/content.config.ts`
and everything under `src/content/`) a **shared scaffold every page
imports** — the same single-shared-file contention profile that made Wave
2a sequential (PLAN-001 §2: "touching them concurrently from multiple
branches is the single highest merge-contention risk in this project").
Building it in parallel across five branches would have hit exactly that
risk. Instead: the content architecture was built first (one commit), then
all five pages and their specs were built on top of it as normal
"editing a Markdown file" work, sequentially, by this Engineer. No
parallel-engineer contention occurred because there were no parallel
engineers this wave — a deliberate scope/process deviation, not a defect.

### Content architecture (R-2.8 AC1)

Astro content-layer collections (`src/content.config.ts`), each backed by
Markdown under `src/content/<collection>/` and a typed Zod schema:
`home`, `services`, `about`, `contact`, `legal` (privacy + terms), and a
small `pages` collection for the one page (Services) whose meta description
has no natural per-page singleton entry to live on. Every page under
`src/pages/` reads its copy — including `<meta name="description">` — from
these collections via `getEntry`/`getCollection` + the `render()` helper;
none of the six page files hard-code body copy. Proven directly (not just
asserted) by `tests/seo-preview.spec.ts`'s new "editing only a Markdown
content file changes the rendered page after a rebuild" test, which edits
`src/content/home/index.md`'s heading on disk, runs a real `astro build`,
asserts the new text appears in the built HTML, and restores the original
file in a `finally` block.

Each schema carries an optional `placeholder` boolean (default `false`),
independent of `status/placeholder-content.md` — see that file's header
note for the distinction. This structure is designed to accommodate the
out-of-scope Insights/blog collection later (REQ-001 §1.2) without
restructuring: a new collection can be added to `src/content.config.ts`
without touching any existing one.

### Pages built

1. **Home (R-2.1).** Single `<h1>` above the fold at both 1280x800 and
   390x844 (AC1); exactly one primary CTA (`ctaLabel` from content, distinct
   accessible name from the nav's own "Contact" link) linking to `/contact/`
   (AC2); a service-area summary paragraph with a link to `/services/`
   (AC3). Content: `src/content/home/index.md` (placeholder positioning
   copy — P1).
2. **Services (R-2.2).** Three entries (within the 2-6 range) from the
   `services` collection, each with an `<h2>` heading and Markdown-rendered
   description body (AC1); a CTA to `/contact/` (AC2). Content:
   `src/content/services/service-{1,2,3}.md` (placeholder — P9-P11).
3. **About (R-2.3).** Renders the `about` collection entry. **AC1 is
   reported BLOCKED ON E6, not passing** — see the dedicated section below.
4. **Contact (R-2.4).** Real, owner-supplied email (`dev@haroonie.ai`) as
   an actionable `mailto:` link, and the real booking URL
   (`https://www.haroonie.ai/booking`) as an actionable external link (AC1).
   Enquiry form markup only — name/email/message fields, each with a
   `<label for>` association, no `action`, no submit handler, disabled
   submit button (AC2). Wiring is explicitly out of scope (Wave 5, blocked
   on E4) and was not touched.
5. **Privacy + Terms (R-2.5).** Privacy states data collected, lawful
   basis, retention period, and the rights-exercise procedure (AC1) as four
   headed sections sourced from `src/content/legal/privacy.md`'s typed
   frontmatter fields. Footer links to both (AC2) were already wired in
   Wave 2a's `BaseLayout` and are unchanged. Both pages' policy *bodies* are
   agent-drafted boilerplate — logged as P13/P14, not marked
   `placeholder: true` in schema because neither invents a REQ-001 §1.3-
   banned fact, but still pending owner/legal sign-off before go-live.
6. **R-2.6 (404) / R-2.7 (nav/footer)** were verified still passing with
   the new page content in place — no change was needed to either; the
   existing `tests/smoke.spec.ts` suite (unmodified assertions) continues
   to pass against all six real pages.

### R-2.3 AC1 — explicitly blocked on E6, not weakened or marked passing

REQ-001 R-2.3 AC1: "owner-approved biography content … with no placeholder
markers." No owner-approved biography exists. The test-data table's
`Test biography.` is owner-entered test data, not supplied copy (per the
Project Manager's E6 assessment recorded in `main`'s local-only history at
this program's current point — not yet present on this `origin/main`-based
branch; see the repository-divergence note the owner recorded for this
wave), so it was not rendered as though it were real. Per
REQ-001 R-8.3, `tests/about.spec.ts` does not assert AC1 passes: it carries
a `test.fixme` documenting the exact assertion AC1 requires ("renders with
no placeholder markers"), plus one currently-passing test that honestly
asserts today's actual state (a heading, and the placeholder notice
visible). This is intentional so a future regression — the placeholder
disappearing without real content replacing it — is still caught, without
faking a pass. **Status: BLOCKED on E6.**

### R-5.1 accessibility (per page)

`@axe-core/playwright` added as a new devDependency (package.json/
package-lock.json — see the divergence note below on how this was done
against the *remote* package.json). `tests/accessibility.spec.ts` runs a
full axe-core scan against every route in the shared `tests/support/
routes.ts` fixture and asserts zero `serious`/`critical`-impact violations
(`tests/support/a11y.ts`), matching R-5.1 AC1's exact wording — moderate/
minor findings are not asserted on, which is a scope match, not a weakened
scan. Result: **zero serious/critical violations on all six pages.**

### Divergence handling (package.json/package-lock.json)

Per this wave's brief: local `main`'s `package.json` predates Wave 3's
`lint` script. Before adding `@axe-core/playwright`, the *remote*
`package.json` and `package-lock.json` (`origin/main` tip `f411480`) were
fetched via the GitHub API and used as the base — local `package.json` was
edited to add the `lint` script (matching remote) rather than risk
reverting it, then `npm install --save-dev @axe-core/playwright` was run
against that reconciled base. `npm run lint` (the real remote script:
`astro check && tsc --noEmit`) passes clean.

### Engineer self-test evidence

- `npm run lint` (`astro check && tsc --noEmit -p tsconfig.json`): **0
  errors, 0 warnings** (28 files; 32 informational "hints" — all a single
  upstream `'z' is deprecated` notice from `astro:content`'s re-export of
  zod v4 in this Astro/zod version combination, not something under this
  repo's control; hints do not fail `astro check`'s exit code, confirmed
  exit 0).
- `npm run build`: 7/7 routes generated, sitemap + robots.txt unchanged in
  shape. Manually inspected the built HTML for each new page (heading text,
  CTA hrefs, mailto/booking links, four privacy sections) — matches
  content-collection source.
- `npm test` (Playwright, `PW_PORT=4501 PW_PREVIEW_PORT=4502`, confirmed
  both ports free beforehand), run twice from a clean state: **207 passed,
  4 skipped, 0 failed** both times, identical. That is 109 more passing
  tests than the pre-Wave-2b baseline of 98 passed/1 skipped — no existing
  assertion was weakened, skipped, or deleted to get there. The 3 new
  skips are the `test.fixme` in `tests/about.spec.ts` (one per browser
  project), documented above as an intentional non-pass, not a defect.
- Two real defects found and fixed during self-test (not weakened around):
  `tests/accessibility.spec.ts` initially hit "Execution context was
  destroyed" against the dev server intermittently — fixed by waiting for
  `networkidle` before scanning, not by retrying blindly or narrowing the
  scan. `tests/contact.spec.ts`'s `getByLabel('Message')` initially matched
  two elements (the textarea and the surrounding `<section>`, whose
  `aria-labelledby` heading text "Send a message" contains the substring
  "message") — fixed with `{ exact: true }`, not by loosening the
  assertion to `.first()`.
- Secret scan of the diff (`git diff main -- . | grep -iE
  "api[_-]?key|secret|token|password|BEGIN .* PRIVATE KEY"`): no matches.

### Not attempted / explicitly out of scope for 2b

- No enquiry-form wiring, validation, or spam protection (R-3.1, Wave 5,
  blocked on E4) — the Contact form is markup only, as instructed.
- No changes to `.github/workflows/`, Wave 4 domain config, or any file
  outside this wave's page/content/test scope.
- `404.astro`'s description string was left untouched (QA-002 Probe 4 is
  still an open Business Analyst question, not resolved by this wave).

## QA-004 remediation (PRODUCT_DEFECT, High) — Engineer, 2026-09-12

Independent Tester review of Wave 2b (`status/QA-004-wave2b-tester-review.md`)
returned **PASS WITH FINDINGS**. Finding 1, classified **PRODUCT_DEFECT,
HIGH severity** by the Tester, is remediated here; that classification is
carried forward unchanged — not softened — per CLAUDE.md's completion
definition and REQ-001 R-8.3.

**The defect.** The rendered `/privacy/` and `/terms/` pages stated, to any
site visitor, that the policy had not undergone legal review and pointed
them at this repository's internal placeholder register
(`status/placeholder-content.md`); Terms additionally named an internal
role ("Project Manager") and an internal requirement ID. Confirmed live by
the Tester on the PR's actual Cloudflare Pages preview deployment, not just
locally. No test in the suite caught it.

**Why the original judgement missed it.** The Wave 2b self-test reasoned
that this copy was acceptable because it doesn't invent a REQ-001 §1.3-
banned fact (no fabricated client names, outcomes, etc.), so no
`PlaceholderNotice` banner was needed. That reasoning is correct on its own
terms but answers a different question than the one that matters:
§1.3 governs fabrication, not whether internal process commentary is fit
for a visitor to read. The same PR had already solved this correctly for
Home — its equivalent disclaimer is a Markdown-body HTML comment that the
Home page never renders (`Content` is never invoked for `home`'s body) — so
the technique to avoid this defect was known and used elsewhere in the same
PR, just not applied to Privacy/Terms.

**Sweep beyond the two named pages.** Per instruction, all six pages were
checked, not just the two the Tester named. Found and fixed the same class
of leak in:
- **About** (`src/content/about/index.md`) — an internal acceptance-
  criterion ID, an escalation ID, and this file path, rendered via
  `<Content />`.
- **Services** (`src/content/services/service-{1,2,3}.md`) — an internal
  requirement/escalation ID and this file path, rendered per entry via
  `<Content />`.
- **Contact** (`src/content/contact/index.md`'s `formIntro`, and a raw HTML
  comment in `src/pages/contact/index.astro`'s markup) — an internal
  requirement ID and wave number. Not a placeholder-register item (the
  underlying copy is real, not a placeholder), just leaked jargon in real
  copy's wording, and a comment placed in the wrong location (an HTML
  comment in an `.astro` file's markup region compiles straight into
  shipped HTML, unlike a `//` comment in its script frontmatter, which is
  discarded at compile time — the same mechanism that makes Home's pattern
  safe). This second location was found only by the new regression test
  (below) failing on `/contact/`, not by manual reading — direct evidence
  for why a test, not a one-time sweep, is what actually closes this class
  of defect.
- **`src/components/PlaceholderNotice.astro`** — the shared banner shown on
  Home/About/Services carried an internal requirement/wave reference in its
  visible text; trimmed to ordinary site language while keeping the
  "placeholder, not for production" signal intact.

**Fix.** Every internal reference (repository paths, role names, escalation
IDs, requirement/wave IDs, and phrases like "agent-drafted"/"boilerplate
pending") was removed from anything a page actually renders, and relocated
to YAML frontmatter comments in the source `.md` files (discarded by the
content-collection schema parser before any HTML is generated — never
reach output) or restated in `status/placeholder-content.md`, which was
updated in both directions (register-to-page and page-to-register) to
match the new wording. No fact was deleted, only relocated. Privacy and
Terms each also gained one ordinary, visitor-appropriate sentence
(e.g. "we may update this policy from time to time") in place of the
removed process commentary, per the Tester's own suggested remedy.

**Regression test added, and verified to fail first.** A new
`test.describe('no internal program artifacts in rendered page content
(QA-004 regression)')` block in `tests/seo-preview.spec.ts` reads the real
`dist/**/index.html` files produced by `astro build` (the `static-preview`
project's own build output — what Cloudflare Pages actually serves, not the
dev server) for all six routes, and asserts none contains a `status/` path,
a `*.md` reference, the role names "Project Manager"/"Business
Analyst"/"Tester", a "Wave `<n>` Engineer" byline, an `E1`–`E9` escalation
ID, or the phrases "agent-drafted", "boilerplate pending", or "placeholder
register". **Verified to fail before the fix**: run against an unmodified
checkout of the PR head (`d890e116`), it failed on 5 of 6 routes —
`/services/`, `/about/`, `/contact/` (`E4`, from the HTML-comment leak
above), `/privacy/`, and `/terms/` — with only `/` passing, matching exactly
the set of pages found to have this class of defect. After the fix, all 6
pass. This closes the Tester's central point: "no test in the suite catches
this."

**Verification.**
- `npm run lint` (`astro check && tsc --noEmit`): 0 errors, 0 warnings (28
  files; same 32 informational `zod`-deprecation hints as Wave 2b's
  self-test, not a regression).
- `npm run build`: 7/7 routes generated. Manually swept the entire `dist/`
  output with a broader pattern set than the automated test enforces
  (`REQ-001`, `Wave \d`, `status/`, `.md`, role names, `E1`-`E9`,
  "agent-drafted", "boilerplate", "placeholder register") — zero matches
  anywhere in built HTML.
- `npm test` (Playwright, `PW_PORT=4501 PW_PREVIEW_PORT=4502`, both ports
  confirmed free beforehand), run twice from a clean port state: **213
  passed, 4 skipped, 0 failed** both times, identical — 217 total (up from
  Wave 2b's 211), the 6 new regression tests accounting for the growth. The
  skip count is unchanged at 4 (the same `test.fixme` × 3 browsers plus the
  documented WebKit tab-order case) — no existing assertion was weakened,
  narrowed, or removed to get here.
- Also published to this branch, verbatim and byte-identical (round-trip
  diffed after publish): `status/QA-004-wave2b-tester-review.md` (the
  Tester's review this remediation responds to) and
  `status/PM-001-program-status-assessment.md` (a Project Manager program
  assessment that predates this remediation and was otherwise trapped on a
  diverged local `main` branch with no remote copy).

**Not attempted / out of scope for this remediation:** no change to
`.github/workflows/`, Wave 4 domain config, or Wave 5 form wiring; R-2.3
AC1 remains blocked on E6, not "fixed" by this pass; no existing test
weakened, skipped, or deleted.

## Wave status

| Wave | Description | Status | Blocked by |
|---|---|---|---|
| 0 | Owner actions | Open | Owner |
| 1 | Foundation (scaffold, toolchain, Playwright harness) | **Accepted (Owner) — regression-confirmed (Tester), closed** | Nothing |
| 2a | Shared layout, nav, SEO plumbing | **QA-002 passed with findings; Finding 2 remediated — awaiting Tester regression re-verification** | Nothing |
| 2b | Home/Services/About/Contact/Privacy/Terms page content | **QA-004 passed with one High finding (PRODUCT_DEFECT); remediated (213 passed, 4 skipped, 0 failed) — awaiting Tester regression re-verification** | R-2.3 AC1 blocked on E6 (biography); other pages' final copy sign-off also pending E6/owner review |
| 3 | CI/CD pipeline | Not started | Wave 1; verification blocked on E3, E5 |
| 4 | Domain and hosting configuration | Not started | Blocked on E1, E2 |
| 5 | Enquiry form completion | Not started | Wave 2b (Contact skeleton); blocked on E4 |
| 6 | Performance and cross-browser hardening | Not started | Wave 2 |
| 7 | Go-live and acceptance | Not started | Waves 3 + 4 + 6 |

## Open blockers (owner action required)

| ID | Item | Impact | Age |
|---|---|---|---|
| E1 | Cloudflare account + zone add for `haroonie.ai` | Blocks Wave 4 | New |
| E2 | Registrar nameserver delegation to Cloudflare | Blocks Wave 4 | New |
| E3 | GitHub repo under `haroonie-ai-ops` + secrets configured | **Repo half DONE** — `haroonie-ai-ops/public-site`, 26 commits pushed 2026-09-11, no longer local-only. Secrets half still open (needs E5's token value) | Partially resolved 2026-09-11 |
| E5 | Cloudflare API token — Account → Cloudflare Pages: Edit (CI only) | Blocks Wave 3 verification | Owner-actioned 2026-09-11, in progress |
| E4 | Transactional email credential | Blocks Wave 5 only; not a launch blocker | New |
| E6 | Copy: services, bio, legal entity/address, mailbox, booking URL | Blocks production sign-off on affected pages only; does not block any wave from starting | New |
| E8 | **R-6.1 AC2 is unimplementable as specified**: branch protection and rulesets are unavailable on private repos on GitHub Free. Owner must choose public repo, GitHub Pro, or an AC change | Blocks Wave 3 exit, not Wave 3 start | New 2026-09-11 |

No blocker halts the whole program. Waves 1, 2, 5 (once its precondition
lands), and 6 are fully executable today without any owner action beyond the
already-granted REQ-001 approval.

## Access and credentials (2026-09-11)

Owner created a GitHub PAT and Cloudflare API access; scopes were researched
and determined against the acceptance criteria that actually require them.
Recorded here because CLAUDE.md reserves credentials/access to the owner.

**Decisions (owner):** the remote repository lives under `haroonie-ai-ops`;
Wave 4 zone configuration goes through Cloudflare's OAuth MCP server rather
than a second stored token.

**GitHub — fine-grained PAT, scoped to the single repository.** Contents RW
(push), Metadata R (mandatory), **Workflows RW** (without it, pushing any
`.github/workflows/*.yml` is rejected outright), Actions RW (R-6.1 AC2), Pull
requests RW (R-6.1, R-6.2 AC1), Secrets RW (E3), **Administration RW**
(branch protection — R-6.1 AC2's "cannot be merged" is unimplementable
without it), Deployments RW (R-6.2 AC1). Issues RW optional.

**Cloudflare — one token only.** Account → Cloudflare Pages: Edit, stored as
a GitHub Actions secret alongside `CLOUDFLARE_ACCOUNT_ID`. Everything else
the deploy needs comes from Actions' built-in `GITHUB_TOKEN` with
`contents: read, deployments: write`. No DNS-capable secret is stored
anywhere — see PLAN-001's E5 scope correction for why that required a
decision rather than just a longer permission list.

**MCP wiring (`.mcp.json`, committed).** `github` (stdio, local binary,
toolsets limited to `repos,pull_requests,actions,issues`);
`cloudflare-docs` (read-only, unauthenticated); `cloudflare-api` (OAuth,
interactive consent). The PAT is supplied via a `GITHUB_PERSONAL_ACCESS_TOKEN`
environment variable — **never committed, and not stored in any tracked
file**.

**Findings from this work:**

1. The `github` MCP server's `CONNECTION_CLOSED` was almost certainly bare
   `"command": "github-mcp-server"` — Windows does not apply `PATHEXT` when
   the process is spawned without a shell, so the `.exe` never resolved. The
   binary itself is healthy (v1.12.1; a full stdio handshake succeeds). Now
   configured with an absolute path. Not yet confirmed in a live session.
2. The PAT was found in plaintext in `.claude/settings.local.json`.
   Containment was correct — gitignored, untracked, and the token prefix appears
   in zero commits on any branch — but it is unencrypted at rest and has been
   read into a model context, so it is being rotated and moved to an
   environment variable.
3. Wave 4's real Cloudflare permission surface was larger than PLAN-001's E5
   entry implied. Resolved by OAuth rather than by widening a stored token.

## E3 — remote established, program history pushed (2026-09-11)

`haroonie-ai-ops/public-site` (private, default branch `main`). All 26
commits pushed; `main` tracks `origin/main`. The program's history is no
longer single-copy on one workstation, which was the real exposure behind
E3 rather than just Wave 3's verification.

Push hygiene: the remote URL carries no credentials, the PAT was supplied
by a `credential.helper` reading the environment variable at runtime (never
on a command line, never written to `.git/config` — verified after the
push), and the full history was secret-scanned before first publish.

Permission side-effects confirmed by the push itself: **Contents write is
granted** (previously unprovable read-only). **Workflows write remains
unverified** — it can only be proven by pushing a `.github/workflows/*.yml`,
which Wave 3 will be the first to do. If that permission was missed, the
symptom is the *push* being rejected, not the workflow failing to run.

Still open on E3: the repository secrets (`CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`) cannot be set until the owner supplies E5's token
value. The `Secrets` permission needed to write them is verified granted.

## E8 — R-6.1 AC2 cannot be satisfied on the current GitHub plan (2026-09-11)

**Found while verifying the rotated PAT's granted permissions against the
requirements that need them.** Not a token problem — the token is correct.

R-6.1 AC2 states: "Given any failing job, When CI completes, Then the pull
request is reported as failing and **cannot be merged**." The "cannot be
merged" half needs a required status check, which needs branch protection or
a repository ruleset. Both return HTTP 403 on
`haroonie-ai-ops/public-site`:

    "Upgrade to GitHub Pro or make this repository public to enable this
     feature."

Confirmed as a **plan gate, not a permission gate**, by control: the same
token against a public repository's `/rulesets` endpoint returns 200. Branch
protection and rulesets are unavailable on private repositories on GitHub
Free.

Consequence if unresolved: CI can *report* a failing check on a PR (R-6.1
AC1 is fine), but nothing *enforces* it — a red PR stays mergeable. That
directly contradicts CLAUDE.md's requirement that tests gate delivery, which
is the stated rationale for design decision D-02.

**Owner decision required — three options:**

1. **Make the repository public.** Unlocks rulesets at no cost. The site's
   content is public by nature, but the repository also carries `status/`
   and `planning/` — program internals, QA findings and remediation history.
   Nothing secret (every commit has been secret-scanned), but internal.
2. **GitHub Pro** (~USD 4/month). Keeps the repository private and unlocks
   protection on private repos. Lowest-friction option that preserves both
   the requirement and privacy.
3. **Amend R-6.1 AC2** to "reported as failing" without the enforcement
   clause. This is a material requirement change: it is a Business Analyst
   and owner decision, not an Engineer one, and it weakens the delivery gate
   CLAUDE.md depends on. Recorded as an option, not recommended.

**Recommendation: option 2**, or option 1 if the repository being public is
acceptable. Either preserves the approved acceptance criterion as written.

**Does not block Wave 3 from starting.** The workflow YAML, the build, test
and deploy jobs, and preview deployments (R-6.2) are all implementable today
and unaffected. Only R-6.1 AC2's enforcement clause — and therefore Wave 3's
*exit* — depends on this.

**Also confirmed in the same pass (token is otherwise correct):** Metadata,
Actions, Secrets, Pull requests and Deployments all granted and verified by
live probe. Issues not granted — it was optional, no action needed.
`Administration` could not be verified either way, because the only
endpoints that would prove it are the plan-gated ones above. `Contents` and
`Workflows` write cannot be probed read-only; the first push will confirm
both.

## Recommended immediate next step

Wave 2a passed independent QA (QA-002) with no product defect; its one
actionable finding (Finding 2, the shared-directory `astro preview` lock)
is now remediated per the section above and awaiting Tester regression
re-verification of that specific fix. That re-verification does not gate
Wave 2b — the Tester's own QA-002 verdict already cleared Wave 2b to
proceed, since Finding 2 never touched the mechanism (required props,
`BaseLayout` composition, `SeoHead`, sitemap/robots) Wave 2b's five pages
depend on.

Wave 2b's five pages (Home, Services, About, Contact static portion,
Privacy+Terms) can proceed in parallel, one engineer each, each importing
`BaseLayout` and authoring their own Playwright spec alongside their page.
Real page copy depends on E6; structure and tests do not. One outstanding
question for the Business Analyst, not a blocker: whether `404.astro`'s
description string is intended as final copy or should be logged in
`status/placeholder-content.md` (QA-002 Probe 4).

In parallel, the owner can action E3+E5 (unlocks Wave 3) and E1+E2 (unlocks
Wave 4) — see PLAN-001 §6.
