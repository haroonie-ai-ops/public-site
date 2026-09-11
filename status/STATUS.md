# Workstream Status — haroonie.ai Public Website

Last updated: 2026-09-10 — QA-002's Finding 2 (stale `astro preview` lock
blocking concurrent test runs) remediated; awaiting Tester regression
re-verification. Wave 2a's underlying deliverable already passed QA-002
with no product defect; Wave 2b is clear to proceed regardless of this
remediation's own sign-off, per the Tester's verdict. Wave 1 remains
Accepted by Owner, regression-confirmed.

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

## Wave status

| Wave | Description | Status | Blocked by |
|---|---|---|---|
| 0 | Owner actions | Open | Owner |
| 1 | Foundation (scaffold, toolchain, Playwright harness) | **Accepted (Owner) — regression-confirmed (Tester), closed** | Nothing |
| 2a | Shared layout, nav, SEO plumbing | **QA-002 passed with findings; Finding 2 remediated — awaiting Tester regression re-verification** | Nothing |
| 2b | Home/Services/About/Contact/Privacy/Terms page content | Not started | Nothing — Wave 2a's QA-002 verdict already clears this to start |
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
| E3 | GitHub repo under `haroonie-ai-ops` + secrets configured | Blocks Wave 3 verification; **all 22 commits are local-only until done** | Owner-actioned 2026-09-11, in progress |
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
