# Workstream Status — haroonie.ai Public Website

Last updated: 2026-09-10 — Wave 2a (shared layout/SEO plumbing) implemented
and self-tested; ready for independent QA review. Wave 1 remains Accepted
by Owner, regression-confirmed.

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

Known environment note for whoever runs this next: this machine's default
`node` on PATH is v17.3.0 (nvm-windows' `nvm use` requires elevated
privileges not available in this session). Build/test runs above used Node
24.21.0 directly via its nvm-managed path. CI will use `.nvmrc` (24.21.0) via
`actions/setup-node`, which is unaffected by this local quirk — flagged here
only so a future local run isn't confused by a stale global Node version.

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

## Wave status

| Wave | Description | Status | Blocked by |
|---|---|---|---|
| 0 | Owner actions | Open | Owner |
| 1 | Foundation (scaffold, toolchain, Playwright harness) | **Accepted (Owner) — regression-confirmed (Tester), closed** | Nothing |
| 2a | Shared layout, nav, SEO plumbing | **Implemented, self-tested — awaiting independent QA review** | Nothing |
| 2b | Home/Services/About/Contact/Privacy/Terms page content | Not started | Wave 2a must pass QA and merge first |
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
| E3 | GitHub repository (remote) + secrets configured | Blocks Wave 3 verification | New |
| E5 | Scoped Cloudflare API token (Pages edit only) | Blocks Wave 3 verification | New |
| E4 | Transactional email credential | Blocks Wave 5 only; not a launch blocker | New |
| E6 | Copy: services, bio, legal entity/address, mailbox, booking URL | Blocks production sign-off on affected pages only; does not block any wave from starting | New |

No blocker halts the whole program. Waves 1, 2, 5 (once its precondition
lands), and 6 are fully executable today without any owner action beyond the
already-granted REQ-001 approval.

## Recommended immediate next step

Wave 2a (shared layout, nav, SEO plumbing) is implemented and self-tested —
see the Wave 2a section above. Per CLAUDE.md's Delivery Lifecycle, it now
needs an independent Tester review before Wave 2b starts, so that any
remediation to the shared layout/head/sitemap/robots mechanism happens
before five parallel engineers each build a page on top of it (PLAN-001's
explicit reason for sequencing 2a first: "the single highest
merge-contention risk in this project").

Once 2a passes QA and is merged, Wave 2b's five pages (Home, Services,
About, Contact static portion, Privacy+Terms) can proceed in parallel, one
engineer each, each importing `BaseLayout` and authoring their own
Playwright spec alongside their page. Real page copy depends on E6;
structure and tests do not.

In parallel, the owner can action E3+E5 (unlocks Wave 3) and E1+E2 (unlocks
Wave 4) — see PLAN-001 §6.
