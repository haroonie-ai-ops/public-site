# REQ-001 — haroonie.ai MVP Public Website

Status: Approved
Depends on: ADR-0001 (Option B selected 2026-09-10)
Author: Business Analyst
Date: 2026-09-10

Selected architecture: Astro static site, Markdown content, hosted on
Cloudflare Pages, served at `https://www.haroonie.ai`, deployed from GitHub.

---

## 1. Scope

### 1.1 In scope (MVP)

- Five public pages: Home, Services, About, Contact, plus Privacy and Terms
- A custom 404 page
- Site-wide header, footer and navigation
- Contact / enquiry capture
- SEO fundamentals, cookieless analytics, WCAG 2.2 AA conformance
- GitHub repository with CI that gates deployment on tests passing
- Cloudflare Pages project and DNS configuration for `www.haroonie.ai`
- Playwright suite covering every acceptance criterion below

### 1.2 Out of scope (MVP) — provisioned, not built

- Insights / blog. The content architecture must accommodate it without
  restructuring, but no posts ship in MVP.
- Headless or Git-backed CMS editing UI (ADR-0001 Option C)
- Client portal, authentication, gated content, interactive AI demos
- E-commerce, multi-language, newsletter automation
- Client names, logos, testimonials or case studies

### 1.3 Content integrity constraint (non-negotiable)

Agents must not invent client names, testimonials, project outcomes,
headcount, revenue, certifications, or years of experience. Where real copy
is unavailable, agents draft clearly-marked placeholder text. **No
placeholder may reach production.** Owner sign-off on all public copy is an
acceptance gate for R-2.x.

---

## 2. Assumed defaults

These derive from ADR-0001 section 6 and are applied so work is not blocked.
The owner may overturn any of them; doing so is a material requirement change.

| # | Assumption |
|---|-----------|
| A1 | Brochure site only; no application features |
| A2 | Owner and agents edit content via Markdown in the repository |
| A3 | Enquiries arrive by email to the owner, plus an external booking link |
| A4 | UK GDPR and EU GDPR apply |
| A5 | No existing brand assets; minimal typographic design, wordmark not logo |
| A6 | Recurring cost under $20/month excluding the domain |
| A7 | English only |
| A8 | Canonical host is `www.haroonie.ai`; apex redirects to it |

---

## 3. Requirements

Notation: **AC** = acceptance criterion, expressed Given / When / Then.
"Verified by" states how the criterion is independently observable.

### R-1 — Repository and toolchain foundation

**R-1.1** The project is a Git repository with a `main` branch.
- AC1 — Given the working directory, When `git log` is run, Then a commit
  history exists with `main` as the default branch.
- Verified by: CI checkout succeeding.

**R-1.2** The site builds locally to static output with a pinned Node version
and a committed lockfile.
- AC1 — Given a clean clone, When the documented install and build commands
  run, Then the build completes with exit code 0 and emits a static output
  directory.
- AC2 — Given the repository, When inspected, Then a Node version file and a
  dependency lockfile are present and committed.
- Verified by: CI build job.

**R-1.3** A local development server is runnable for test execution.
- AC1 — Given a clean clone, When the dev server is started, Then every page
  in R-2 responds 200 on localhost.
- Verified by: Playwright suite run against localhost.

**R-1.4** No secret, API token or account identifier is committed.
- AC1 — Given the repository at any commit, When scanned, Then no credential
  material is present; all secrets are referenced by environment variable.
- Verified by: secret scan in CI.

### R-2 — Pages and content

Applies to all pages: each is reachable from site navigation, renders without
console errors, and is responsive from 320px to 1920px viewport width.

**R-2.1 Home** — states what haroonie.ai does, for whom, and offers one
primary call to action.
- AC1 — Given a visitor, When `https://www.haroonie.ai/` loads, Then a single
  primary heading describing the company's offer is visible above the fold at
  1280x800 and at 390x844.
- AC2 — Given the home page, When rendered, Then exactly one primary CTA is
  present and it links to the Contact page.
- AC3 — Given the home page, When rendered, Then a summary of the service
  areas is visible with a link to the Services page.

**R-2.2 Services** — describes the consulting offerings.
- AC1 — Given a visitor, When `/services/` loads, Then between two and six
  distinct service entries render, each with a heading and description.
- AC2 — Given the Services page, When rendered, Then a CTA linking to Contact
  is present.

**R-2.3 About** — establishes credibility for the practice.
- AC1 — Given a visitor, When `/about/` loads, Then owner-approved biography
  content renders with no placeholder markers.

**R-2.4 Contact** — enables an enquiry.
- AC1 — Given a visitor, When `/contact/` loads, Then a contact email address
  and a booking link are visible and both are actionable.
- AC2 — Given the Contact page, When the enquiry form is present, Then it has
  name, email and message fields, each with a programmatically associated
  label.

**R-2.5 Legal pages** — Privacy Policy and Terms.
- AC1 — Given a visitor, When `/privacy/` loads, Then it states what data is
  collected, the lawful basis, retention period, and how to exercise data
  subject rights.
- AC2 — Given any page, When the footer renders, Then links to `/privacy/`
  and `/terms/` are present.

**R-2.6 404** — a custom not-found page.
- AC1 — Given a request to a non-existent path, When the response returns,
  Then HTTP status is 404 and the branded 404 page renders with a link home.

**R-2.7 Navigation and footer** — consistent across all pages.
- AC1 — Given any page, When rendered, Then the header exposes links to Home,
  Services, About and Contact, and the current page is indicated.
- AC2 — Given any page, When rendered, Then the footer shows the company
  name, a copyright year, and the legal links from R-2.5 AC2.

**R-2.8 Content source** — all page copy originates from Markdown or content
collections in the repository, not from hard-coded markup in components.
- AC1 — Given a copy change, When only a Markdown file is edited, Then the
  rendered page reflects the change after a rebuild.

### R-3 — Enquiry capture

**R-3.1** A visitor can submit an enquiry and receive confirmation.
- AC1 — Given a visitor on `/contact/`, When they submit the form with valid
  name, email and message, Then a success confirmation renders without a full
  page error, and the enquiry is delivered to the owner's mailbox.
- AC2 — Given a visitor, When they submit with an invalid or empty email,
  Then an inline validation message identifies the field and no submission
  occurs.
- AC3 — Given an automated submission, When spam protection triggers, Then
  the submission is rejected without delivering mail.
- **Blocked**: requires a transactional email credential (see section 6, E4).
  Until provided, the interim default is R-2.4 AC1 only — published email
  address and booking link, form deferred. This does not block MVP go-live.

### R-4 — SEO, analytics and discoverability

**R-4.1** Every page carries unique, non-empty metadata.
- AC1 — Given any page, When the HTML is inspected, Then `<title>` and
  `<meta name="description">` are present, non-empty, and unique across the
  site.
- AC2 — Given any page, When inspected, Then a `<link rel="canonical">`
  points to the `https://www.haroonie.ai` form of that URL.
- AC3 — Given any page, When inspected, Then Open Graph title, description,
  type, url and image tags are present.

**R-4.2** Machine-readable site structure is published.
- AC1 — Given the generated sitemap path on the production host, When
  requested, Then it returns 200 and lists every public page.
- AC2 — Given `/robots.txt`, When requested, Then it returns 200 and
  references the sitemap.

**R-4.3** Organisation structured data is present on the home page.
- AC1 — Given the home page, When inspected, Then a JSON-LD block of type
  Organization or ProfessionalService parses as valid JSON and contains the
  company name and canonical URL.

**R-4.4** Preview and staging hosts must not be indexed.
- AC1 — Given any `*.pages.dev` preview URL, When `/robots.txt` is requested,
  Then it disallows all crawling, while the production host does not.

**R-4.5** Analytics is cookieless, so no consent banner is required.
- AC1 — Given a first-time visitor, When any page loads, Then no cookie is
  written and no consent banner appears.
- AC2 — Given a page view, When it occurs, Then it is recorded in the
  analytics dashboard.

### R-5 — Accessibility, performance and compatibility

**R-5.1** WCAG 2.2 Level AA conformance.
- AC1 — Given any page, When scanned with an automated accessibility engine,
  Then zero violations of serious or critical impact are reported.
- AC2 — Given any page, When navigated by keyboard only, Then every
  interactive element is reachable and shows a visible focus indicator.
- AC3 — Given any page, When text and background are compared, Then contrast
  meets 4.5:1 for body text and 3:1 for large text.
- AC4 — Given any image, When rendered, Then it has an alt attribute
  (empty for decorative images).

**R-5.2** Performance budget.
- AC1 — Given the production home page on a simulated mobile connection, When
  audited, Then Lighthouse Performance is at least 95 and Largest Contentful
  Paint is under 2.5 seconds.
- AC2 — Given any page, When loaded, Then total transferred JavaScript is
  under 50 KB compressed.

**R-5.3** Cross-browser rendering.
- AC1 — Given the site, When rendered in current Chromium, Firefox and
  WebKit, Then layout is intact and no console errors occur.

### R-6 — CI/CD from GitHub to Cloudflare Pages

**Design decision D-02 — Approved 2026-09-10.** Deployment is driven by
GitHub Actions using an API token, not by Cloudflare's native Git
integration. Rationale: CLAUDE.md requires tests to gate delivery, and the
native integration builds inside Cloudflare where a failing test cannot
block publication.

**R-6.1** Pull requests are validated before merge.
- AC1 — Given a pull request to `main`, When CI runs, Then install, build,
  lint and the Playwright suite all execute.
- AC2 — Given any failing job, When CI completes, Then the pull request is
  reported as failing and cannot be merged.

**R-6.2** Pull requests receive an isolated preview deployment.
- AC1 — Given a pull request whose checks pass, When CI completes, Then a
  unique preview URL is produced and reported on the pull request.
- AC2 — Given a preview URL, When requested, Then it serves that branch's
  build and is excluded from indexing per R-4.4.

**R-6.3** Merges to `main` deploy to production automatically.
- AC1 — Given a merge to `main`, When CI completes successfully, Then the
  build is published to the Cloudflare Pages production environment and
  `https://www.haroonie.ai` serves the merged content.
- AC2 — Given a merge to `main` whose tests fail, When CI completes, Then no
  production deployment occurs.

**R-6.4** Post-deployment verification runs against the live site.
- AC1 — Given a completed production deployment, When the smoke suite runs
  against `https://www.haroonie.ai`, Then all pages return 200 and the home
  page primary heading is present.
- AC2 — Given a failing smoke run, When it completes, Then the failure is
  surfaced as a CI failure and a rollback recommendation is recorded.

**R-6.5** A previous deployment can be restored.
- AC1 — Given a bad production deployment, When the documented rollback
  procedure is followed, Then the prior deployment serves at
  `https://www.haroonie.ai` within 10 minutes.

**R-6.6** Pipeline credentials are managed as secrets.
- AC1 — Given the pipeline, When it authenticates to Cloudflare, Then it uses
  a scoped API token supplied as a repository secret, never a committed value.
- AC2 — Given CI logs, When inspected, Then no secret value appears.

**R-6.7** Builds are reproducible.
- AC1 — Given the same commit, When built twice, Then both builds succeed
  using the locked dependency versions and pinned Node version from R-1.2.

### R-7 — Cloudflare hosting and domain configuration

**R-7.1** The `haroonie.ai` zone is served by Cloudflare.
- AC1 — Given a DNS query for the zone's nameservers, When resolved, Then
  Cloudflare nameservers are returned and the zone status is active.

**R-7.2** `www.haroonie.ai` is the canonical, TLS-secured production host.
- AC1 — Given `https://www.haroonie.ai/`, When requested, Then it returns 200
  and serves the current production deployment.
- AC2 — Given the TLS certificate presented, When inspected, Then it is valid,
  unexpired, and covers `www.haroonie.ai`.

**R-7.3** The apex domain redirects to the canonical host.
- AC1 — Given `https://haroonie.ai/`, When requested without following
  redirects, Then a 301 to `https://www.haroonie.ai/` is returned.
- AC2 — Given `https://haroonie.ai/services/`, When requested, Then the 301
  preserves the path.

**R-7.4** Insecure requests are upgraded.
- AC1 — Given `http://www.haroonie.ai/`, When requested, Then a redirect to
  the `https://` equivalent is returned.
- AC2 — Given an HTTPS response, When headers are inspected, Then
  Strict-Transport-Security is present.

**R-7.5** Baseline security response headers are served.
- AC1 — Given any production page response, When headers are inspected, Then
  `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, and a
  `Content-Security-Policy` are present.
- AC2 — Given the CSP, When the site is browsed, Then no page produces a CSP
  violation in the console.

**R-7.6** The Pages project serves the built output with correct routing.
- AC1 — Given any in-scope path without a trailing slash, When requested,
  Then it resolves consistently to a single canonical form rather than
  serving duplicate content at two URLs.

### R-8 — Quality gates and traceability

**R-8.1** Every acceptance criterion above maps to at least one automated
check or an explicitly recorded manual verification.
- AC1 — Given this document, When the traceability matrix is reviewed, Then
  each AC identifier maps to a named test or a recorded manual result.

**R-8.2** The Tester reviews independently of the Engineer.
- AC1 — Given an implementation, When the Tester reports, Then each failure
  is classified as product failure, automation defect, flaky behaviour,
  environmental failure or test-data problem.

**R-8.3** Assertions are not weakened to achieve a pass.
- AC1 — Given any change to a test that reduces assertion strength, When
  reviewed, Then it carries a recorded justification approved by the owner.

---

## 4. Test data and preconditions

| Item | Value | Source |
|------|-------|--------|
| Production host | `www.haroonie.ai` | Owner |
| Apex host | `haroonie.ai` | Owner |
| Enquiry destination mailbox | `dev@haroonie.ai` | Owner |
| Booking link URL | `https://www.haroonie.ai/booking` | Owner |
| Company legal name and address | 1123 Test St Chicago, IL1 | Owner |
| Service list and descriptions | `Test;Test1;Test3` | Owner |
| Owner biography | `Test biography.` | Owner |
| LinkedIn / social URLs | optional | Owner |
| Test enquiry address | a dedicated seed address, not a real prospect | Engineer |

---

## 5. Ambiguities and residual risk

| # | Ambiguity | Safest default applied |
|---|-----------|------------------------|
| U1 | Is `haroonie.ai` already registered and under the owner's control? | **Resolved 2026-09-10 — confirmed registered by owner.** R-7 is no longer blocked by registration; it remains blocked by E1 (Cloudflare account/zone) and E2 (nameserver delegation) until those are actioned |
| U2 | Does an existing site or content need migrating? | Assume greenfield |
| U3 | Should the apex redirect to `www`, or the reverse? | `www` canonical per A8; cheap to reverse before launch, costly after |
| U4 | Preferred booking tool? | Cal.com; substitute freely |
| U5 | Public or private GitHub repository? | Assume private |
| U6 | Tone and positioning of the copy | Agents draft, owner rewrites; placeholders blocked from production by section 1.3 |

---

## 6. Escalations requiring human action

| # | Item | Blocks |
|---|------|--------|
| E1 | Cloudflare account creation and zone add | R-7 entirely |
| E2 | Registrar nameserver delegation to Cloudflare | R-7.1 |
| E3 | GitHub account, repository creation, secret configuration | R-6 |
| E4 | Transactional email credential for enquiry delivery | R-3.1 only |
| E5 | Scoped Cloudflare API token for CI (Pages edit permission only) | R-6.3 |
| E6 | Owner-supplied copy per section 4 | R-2.2, R-2.3, R-2.5 go-live |
| ~~E7~~ | ~~Approval of design decision D-02~~ — **Approved 2026-09-10**: GitHub Actions builds and deploys via a scoped API token | resolved |
| ~~E8~~ | ~~Approval of this specification~~ — **Approved 2026-09-10** | resolved |

Domain registration confirmed (was U1): `haroonie.ai` is registered and
under the owner's control. E1 and E2 remain open — registration alone does
not grant Cloudflare a zone or delegate nameservers.

Agents will proceed with all work not dependent on the above, and will not
create accounts, register domains, or handle credentials autonomously.
