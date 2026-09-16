# Workstream Status — haroonie.ai Public Website

Last updated: 2026-09-16 — **REQ-001-A2 drafted (DRAFT, not owner-approved):
CSP nonce via Cloudflare Pages Function, resolving QA-005.** QA-005 (raised
2026-09-16, own file: `status/QA-005-production-hostname-test-gap.md`)
found R-7.5 AC2 and R-5.3 AC1 **FAILING against the real production
hostname** `https://www.haroonie.ai/` — Cloudflare's Bot Fight Mode /
JavaScript Detections injects an inline script the static CSP correctly
blocks — even though PR #4 (R-7.5 static headers) and PR #5 (Wave 6
perf/cross-browser audit) both merged clean and green on 2026-09-15. This
is a **regression discovered in already-shipped work**, not a gap in
unstarted scope: neither PR's suites ever exercised the real proxied
hostname (QA-005 Finding 2, also High). The Business Analyst has drafted
`requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md` (Option B:
a Pages Function minting a per-request nonce) per the owner's first-hand
direction *"proceed with option B then hand off to @project-manager"* —
that instruction selects the direction only; the amendment's specific ACs,
its disclosed trust-dependency, and its fail-safe/drift rules remain
**DRAFT, pending owner approval**. New escalations **E14, E15, E16**
recorded below, continuing this document's own E-series from E13. See
`status/PM-004-program-status-assessment.md` for full sequencing, and
Section 7 of `planning/PLAN-001-execution-waves.md` for where this lands in
the plan (a revision to Wave 4/Wave 6's already-shipped scope, not a new
wave). Nothing else in this document is changed by this update; the
six-item 2026-09-15 correction below stands as written.

Prior update, 2026-09-15 — **Six corrections/additions, none of them code,
DNS, or a merge.** (1) The recurring "`git fetch`/`push` hang — a sandbox/
environment characteristic" narrative carried across PM-002, PM-003, and
QA-004's regression review is corrected: it is an **authentication
failure** (no stored credential; Git Credential Manager blocks on a
prompt nothing answers), not a transport or worktree-isolation
characteristic — see "Git fetch/push failure — corrected root cause"
below. (2) **E1 is now CLOSED, proven** (a working `CLOUDFLARE_ZONE_TOKEN`
confirms the `haroonie.ai` zone active on Cloudflare) — see "E1/E2 — DNS
delegation" below. (3) **E10 is upgraded from "does not appear to reach
zone resources" to proven non-functional for Wave 4**, and its three
owner options collapse to one now-viable path (a scoped zone token,
read-confirmed) — see "E10" below. (4) Two new owner items recorded:
`CLOUDFLARE_API_TOKEN`'s scope was never verified and cannot be verified
by any agent; `main` is unprotected while two red PRs sit mergeable,
which a peer session now assesses as **higher priority than E10** — see
the E8 and E10 sections below. (5) A real, unfixed **Wave 2b coverage
gap** is recorded: the custom 404 page has zero accessibility test
coverage — see "Wave 2b remediation — 404 accessibility coverage gap"
below. (6) The 6 local-only commits on local `main` are confirmed
byte-identical to `origin/main` content already published — duplicated
history, not lost work — see "Local `main` duplicate-history
reconciliation" below. R-2.3 AC1 remains blocked on E6, untouched by any
of the above; the `SITE_ENV=prelaunch` production gate is untouched.

Prior update, 2026-09-14 — **Domain facts recorded, proven separately from
inferred.** `haroonie.ai`'s nameserver delegation to Cloudflare (E2) is
CLOSED on direct public DNS evidence; zone existence on Cloudflare (E1)
is only INFERRED from that delegation, not independently confirmed — the
Cloudflare API's zone-listing endpoint returns an empty, ambiguous result
under this program's current access. A new escalation, **E10**, records
that PLAN-001's planned Wave 4 access path (Cloudflare's hosted OAuth MCP
server) does not appear to reach zone resources at all, let alone grant
the writes Wave 4 needs — three owner options are recorded, none chosen.
See "E1/E2 — DNS delegation" and "E10 — Wave 4's planned Cloudflare access
path is not viable" below. No Wave 4 work was started; this is
documentation only. **This paragraph's E1/E10 characterization is itself
now superseded — see the 2026-09-15 update above; left in place per this
document's own convention of correcting in place rather than rewriting.**

Prior update, 2026-09-13 — **This update reconciles integrity problems in
this document itself**, found by the Project Manager's PM-002 assessment:
Wave 3 was listed as "Not started" despite being implemented, independently
reviewed, remediated, and merged; Wave 3's narrative section was missing
entirely; and Wave 2a's status line was stale (its regression
re-verification had already happened, via QA-003). See "Wave 3 — CI/CD
pipeline" below (new section) and the corrected Wave status table.

**Current state, top to bottom:** Wave 2b is merged to `main` (commit
`e64ac08e`, owner-authorized) and live in production with three successful
production deploys since — see "Wave 2b merged and deployed to production"
below. Per a further owner decision (reasoning per the Project Manager's
PM-002 assessment, put to the owner directly), production is **temporarily
forced non-indexable** (`robots.txt: Disallow: /`) until real E6 copy
replaces the placeholder rows still open in `status/placeholder-content.md`
— see "Production non-indexable gate" below for the implementation and live
verification. **QA-004 Finding 1 is now independently Tester-verified
CLOSED** — the outstanding regression-verification note that previously
stood here is resolved; see "QA-004 independent regression verification"
below for the evidence. That same review raised a new **Finding 2
(TEST_DEFECT, Medium)** against the regression test's own coverage, since
remediated — same section. **R-2.3 AC1 (owner-approved biography) remains
blocked on E6, not passing**, throughout all of the above — none of this
work unblocks it, and the site ships with placeholder copy by design,
which is exactly why the non-indexable gate exists.

QA-004 (Wave 2b independent Tester review) Finding 1, **PRODUCT_DEFECT,
High**, was remediated 2026-09-12: Privacy, Terms, About, and all three
Services entries rendered internal program artifacts (a repository file
path, an internal role name, internal requirement/escalation IDs, and
process commentary such as "agent-drafted boilerplate pending review") into
visitor-facing copy; Contact's form intro and a raw HTML comment in its
markup carried a smaller instance of the same class of leak. All removed
from rendered output and relocated to frontmatter comments / this file's
placeholder register, which was updated in both directions to match. A new
regression test (`tests/seo-preview.spec.ts`) asserts the real built
`dist/` output for all six pages contains none of this class of artifact;
it was verified to fail against the pre-fix content before the fix landed.
See "QA-004 remediation (PRODUCT_DEFECT, High)" below for full detail.

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

## Wave 3 — CI/CD pipeline (reconciled into this document 2026-09-13)

**This section was missing from this document entirely until now** — found
by PM-002 and corrected here. Wave 3 itself was implemented, reviewed, and
merged well before this correction; only the write-up was absent.

**Scope delivered**, per PLAN-001 §2, REQ-001 R-6.1–R-6.7: `.github/workflows/ci-cd.yml`,
a three-job workflow (`validate` — install/lint/build/Playwright on every PR
and push; `deploy-preview` — PR-only, `SITE_ENV=preview`, reports the URL on
the PR; `deploy-production` — main-only, deploys to the Cloudflare Pages
production environment), plus `bootstrap-pages-project.yml` for one-time
project creation. Every third-party Action is pinned to a commit SHA;
`npm ci` against a committed lockfile; Node pinned via `.nvmrc`.

**Independent Tester review: `status/QA-003-wave3-tester-review.md`, PASS
WITH FINDINGS.** The Tester independently re-verified nearly every claim
against live evidence (raw CI logs, direct API calls to GitHub and
Cloudflare, a live preview deployment, a byte-for-byte reproducible-build
diff) rather than re-reading the Engineer's report. Four findings, **none
classified PRODUCT_DEFECT**:
- **Finding 1 (Low, informational):** `npm run lint` is `astro check &&
  tsc --noEmit`, not a dedicated linter (no ESLint in the dependency tree).
  R-6.1 AC1's letter is satisfied (a real, gating "lint" step exists); its
  conventional sense (style/unused-import rules) is narrower. Routed to the
  Business Analyst; not blocking.
- **Finding 2 (Medium) — since closed, see below.** STATUS.md's prior
  Wave 3 write-up (before this reconciliation) claimed R-6.3 AC2's
  `deploy-production` skip-on-failure was "exercised for real," but every
  run observed at review time was a `pull_request` event — `deploy-
  production`'s own `if: github.event_name == 'push' ...` guard, not
  `needs: validate`, fully explained every observed skip. The Tester's
  recommended fix (a real `push`-to-`main` event) has since happened: PR #1
  merged (below), and `deploy-production` genuinely executed rather than
  being skipped by the event-type guard.
- **Finding 3 (Low):** the credential hard-fail path's negative case
  (missing secret → `::error::` + `exit 1`) was verified by local repro of
  the exact bash logic, not by a live Actions run against a real missing
  secret (a disproportionate risk to test directly). Recommended a
  throwaway-secret-name branch as a safer live test; not done, not
  blocking.
- **Finding 4 (Low/Medium):** revises E9's closed diagnosis (why the
  `cloudflare-api` OAuth MCP session's writes failed) from "read-only
  account-wide" to "more consistent with a product-scoped grant" based on
  the Tester's own read-only probes (KV/Workers/R2 reads also failed, which
  an account-wide read/write split would not predict). E9's actual
  *resolution* (a real Cloudflare API token in CI secrets, bypassing OAuth
  entirely) is unaffected either way and independently confirmed working.

QA-003 explicitly recommended **not** marking Wave 3 fully Accepted until
(a) the owner acts on E8, and (b) the owner merges PR #1 — both were
already correctly recorded as open, independent of the findings above.

**PR #1 merged, closing Finding 2's gap.** Owner-authorized merge
("@engineer merge PR #1"), producing this workflow's first-ever
`push`-to-`main` event (run `34701592010`): `validate` green,
`deploy-production` **genuinely executed** (Check Cloudflare credentials →
Build with `SITE_ENV` unset → `wrangler deploy`, all succeeded, not
skipped), `deploy-preview` correctly skipped (not a `pull_request` event).
Live production verified directly at the time: `/` → 200, `robots.txt` →
200 with the indexable `Allow: /` + `Sitemap:` form, `sitemap-index.xml`
and `sitemap-0.xml` both 200 listing all 6 canonical routes. This is the
real, `push`-triggered evidence Finding 2 said was missing — `deploy-
production`'s `needs: validate` gating is now something that has actually
run against a passing build, not just something reasoned from the YAML.

**E8 — still open, unchanged.** Branch protection / rulesets return HTTP
403 ("Upgrade to GitHub Pro or make this repository public") on this
private GitHub Free repository, so R-6.1 AC2's enforcement half ("cannot be
merged") is still not implemented — see the dedicated E8 section below for
the three owner options. This is the one thing still standing between Wave
3 and a formal Accepted status; nothing else remains outstanding.

**Status: implemented, independently reviewed (QA-003, pass with findings,
zero PRODUCT_DEFECT), PR #1 merged, three separate production deploys
succeeded since (runs `34701592010`, `34731668961`, `34732487729`). Not
yet formally marked Accepted, pending E8's owner decision.**

## Wave 2b merged and deployed to production (2026-09-13)

**Merge.** PR #3 was merged by the coordinating session, which received the
merge instruction directly from the owner ("@engineer proceed with Merge
PR #3 — ships Wave 2b to production"). This Engineer session had separately
received the same instruction second-hand (relayed through an intermediate
agent) and correctly declined to act on it, per the escalation recorded
below — that escalation was not overruled; the coordinating session merged
using its own first-hand instruction instead. Merged at head `4dfd5127`
(this Engineer's last QA-004 remediation commit) producing merge commit
`e64ac08e`, with CI run `34706213541`-lineage's final descendant — run
`34731668961` (run #15) — green on that exact merge commit:
`validate` success, `deploy-production` success (executed, not skipped),
`deploy-preview` correctly skipped (push event).

**Live production verification (independently re-checked by this Engineer,
not taken on the coordinator's report alone):** all six routes
(`/`, `/services/`, `/about/`, `/contact/`, `/privacy/`, `/terms/`) return
`200` at `https://haroonie-ai-public-site.pages.dev`; re-swept all six for
the QA-004 banned-pattern class (repository paths, role names, escalation
IDs, "agent-drafted"/"boilerplate pending"/"placeholder register") —
**zero matches**, confirming the fix holds in the actual production
environment, not just the build that shipped it.

**Outstanding: independent Tester regression verification of the QA-004
fix has NOT happened.** QA-004's remediation was self-tested by this
Engineer only. Per CLAUDE.md's lifecycle (Remediation → **Regression** →
Acceptance → Delivery), a Tester still needs to independently re-verify
that the fix holds before Wave 2b can be considered fully closed — this is
not a formality skipped by the merge or the production deploy; production
serving the correct content is necessary evidence for that verification,
not a substitute for it.

**R-2.3 AC1 remains BLOCKED on E6** — merging and deploying did not, and
could not, unblock it. The site currently ships with placeholder Services/
About/legal copy, which is exactly what the next section addresses.

## Production non-indexable gate — owner decision, per PM-002 (Engineer, 2026-09-13)

**The decision (relayed via the coordinator; PM-002 itself was not directly
read by this Engineer session).** The Project Manager's PM-002 assessment
argued that shipping Wave 2b as deployed violates REQ-001 §1.3: Cloudflare
Pages production is "production" under R-6.3's own definition regardless of
how sparse today's real content is, it is indexable, and roughly ten rows
in `status/placeholder-content.md` remain open with no owner copy sign-off
(Services, About, the Privacy/Terms policy bodies) — meaning search engines
could currently index placeholder content. The owner was asked directly and
chose: **make production non-indexable until E6 lands.**

**Implementation.** `.github/workflows/ci-cd.yml`'s `deploy-production` job
now sets `SITE_ENV=prelaunch` (a value distinct from `deploy-preview`'s
`SITE_ENV=preview`) on its `Build` step, wrapped in a heavily commented
"TEMPORARY E6 GATE" block naming the owner decision, why, the exact removal
condition (the placeholder register empty, or every remaining row
explicitly waived, per Wave 7's own exit criteria), and confirmation that
deleting the `env:` block alone restores indexing. `src/pages/robots.txt.ts`
itself was **not** touched — its existing `isPreviewBuild()` logic already
treats any `SITE_ENV` other than `"production"` as non-indexable, and an
*unset* `SITE_ENV` still correctly falls through to indexable (proven by
the pre-existing `SITE_ENV=Production` test and the top-level "production
build" describe block in `tests/seo-preview.spec.ts`, both left unchanged).

**Test added.** `tests/seo-preview.spec.ts` gained a test proving this
exact configured value (`SITE_ENV=prelaunch`) yields `Disallow: /` — not
just "some unrecognised value" (already covered by the pre-existing
`SITE_ENV=staging` test) — so a future edit to the workflow's literal
string without updating the test is caught.

**Verification, all by this Engineer directly:**
- `npm run lint`: 0 errors, 0 warnings.
- `npm run build`: 7/7 routes.
- `npm test` (`PW_PORT=4701 PW_PREVIEW_PORT=4702`), run twice from a clean
  port state: **214 passed, 4 skipped, 0 failed** both times, identical —
  218 total (up from 217), skip count unchanged. No existing assertion
  weakened.
- Manually built with `SITE_ENV=prelaunch` outside the test harness and
  read the resulting `robots.txt` directly: `User-agent: *` / `Disallow: /`.
- Pushed to `main` (commit `382273ac`), polled the resulting CI run
  (`34732487729`, run #16) to completion: `validate` success,
  `deploy-production` success (executed, not skipped), `deploy-preview`
  correctly skipped.
- **Live production, checked directly after that deploy:** all six routes
  return `200`; `robots.txt` now serves `User-agent: *` / `Disallow: /`
  (confirmed non-indexable); a repeat sweep of all six pages for the QA-004
  banned-pattern class found zero matches (the gate did not reintroduce or
  interact with that issue).

**This is temporary by design.** Once E6 lands and the placeholder register
is empty (or every remaining row is explicitly owner-waived), deleting the
`env:` block on `deploy-production`'s `Build` step is sufficient to restore
indexing — documented in the workflow itself so a future maintainer does
not have to reconstruct the reasoning from git blame.

## QA-004 independent regression verification — Finding 1 CLOSED, Finding 2 raised and remediated (2026-09-13)

`status/QA-004-wave2b-tester-review.md` gained a **Regression Verification**
section, authored independently by the Tester (not by this Engineer),
re-checking the QA-004 remediation above against live evidence rather than
this document's own account of it.

**Finding 1: CLOSED.** The Tester independently reconstructed the exact
pre-fix and post-fix commit trees (via the GitHub API, not local `git`,
since local `main` remains diverged), rebuilt both, and reproduced the
regression test failing on 5 of 6 routes against genuine pre-fix content
and passing 6/6 against the fix — matching this Engineer's own claim
exactly, on independently gathered evidence. Also independently confirmed:
the raw HTML comment in `dist/contact/index.html` is present pre-fix and
absent post-fix; the Privacy/Terms structured fields (R-2.5 AC1) are
untouched by the rewrite; no REQ-001 §1.3 fabrication was introduced; the
placeholder register is accurate in both directions; and live production,
all six routes, both the original `BANNED_PATTERNS` set and the Finding-2
probe set below, is clean. **Verdict, in the Tester's own words: "QA-004 is
CLOSED."**

**Correction to the record, made by the Tester, carried forward here
accurately:** an earlier task message (not this Engineer's own writing)
described commit `6a6c290f76` as "the pre-remediation commit." That is
incorrect — reconstructing the PR's actual commit sequence shows
`6a6c290f76` lands **four commits and about a minute after** the real fix
commit, `5cedd71955`, with `src/`/`tests/` byte-identical between them. The
true pre-fix commit — the fix's immediate parent — is
`d890e1164b70069330ee5071939fd90a9ab946db`, which is what this Engineer's
own QA-004 remediation section above already cited and tested against.
Noted here so the corrected framing is on record precisely, not just
implicitly consistent.

**Finding 2 (TEST_DEFECT, Medium) — raised by the Tester, remediated by
this Engineer.** `tests/seo-preview.spec.ts`'s `BANNED_PATTERNS` array
caught only the exact strings QA-004 found, not the general class of
"internal program artifact in visitor copy" its own doc-comment claims to
guard against. The Tester proved this by injecting five synthetic
same-class probes into otherwise-clean, already-fixed content — an internal
requirement ID ("See REQ-001 R-2.2 for scope."), a plan-document name
("Tracked for delivery in PLAN-001."), an internal-actor phrase
("Escalated to the coordinating session for review."), a PR number ("See PR
#3 for revision history."), and a second requirement-ID instance
("(Ref REQ-001 R-3.1.)") — and all five shipped into `dist/**/index.html`
undetected. Also flagged, correctly: this Engineer's own manual `dist/`
sweep during the original QA-004 remediation used a broader pattern set
(explicitly including `REQ-001` and `Wave \d`) than what was actually
encoded into the permanent test — the stronger check existed and was never
promoted into the regression guard.

**Fix.** Broadened `BANNED_PATTERNS` with 11 new entries covering the
class, not the instances: program document IDs (`REQ-\d+`, `PLAN-\d+`,
`QA-\d+`, `ADR-\d+`, and `PM-\d+` — the last added beyond the Tester's
literal list because it's this repository's own document-ID convention,
used for `PM-001`/`PM-002`), requirement/AC identifiers (`R-\d+\.\d+`,
`AC\d{1,2}`), an internal wave reference scoped to digit-adjacent usage
(`Wave <n>`, not the bare word), an internal PR/issue reference
(`PR`/`issue #<n>`), and two internal-actor phrases (`coordinating
session`, the capitalized phrase `the Engineer`). Deliberately excluded,
and said so in the test's own comment rather than silently narrowing
coverage: a bare `the owner` pattern, because a small business's own
About-page biography plausibly and legitimately references "the owner" —
banning that phrase risks a false positive on exactly the real content
this site needs to ship someday.

**Verified by the same method that exposed the gap**, not asserted from
the patterns merely looking more comprehensive: reproduced all five of the
Tester's synthetic probes plus two of this Engineer's own (`ADR-002`/
`issue #17` in a Services entry; `AC3`/`the Engineer` in Terms) across
seven content files, rebuilt, and confirmed the regression test failed on
all five affected routes with each specific pattern named in the failure
message; independently grepped the built HTML for all 11 new patterns to
confirm every probe (not just the first one Playwright's `for`-loop hit
per route) was individually caught. Then reverted every file to
byte-identical originals (diffed against backups, zero output) and
reran the six real pages clean.

**Verification.**
- `npm run lint`: 0 errors, 0 warnings.
- `npm run build`: 7/7 routes.
- Local runs, three total from clean port states: 214 passed/4 skipped/0
  failed; 213 passed/4 skipped/1 failed (a single, pre-existing,
  already-documented `tests/support/a11y.ts` "Execution context was
  destroyed" flake in an unrelated file, the same class this sandbox's
  shared-resource contention has produced before — see QA-002 Finding 1 and
  the QA-004 regression review's own Item 4); 214 passed/4 skipped/0
  failed.
- **CI (the authoritative gate, a dedicated runner with none of this
  sandbox's shared-resource noise), run `34734095251`:** `validate`
  success, `deploy-production` success (executed, not skipped),
  `deploy-preview` correctly skipped. Raw log: `Running 218 tests using 1
  worker` → `4 skipped` → `214 passed (2.4m)`, 0 failed.
- Also published to `main`, verbatim and byte-identical (round-trip
  diffed after publish): `status/QA-004-wave2b-tester-review.md`'s new
  Regression Verification section, and `status/PM-002-program-status-
  assessment.md` (a Project Manager assessment superseding PM-001,
  covering the merge-instruction relay's headline correction and the R-6.3/
  E6 indexability reasoning behind the non-indexable gate above), both
  otherwise trapped on the same diverged local `main` branch as before.

**No existing pattern removed or weakened; no test count changed** (new
patterns extend an existing test's array, not new test cases) — 218 total,
unchanged from the E6-gate commit, 4 skips unchanged (the same
`test.fixme` × 3 browsers plus the documented WebKit tab-order case).

## Wave 2b remediation — 404 page has no accessibility coverage (Open, not yet fixed — 2026-09-15)

**A real coverage gap, found by a peer session, recorded here as an open
Wave 2b remediation item.** The custom 404 page has zero accessibility
test coverage on `origin/main` today.

**Evidence.** The Wave 2a-era `tests/a11y.spec.ts` (commit `a2871b2`)
scanned `allRoutes` **plus** an explicit `test('the custom 404 page has
zero serious/critical accessibility violations')` hitting
`/this-page-does-not-exist/`. The shipped `tests/accessibility.spec.ts` on
`origin/main` loops `allRoutes` **only**. A `git grep` across all shipped
tests finds **no** accessibility assertion against the 404 page anywhere
— the rename from `a11y.spec.ts` to `accessibility.spec.ts` dropped that
case. A peer confirmed this by exhaustion: `allRoutes` on `origin/main` is
exactly 6 entries with no 404, and grepping every shipped test for
`404|does-not-exist|not-found` finds only the R-2.6 status assertion in
`tests/smoke.spec.ts` and the sitemap-exclusion assertion in
`tests/seo-preview.spec.ts` — so the page is served, routed, and
status-tested, with **no** accessibility assertion anywhere.

**In scope.** R-5.1 AC1 reads "Given **any page** … zero violations of
serious or critical impact," and R-2.6 makes the custom 404 a page the
site actually serves — so it is in scope, and currently unscanned.

**Why two QA passes missed it — worth recording, the lesson matters more
than the bug.** QA-004 verified the axe integration was not *narrowed by
configuration* (no disabled rules, no severity filter, no restricted
selectors) and passed it — accurate, but it never asked whether the
*route set* itself was complete. A correct answer to a slightly wrong
question. **Recommendation:** make route-set completeness an explicit
check in any future QA of R-5.1, not just configuration narrowing.
**Suggested structural guard:** assert the scanned-route count against the
set of pages the site actually serves, so a page that exists but isn't
enumerated in the test's route list fails loudly instead of silently
going unscanned.

**Credit:** the `public-site-cd` session, whose cross-branch object sweep
surfaced this.

**Sequencing — deliberately queued, not stalled.** This is recorded as an
open item and **not fixed in this pass**: it is deliberately queued
behind PRs #4 and #5 to avoid a third concurrent PR against an unprotected
`main` in this shared checkout (see the E8 section above).

**The related scare is resolved, not a regression — stated explicitly so
it isn't re-investigated.** A 129-line `tests/support/a11y.ts` variant
found in a local worktree is **older** than the shipped 51-line version,
not a trimmed-down one — the shipped helper still scans the full default
axe rule set and filters to serious/critical impact afterward. Nothing
was quietly narrowed; the shipped helper is the more current, not the
weaker, of the two.

## Wave status

| Wave | Description | Status | Blocked by |
|---|---|---|---|
| 0 | Owner actions | Open | Owner |
| 1 | Foundation (scaffold, toolchain, Playwright harness) | **Accepted (Owner) — regression-confirmed (Tester), closed** | Nothing |
| 2a | Shared layout, nav, SEO plumbing | **QA-002 passed with findings; Finding 2 remediated and independently regression-confirmed by QA-003** (which reproduced the original failure mode live and confirmed the fix holds) | Nothing |
| 2b | Home/Services/About/Contact/Privacy/Terms page content | **Merged (`e64ac08e`) and deployed to production (run #15).** QA-004 Finding 1 (PRODUCT_DEFECT, High) remediated and **independently Tester regression-verified CLOSED**; Finding 2 (TEST_DEFECT, Medium, against the regression test's own coverage) raised by that same review and remediated (218 total, 214 passed, 4 skipped, 0 failed on CI). Live-verified in production | R-2.3 AC1 blocked on E6 (biography); production temporarily forced non-indexable (owner decision, see "Production non-indexable gate") until E6 lands |
| 3 | CI/CD pipeline | **Implemented, independently reviewed (QA-003, pass with findings, zero PRODUCT_DEFECT), PR #1 merged, three successful production deploys since. Not yet formally Accepted** | E8 (branch-protection plan gate) — owner decision pending |
| 4 | Domain and hosting configuration | **R-7.1–R-7.4, R-7.6 live; R-7.5 (security headers) merged (PR #4, 2026-09-15) as `public/_headers`.** REQ-001-A1 folded into REQ-001 (PR #6), E11/E12/E13 resolved. **New, 2026-09-16 (QA-005 Finding 1): R-7.5 AC2 FAILS on the real production hostname** — Cloudflare's Bot Fight Mode injects a script the static CSP blocks. Fix drafted as REQ-001-A2 (DRAFT, not approved) — see E14/E15 below. This is a revision to already-shipped Wave 4 scope, tracked as Wave 4-R1 in PLAN-001 §7, not a wave restart. | E14/E15 (owner) block the fix; nothing else in Wave 4 is affected |
| 5 | Enquiry form completion | Not started | Wave 2b (Contact skeleton); blocked on E4 |
| 6 | Performance and cross-browser hardening | **Merged (PR #5, 2026-09-15).** Production measured: Lighthouse Performance 100 all six pages, LCP 856-1204ms, 0 bytes client JS at merge time (`status/PERF-001-wave6-audit.md`). **New, 2026-09-16:** QA-005 found the production hostname now carries ~938 bytes of Cloudflare-injected script (R-5.2 AC2 evidence correction, §3.3 of REQ-001-A2 — AC2 still passes, well inside the 50KB budget) and R-5.3 AC1 (no console errors) currently fails on production for the same CSP reason as R-7.5 AC2. R-7.8 AC4 (in REQ-001-A2, DRAFT) requires R-5.2 AC1's Lighthouse budget to be re-verified once the Function ships, not assumed unaffected. | E14/E15 (owner) block the re-verification work; the existing PERF-001 baseline stands as recorded until then |
| 7 | Go-live and acceptance | Not started | Waves 3 + 4 + 6 |

## Open blockers (owner action required)

| ID | Item | Impact | Age |
|---|---|---|---|
| E1 | ~~Cloudflare account + zone add for `haroonie.ai`~~ | **RESOLVED — CLOSED 2026-09-15**, zone confirmed active via `CLOUDFLARE_ZONE_TOKEN` — see "E1/E2 — DNS delegation" below | Closed 2026-09-15 |
| E2 | ~~Registrar nameserver delegation to Cloudflare~~ | **RESOLVED — PROVEN 2026-09-14**, closed | Closed 2026-09-14 |
| E3 | GitHub repo under `haroonie-ai-ops` + secrets configured | **Repo half DONE** — `haroonie-ai-ops/public-site`, 26 commits pushed 2026-09-11, no longer local-only. Secrets half still open (needs E5's token value) | Partially resolved 2026-09-11 |
| E5 | Cloudflare API token — Account → Cloudflare Pages: Edit (CI only) | Blocks Wave 3 verification | Owner-actioned 2026-09-11, in progress |
| E4 | Transactional email credential | Blocks Wave 5 only; not a launch blocker | New |
| E6 | Copy: services, bio, legal entity/address, mailbox, booking URL | Blocks production sign-off on affected pages only; does not block any wave from starting | New |
| E8 | **R-6.1 AC2 is unimplementable as specified**: branch protection and rulesets are unavailable on private repos on GitHub Free. Owner must choose public repo, GitHub Pro, or an AC change. **Now assessed higher priority than E10** — `main` is unprotected and two PRs (#4, #5) are mergeable while red (see E8 section below) | Blocks Wave 3 exit, not Wave 3 start | New 2026-09-11; reprioritized 2026-09-15 |
| E10 | **Wave 4's planned Cloudflare access path is PROVEN non-functional, not merely "does not appear to reach"** (2026-09-15) — the OAuth session sees zero zones on the same account a working zone token confirms is active. **One option is now half-resolved**: a scoped `CLOUDFLARE_ZONE_TOKEN` is read-confirmed (DNS, rulesets, settings, Pages) but zone-write is untested pending `REQ-001-A1`, and has no expiry set. See "E10" below | Blocks Wave 4 write execution; read verification now unblocked | New 2026-09-14; updated 2026-09-15 |
| E11 | `CLOUDFLARE_API_TOKEN` (CI Pages-deploy secret) scope was never independently verified, and cannot be verified by any agent (`GET /user/tokens` / `GET /accounts/{id}/tokens` both return `9109 Unauthorized`; the CI secret's value cannot be read back). More consequential now the zone carries live MX/SPF for a working mailbox | Owner dashboard check only; no agent verification path exists | New 2026-09-15 |
| E14 | **Owner must approve the architecture change**: adopting a Cloudflare Pages Function (`functions/_middleware.ts` or equivalent) as this site's first server-side, request-time execution component, moving R-7.5's CSP off `public/_headers` onto that Function's output. Full detail: `requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md` §0, §5. | Blocks all of REQ-001-A2's ACs (R-7.5 AC1a–AC1f, R-7.8) — nothing in Wave 4-R1 (PLAN-001 §7) may be implemented before this | New 2026-09-16 |
| E15 | **Owner must accept, as a disclosed consequence of E14, the trust-dependency identified in REQ-001-A2 §2**: a nonce-based CSP delegates to Cloudflare's edge the decision of which inline script content is authorized on every response, for as long as JavaScript Detections/Bot Fight Mode is enabled on this zone, and this program cannot inspect or constrain that content before it executes in a visitor's browser. Not a weakening of the CSP's defense against attacker-injected script — a new, narrow reliance this program did not previously have. | Nothing blocked today (the owner already chose Option B's direction); recorded so it is disclosed, not discovered later | New 2026-09-16 |
| E16 | **Conditional.** If deploying the Pages Function is found to require a Cloudflare permission grant beyond CI's existing scoped token (R-6.6), that is a credentials/access escalation under CLAUDE.md and must stop for owner action, not be resolved by unilaterally broadening the token's scope. Not yet known to be triggered (REQ-001-A2 §4 U19). | Nothing today; only relevant if a broader grant turns out to be needed during implementation | New 2026-09-16 (conditional) |

**Numbering note:** E14–E16 continue this document's own escalation series
(highest prior number E13, `status/E13-zone-token-write-grants.md`) per
REQ-001-A2 §5's explicit instruction to do so. They are distinct from
REQ-001 §6's own separate, already-resolved local E7/E8 pair (spec/design
approval, resolved 2026-09-10) — a pre-existing collision between the two
numbering schemes (this document's own E8, "R-6.1 AC2 unimplementable," is
unrelated to REQ-001 §6's E7/E8) already flagged, not newly introduced, by
PR #6's merge commit. Not resolved here; recorded so a future reader does
not conflate the two schemes.

Row struck through, not deleted, per this table's own convention elsewhere
(E2/E3/E5) of recording resolution without erasing the original entry —
kept so the record shows what was asked and that it was actually verified
closed, not just assumed.

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

## Git fetch/push failure — corrected root cause (2026-09-15)

**This corrects a characterization repeated across several of this
program's own documents** (`status/PM-002-program-status-assessment.md`,
`status/PM-003-program-status-assessment.md`, and the QA-004 regression
review in `status/QA-004-wave2b-tester-review.md`): that `git fetch`/
`push` "hang" against `origin` from "this sandbox," treated as an
environment/worktree-isolation characteristic rather than a fixable local
config issue, with the GitHub REST API recorded as the durable, sanctioned
substitute. **That characterization is wrong, and has been for several
waves.** Per this document's own convention, the original text in those
documents is left in place, not rewritten; this section is the correction,
dated and attributed.

**Corrected facts, verified in this session:**

- With prompting disabled, git fails **immediately** — there is no hang at
  all:

      GIT_TERMINAL_PROMPT=0 git ls-remote origin HEAD
      → remote: Invalid username or token. Password authentication is not supported for Git operations.
      → fatal: Authentication failed for 'https://github.com/haroonie-ai-ops/public-site.git/'

- **Root cause: no usable stored credential for this remote.** Git
  Credential Manager opens an interactive prompt; stdin is the null
  device, nothing answers, and the command *appears* to hang. It is an
  authentication failure, not a transport or sandbox-isolation problem.
- A working invocation (verified — `ls-remote` returns instantly, `fetch
  origin` succeeds):

      git -c credential.helper= \
          -c credential.helper='!f() { echo "username=x-access-token"; echo "password=$GITHUB_PERSONAL_ACCESS_TOKEN"; }; f' \
          fetch origin

  The **empty first `-c credential.helper=`** is load-bearing — it clears
  inherited helpers so GCM never wins. An attempt without it hangs exactly
  as previously recorded.
- **Caveat, recorded honestly:** this workaround is *not* universally
  available. Another session reported its permission classifier **blocks**
  that command because it interpolates a secret into a shell command line
  — a reasonable block on its own merits. The inline-helper form works in
  some sessions and not others; it is not a program-wide fix.
- **Therefore the recommended durable fix is a stored credential**
  (`gh auth login`, or `git credential-store`), which makes ordinary `git
  fetch`/`push` work in *every* session with no secret on any command
  line. **Recorded as an owner action.**

**Attribution:** the corrected diagnosis (authentication failure, not
sandbox isolation) came from the `Project status update` session; the
empty-`-c credential.helper=` detail came from the `public-site-94`
session.

## Local `main` duplicate-history reconciliation (2026-09-15)

The 6 local-only commits on local `main` (see the divergence notes
elsewhere in this document and in the PM assessments) have been verified
**byte-identical to content already published on `origin/main`**, per-file
`git hash-object` comparison, **confirmed independently by two other
sessions** — not asserted from one comparison alone.

**This closes a data-loss concern this program has raised repeatedly**
(PM-002 §7, PM-003 §7, and elsewhere): those 6 commits are **duplicated
history, not unpublished deliverables**. Nothing sitting only on local
`main` is at risk of being lost if that branch is reset — the content
exists on `origin/main` under different commit SHAs already.

**Resetting local `main` to `origin/main` is therefore safe, content-wise
— but is being left to the owner**, not performed here, because four
sessions currently share this working directory and none of them should
unilaterally rewrite a branch ref another session may be mid-operation
against. This is a recommendation, not an action taken.

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

### E8 — new evidence and a priority reassessment (2026-09-15)

**New facts, live-verified:** `main` is confirmed **unprotected**
(`"protected": false`) — CI *reports* pass/fail on every PR, but nothing
*gates* on it, and production deploys on every push to `main` regardless.
Two open PRs (**#4, #5**) are currently **mergeable while red** — live,
concrete instances of exactly the gap this escalation described in the
abstract back in 2026-09-11.

**Priority reassessment, attributed:** the `Project status update` session
now assesses **E8 as higher priority than E10** — an unenforced merge gate
on a repository already carrying two mergeable-red PRs is a live risk
today, whereas E10's Wave 4 access-path gap only blocks work that has not
started. Recorded as that session's assessment, not re-derived here; the
three options above (public repo / GitHub Pro / amend R-6.1 AC2) are
unchanged.

## E1/E2 — DNS delegation: E2 proven, E1 inferred, a registrar fact, and a nameserver reference for Wave 4 (2026-09-14)

**Owner-supplied, then independently verified — twice, in two separate
sessions, with identical results both times:**

**E2 — CLOSED, proven by direct public DNS lookup**, not by owner claim
alone. `nslookup -type=NS haroonie.ai 8.8.8.8` returns:

    haroonie.ai  nameserver = alex.ns.cloudflare.com
    haroonie.ai  nameserver = zoe.ns.cloudflare.com

Cloudflare's own nameservers, delegated, against real public DNS — this
satisfies R-7.1 AC1's "Cloudflare nameservers are returned" half directly,
not as a claim to be re-verified later. **Registrar fact, also owner-
supplied and consistent with the above: Cloudflare is also the domain
registrar for `haroonie.ai`.** Registration and DNS hosting are the same
vendor here — there is no separate third-party registrar performing a
delegation step to a different DNS host. This is a material simplification
of PLAN-001's original E2 framing ("registrar nameserver delegation to
Cloudflare"), which assumed a distinct registrar; that assumption is
corrected in `planning/PLAN-001-execution-waves.md` alongside this entry.

**E1 — remains INFERRED, NOT independently confirmed.** Cloudflare only
issues a specific assigned nameserver pair once a zone is added to an
account, so the delegation above strongly implies the zone exists. But
`GET /zones?name=haroonie.ai` and an unfiltered `GET /zones`, through the
`cloudflare-api` OAuth session, both return `success: true` with an
**empty result list and `total_count: 0`** — reproduced independently,
same result both times, once by the Project Manager and once again by this
Engineer. Given the QA-003/E9 finding that this OAuth grant reads as
product-scoped rather than account-wide (Pages and account/member
endpoints readable; KV, Workers, and R2 not accessible even for reads), the
most likely explanation is that zone resources are simply outside this
grant, and the empty list is an access artifact — not evidence that no
zone exists. **E1 is not recorded as closed on this evidence.** Closing it
needs either a credential that can actually read zone resources, or the
owner confirming zone status directly in the Cloudflare dashboard.

**No DNS records exist yet, confirmed directly:** `www.haroonie.ai` →
`NXDOMAIN`; apex `haroonie.ai` has no `A` record. The zone (if it exists,
per E1 above) is delegated but not yet configured — R-7.2/R-7.3 remain
fully untouched work, exactly as PLAN-001 already scoped them to Wave 4.

**Reference value for Wave 4 (R-7.1 AC1):** `alex.ns.cloudflare.com` and
`zoe.ns.cloudflare.com` — the exact nameserver pair to check against when
Wave 4 verifies delegation. Also recorded in
`planning/PLAN-001-execution-waves.md`'s Wave 4 section.

### Correction — E1 is now CLOSED, proven (2026-09-15)

**The "INFERRED, NOT independently confirmed" framing above is superseded,
not deleted — left in place per this document's own convention.** A
working `CLOUDFLARE_ZONE_TOKEN` (a Cloudflare user token, `cfut_` prefix,
status **active**, **no expiry set**, held at Windows User scope) now
reads zone resources directly, independent of the OAuth session that
previously returned the ambiguous empty result. Verified with it:
`haroonie.ai` zone `3708736be9e9237044212d032e737484`, **status active**,
Free plan, nameservers `alex.ns.cloudflare.com` / `zoe.ns.cloudflare.com`
— matching the DNS-delegation evidence above exactly. **E1 is CLOSED.**
Full detail on this token, what it does and does not prove, and why the
OAuth path never saw this zone, is recorded in the E10 section below —
this note exists so a reader of E1 alone gets the correct, current
status without having to already know to look elsewhere.

## E10 — Wave 4's planned Cloudflare access path is not viable (2026-09-14)

**Found while verifying E1 above** — not a new probe, a direct consequence
of it. PLAN-001's E5 scope-correction section states Wave 4 zone
configuration would be performed "through Cloudflare's hosted remote MCP
server (`https://mcp.cloudflare.com/mcp`, OAuth, interactive owner
consent) rather than a stored credential," specifically so no long-lived
DNS-capable secret would ever need to exist.

**That plan does not hold up**, on evidence stronger than when E9 first
raised the OAuth grant's scope: the session is read-only, and per the E1
finding immediately above, does not appear to cover zone resources even
for **reading**, let alone the **writes** Wave 4 actually needs:
- R-7.2 — a DNS record (`www` canonical + TLS)
- R-7.3 — a redirect rule (permission name "Dynamic Redirect", not "Single
  Redirect," per PLAN-001's own E5 note)
- R-7.4 — zone TLS settings

None of these can be performed by the access this program currently has.
**R-7.5 (security headers) is unaffected by any of this** — it ships from
`public/_headers` in the repository and needs no Cloudflare permission at
all. Per PM-002, that file does not yet exist on either branch; it remains
fully executable today with zero owner input, independent of E1/E10.

**Owner decision required — three options:**

1. **A scoped Cloudflare API token** with Zone → DNS: Edit, Zone → Zone
   Settings: Edit, and Zone → Dynamic Redirect. This is explicitly what
   PLAN-001's E5 correction was trying to avoid creating — noting that
   tension honestly rather than glossing over it: avoiding a second stored
   secret was a deliberate choice, and this option reverses it.
2. **`wrangler login`**, run interactively by the owner, granting real
   write scopes via OAuth rather than a stored token.
3. **The owner performs Wave 4's zone configuration manually** in the
   Cloudflare dashboard — no agent access required at all.

**Recommendation:** not made here — this is the owner's call to weigh
(a stored secret's blast radius vs. an interactive step vs. manual work),
and PLAN-001's E5 correction already shows this program's stated preference
for avoiding a second long-lived credential when avoidable. Recorded as
three genuine options, not steered toward one.

**Does not block Wave 4 from being drafted** — the workflow/config
reasoning in PLAN-001 §2 (Wave 4) is unaffected. **Does block Wave 4 from
being executed** by an agent under this program's current access, until
the owner picks one of the three options above.

### Correction — one option is now half-resolved, and the OAuth path is proven, not inferred, non-functional (2026-09-15)

**The three-options framing above is superseded, not deleted** — left in
place per this document's own convention; this section states precisely
what has changed so the owner is not asked to choose between three options
when one is no longer fully open.

**Option 1 (a scoped Cloudflare API token) now partly exists.** A working
**`CLOUDFLARE_ZONE_TOKEN`** (user token, `cfut_` prefix, status **active**,
**no expiry set**, held at Windows User scope) is confirmed:
- `haroonie.ai` zone `3708736be9e9237044212d032e737484`, status active,
  Free plan, nameservers `alex.ns.cloudflare.com` / `zoe.ns.cloudflare.com`
  — **this closes E1** (previously inferred-not-confirmed; see the
  correction in "E1/E2 — DNS delegation" above).
- **Zone read is confirmed** across DNS records, rulesets, zone settings,
  and Pages.
- **Zone write is untested, and deliberately so** — no zone modification
  has been made with this token, pending the `REQ-001-A1` DNS coexistence
  amendment.
- `always_use_https` currently reads **`off`**, so R-7.4 is real,
  outstanding work, not something already satisfied by default.

So option 1 is **read-satisfied, write-unproven** — not "open" in the same
sense as options 2 and 3. Stated precisely here so the owner is choosing
among the right set of alternatives. **The token has no expiry set** —
recommend a TTL, or revocation once Wave 4 completes.

**The OAuth path (this section's original framing) is now proven
non-functional for Wave 4, not merely "does not appear to reach zone
resources."** A separate session holding an authorized `cloudflare-api`
OAuth grant ran read-only probes this session could not:
- Via OAuth, the grant sees exactly one account: `Haroonyoeu@gmail.com's
  Account` (`bb8eb20a5a4694930299522043258e3e`).
- `GET /zones` via OAuth returns `success: true, count: 0` — **empty, not
  a 403.**
- Yet `CLOUDFLARE_ZONE_TOKEN` shows `haroonie.ai` **active on that same
  account.**

The zone exists exactly where the OAuth session is bound, and that session
still cannot see it. **Conclusion: proven, not inferred** — the OAuth/MCP
path is **non-functional for Wave 4**, not merely riskier or read-only. It
cannot create R-7.2's DNS record, R-7.3's redirect rule, or change R-7.4's
TLS settings. PLAN-001's E5 correction — which routed Wave 4 through the
OAuth path specifically to avoid a stored DNS-capable credential — is
therefore **not merely overtaken but unworkable**, and a narrowly-scoped
zone token is the only viable route left of the original three.
**Attribution:** the session that originally recommended the OAuth
approach tested it and retracted its own recommendation — credited here
because that is the kind of correction worth making visible, not quietly
dropped.

**Two Cloudflare Pages projects exist on the account** —
`haroonie-ai-public-site` (the live one; production deploys here) and
`haroonie-bb8eb` (older, bound to `www.haroonie.com`). **Wave 4's
custom-domain attachment must explicitly name `haroonie-ai-public-site`**
— attaching `www.haroonie.ai` to the stray project is an easy mistake and
awkward to unpick after the fact. The good news, not a given going in:
the zone and the correct Pages project are on the **same** Cloudflare
account, so native custom-domain attachment will work.

**The additive-only DNS constraint is now testable, not just advisory.**
Independently confirmed by a second session: the zone has **zero
web-facing records** — no `A`, `AAAA`, or `CNAME` on either the apex or
`www`; only the 6 mail/Microsoft records exist. R-7.2's constraint is
therefore precise and checkable: **create-only; never update or delete any
of the 6 existing records.**

## E11 — `CLOUDFLARE_API_TOKEN` scope was never verified (New, 2026-09-15)

The CI deploy secret `CLOUDFLARE_API_TOKEN` was created and supplied
directly by the owner; nobody has confirmed it grants only Account →
Cloudflare Pages: Edit, as intended (see "Access and credentials" above).

**It cannot be verified by any agent.** `GET /user/tokens` and `GET
/accounts/{id}/tokens` both return `9109 Unauthorized` when probed with
the zone token, and the CI secret's actual value cannot be read back from
GitHub once stored. There is no access path from inside this program that
can confirm this token's real scope.

**Rationale for recording this now rather than treating it as
already-acceptable:** a deploy secret carrying more permission than Pages
rights was an acceptable unknown on a greenfield zone with nothing on it.
It is **not** an acceptable unknown on a zone that now carries live MX and
SPF records for a working mailbox (per E1/E10 above) — the blast radius of
an over-scoped token changed the moment the zone became real. **Recorded
as an owner dashboard check** — the Cloudflare dashboard's own token
detail view can show the token's actual permissions where the API cannot.
Credit: the `public-site-94` session.

## E14–E16 — REQ-001-A2: CSP nonce architecture change, disclosed trust-dependency, conditional permission gap (New, 2026-09-16)

**Trigger.** QA-005 Finding 1 (PRODUCT_DEFECT, High): R-7.5 AC2 and R-5.3
AC1 fail against `https://www.haroonie.ai/` in all three engines, on all
six routes — Cloudflare's Bot Fight Mode / JavaScript Detections injects an
inline bootstrap script the static `script-src 'self'` CSP correctly
blocks. Full evidence: `status/QA-005-production-hostname-test-gap.md`.
The owner has decided the direction, first-hand: *"proceed with option B
then hand off to @project-manager"* — a Cloudflare Pages Function minting a
per-request nonce, rather than `'unsafe-inline'` or disabling Bot Fight
Mode (both rejected by QA-005/the amendment as assertion- or
security-weakening). The Business Analyst has drafted the amendment
(`requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md`,
committed locally, not yet on `origin/main` at the time of this entry).

**Status: DRAFT.** The owner's instruction selected the *direction*
(Option B), not the amendment's specific acceptance criteria (R-7.5
AC1a–AC1f, new R-7.8), its disclosed trust-dependency, or its fail-safe/
drift rules. Those remain pending approval. This entry, and PLAN-001 §7,
sequence the work; neither authorizes starting it.

**E14 — architecture change approval.** This site has been purely static
through every prior wave; a Pages Function is the first server-side,
request-time code it would run. CLAUDE.md reserves "architecture changes
with significant impact" to the owner. Blocks: R-7.5 AC1a–AC1f, R-7.8, and
any Engineer/PM work sequenced against them (PLAN-001 §7's Group A/B/C).

**E15 — disclosed trust-dependency acceptance.** REQ-001-A2 §2 concludes,
after interrogating both threat models separately: a correctly-implemented
nonce is **not weaker** than today's policy against an attacker injecting
arbitrary script (arguably stronger — textbook nonce-based CSP reasoning),
and **no test's assertion is loosened anywhere** (R-8.3 AC1's gate is not
triggered). But it **does** create a new, narrow dependency that did not
exist before: the same mechanism that authorizes Cloudflare's JS Detections
script would authorize *any* inline script Cloudflare's edge chooses to
inject and stamp with that response's nonce, and this program cannot
inspect or constrain that content before it executes in a visitor's
browser. The owner is asked to accept this knowingly, as a distinct
decision from E14, not discover it later. Blocks nothing today (the
direction is already chosen) — recorded for disclosure, not as a live gate.

**E16 — conditional, not yet triggered.** REQ-001-A2 §4 U19 assumes Pages
Functions deploy through the same GitHub Actions → Cloudflare Pages path
(R-6.3) already in use, requiring no grant beyond CI's existing scoped
token (R-6.6, Pages: Edit). Unverified by this program specifically for
Functions. If a deployment attempt is rejected for a permissions reason,
that is a credentials/access escalation under CLAUDE.md and stops for
owner action — it is not a problem to route around by widening the token's
scope unilaterally.

**What remains executable while E14/E15 stand open, per CLAUDE.md's
instruction to continue other work rather than halt the program:**
everything not touching `public/_headers`, `functions/`, or the
production-hostname CSP mechanism. Concretely: Wave 5 (blocked only on
E4), E6 copy work, QA-002 Probe 4 and QA-003 Finding 1 (both cheap
Business-Analyst decisions, aging), E1/E10/E11's remaining Cloudflare
access-scope threads, and any Wave 7 preparation that does not depend on
R-7.5/R-7.8. The one thing that does **not** proceed is implementation of
REQ-001-A2's own ACs — that is the one piece E14/E15 actually gate. Full
sequencing, contention risks and exit criteria: PLAN-001 §7 and
`status/PM-004-program-status-assessment.md`.

**Not evaluated here and not this document's call:** whether the
amendment's specific ACs, ambiguity resolutions (U13–U19), or risk framing
are technically sound — that is a Business Analyst/owner matter. This
entry records the escalation and its blocking scope only.

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

## Escalation — merge instruction declined pending direct owner confirmation (Engineer, 2026-09-12)

While completing the QA-004 remediation above, a message from the
coordinator agent (not from the owner directly) instructed: *"proceed with
Merge PR #3 — ships Wave 2b to production,"* stating that "the owner has
explicitly instructed" this, and quoting an attributed owner instruction.

**Not acted on.** CLAUDE.md reserves "destructive operations" for the human
owner's approval, and the task that opened this remediation was explicit
that PR #3's merge decision belongs to the owner, not the Engineer. Per this
program's operating rules, a relayed claim of owner approval from an
intermediate agent is not the same thing as the owner's own approval — it
cannot be independently verified from this session, and merging to `main`
(which deploys to production per the CI/CD pipeline) is exactly the class
of "potentially irreversible Git operation" CLAUDE.md's Autonomous Authority
section requires escalating rather than acting on unilaterally.

This is not a judgment that the instruction is illegitimate — it may well
be genuine. It is a record that the Engineer did not have a way, from
inside this session, to confirm it came from the owner rather than from an
agent's own (possibly mistaken) relay, and treated that distinction as
material given what the action does.

**PR #3 status at time of this entry:** open, not merged, head `6a6c290f76`,
`mergeable_state: clean`, CI green on that head (run completed, conclusion
`success`). Nothing about the remediation above is blocked by this — QA-004
Finding 1 is fixed and verified regardless of when or whether the PR is
merged.

**Recommended next action:** the owner should either merge PR #3 directly
in GitHub themselves, or send a message that reaches this session directly
(not relayed through another agent) confirming the merge. On receipt of
either, the Engineer will proceed with the full post-merge verification
sequence (CI run to completion, production route checks, robots.txt and
sitemap verification) and record it here.

**Resolved, 2026-09-13.** The coordinating session confirmed it had
received the merge instruction directly from the owner, first-hand — not
relayed — and merged PR #3 itself rather than asking this Engineer session
to act on the second-hand version. The coordinating session's own message
states plainly that this escalation's reasoning stands and is recorded as
correct, not overruled. See "Wave 2b merged and deployed to production"
above for the merge and deploy evidence. This entry is left in place,
un-deleted, per this document's own register convention (`status/
placeholder-content.md`'s header: record resolutions, don't silently
remove the original entry) — the durable record is that the distinction
this escalation drew (relayed claim vs. first-hand instruction) held up and
was the actual resolution path, not a false alarm.
