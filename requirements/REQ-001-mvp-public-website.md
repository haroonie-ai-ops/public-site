# REQ-001 — haroonie.ai MVP Public Website

Status: Approved
Depends on: ADR-0001 (Option B selected 2026-09-10)
Author: Business Analyst
Date: 2026-09-10
Amendments incorporated:
- REQ-001-A1 (DNS zone coexistence) — approved by the owner 2026-09-15,
  folded in below. See
  `requirements/REQ-001-A1-dns-coexistence-amendment.md`.
- REQ-001-A2 (CSP nonce via Cloudflare Pages Function) — approved by the
  owner 2026-09-16 (E14, E15; verbatim quotes in §6), folded in below. See
  `requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md`.

Both amendment files now stand as the historical record of *why* each
change was made; this document is the operative specification.

Selected architecture: Astro static site, Markdown content, hosted on
Cloudflare Pages, served at `https://www.haroonie.ai`, deployed from GitHub.
As of REQ-001-A2 (2026-09-16), a Cloudflare Pages Function also executes
per-request to mint the CSP nonce (R-7.5) — the site's first server-side,
request-time component; every other page remains statically built.

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
| A9 | The existing Microsoft 365 / Exchange Online mail configuration on `haroonie.ai` (MX, both SPF-shaped apex TXT records, and the `autodiscover`/`enterpriseenrollment`/`enterpriseregistration` CNAMEs) is permanent infrastructure, confirmed by the owner 2026-09-15 (E11). No requirement or plan in this program authorizes modifying or removing it, at any point, not only for the duration of Wave 4; any future change to these records is its own escalation. See U7, R-7.7. |

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
- **AC1 booking-link clause — WAIVED, interim, owner decision 2026-09-17.**
  Verbatim: *"b: proceed with the waiver for now."*, following *"A: ignore
  for now"* (do not pursue a scheduling URL yet). The email half of AC1 is
  **unchanged and still fully asserted**; only the booking-link half is
  waived.

  Why: no scheduling account exists, and the reserved `/booking` path
  returns 404. **AC1's booking clause was therefore already failing in
  production** — the link was visible but not actionable — from Wave 2b
  until 2026-09-17. This waiver does not create that gap; it records it
  honestly and removes the dead link rather than continuing to ship it.
  The prior automated check could not detect the failure: it compared the
  `href` string and never requested the URL (the same class of gap as
  QA-005 Finding 2).

  Scope and exit: the waiver covers **absence** of a booking link, not a
  broken one — `tests/contact.spec.ts` now actively asserts no dead booking
  affordance is rendered. It lapses as soon as a scheduling URL is
  supplied; restoring the link is two content-file lines plus a
  `public/_redirects` entry for `/booking` (the owner-chosen path), with no
  component change. The full AC1 assertion is retained as a `test.fixme` —
  in a **stronger** form than the one it replaces, fetching the target
  instead of string-comparing the href — to be flipped on at that point.
- AC2 — Given the Contact page, When the enquiry form is present, Then it has
  name, email and message fields, each with a programmatically associated
  label.
- AC3 — Given the Contact page publishes `dev@haroonie.ai` as the enquiry
  destination (AC1), When Wave 4's DNS changes are applied, Then the
  mailbox's underlying mail-routing records are confirmed intact per R-7.7
  AC4 before Wave 4 is reported exit-complete. The Contact page's published
  `mailto:` link being actionable (AC1, a UI-level check) is not sufficient
  evidence that mail delivered to it actually arrives — that evidence is
  R-7.7's, not this page's, and this AC makes the dependency traceable
  rather than assumed.

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

  This requirement has a second, independent precondition beyond the
  transactional email credential (E4): the destination mailbox's own
  mail-routing DNS records must remain intact through Wave 4 (R-7.7). A
  resolved E4 does not make R-3.1 deliverable if Wave 4 has broken MX
  resolution for `haroonie.ai` in the meantime — the two preconditions are
  independent and both must hold. (Added 2026-09-15, REQ-001-A1; no change
  to R-3.1's blocked status or its E4 dependency.)

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
- Note (2026-09-16, REQ-001-A2 §3.3 — corrects recorded evidence, not
  AC2's text or threshold): the previously recorded measurement ("0 bytes
  of JS") was accurate for `haroonie-ai-public-site.pages.dev` at the time
  it was recorded, but is not the correct figure for the hostname visitors
  actually use. `https://www.haroonie.ai/services/` measured ~938 bytes of
  Cloudflare-injected script (JavaScript Detections / Bot Fight Mode)
  during QA-005's investigation (2026-09-16). **AC2 still PASSES** — 938
  bytes remains far inside the 50 KB budget. R-7.8 AC3 requires all future
  measurements to target the production hostname specifically, so this
  kind of silent drift (a true figure when recorded, invalidated later by
  an unrelated Cloudflare-side configuration change) is caught going
  forward rather than discovered incidentally, as it was here.

**R-5.3** Cross-browser rendering.
- AC1 — Given the site, When rendered in current Chromium, Firefox and
  WebKit, Then layout is intact and no console errors occur.
- Note (2026-09-16, QA-005 Finding 1 / REQ-001-A2): AC1 currently **FAILS**
  against the real production hostname `https://www.haroonie.ai/` — 18 CSP
  violations logged as console errors, 3 engines × 6 routes — because
  Cloudflare's JavaScript Detections injects an inline bootstrap script
  the static CSP correctly blocks (R-7.5 AC2 fails identically, same root
  cause). This is an outstanding failure, not a satisfied criterion,
  pending Wave 4-R1 (PLAN-001 §7) implementing R-7.5 AC1a–AC1f / R-7.8.
  Every suite that reported AC1 passing before QA-005 targeted build
  output or the `pages.dev` origin, never the proxied production hostname.

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
- Note (2026-09-15): AC2's enforcement clause was escalated 2026-09-11 as
  unimplementable on a private GitHub Free repository — branch protection
  and rulesets return 403 on that plan (see §6, "E8" per `status/STATUS.md`
  numbering). **Resolved 2026-09-15:** the repository is now public
  (`haroonie-ai-ops/public-site`; all 91 commits secret-scanned clean
  beforehand) and GitHub ruleset `23484592` is active on `main` —
  `required_status_checks` ("Install, lint, build, Playwright", strict
  up-to-date), `non_fast_forward`, and `deletion` protection. AC2 is
  satisfiable exactly as originally written; the enforcement clause was
  never amended away.

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
- AC3 — Given the account holds two Cloudflare Pages projects
  (`haroonie-ai-public-site`, this program's real project, and
  `haroonie-bb8eb`, an older project already bound to a different domain,
  `www.haroonie.com`), When `www.haroonie.ai` is attached as a custom
  domain, Then the attachment names `haroonie-ai-public-site` specifically,
  verified by inspecting that project's custom-domains list after
  attachment — not inferred from the attachment call succeeding, since a
  misdirected attachment to the wrong project could plausibly also
  "succeed" from the caller's point of view. (Mirrors R-7.7 AC5; stated
  here as well because R-7.2 is the specific requirement this mistake would
  silently satisfy the letter of while attaching to the wrong target.)

**R-7.3** The apex domain redirects to the canonical host.
- AC1 — Given `https://haroonie.ai/`, When requested without following
  redirects, Then a 301 to `https://www.haroonie.ai/` is returned.
- AC2 — Given `https://haroonie.ai/services/`, When requested, Then the 301
  preserves the path.
- AC3 — Given the apex's pre-existing MX record and two TXT records, When
  the proxied record required for this redirect is added at the apex, Then
  both pre-existing record types remain present and resolve with unchanged
  content, verified by an external DNS query performed immediately after
  the change (this AC is the R-7.3-specific instance of R-7.7 AC4; it is
  stated here as well because R-7.3 is the specific requirement that
  creates the risk).
- AC4 — Given the redirect is live, When mail-routing continuity is
  verified, Then verification is limited to DNS-record-level checks
  (MX/TXT resolution, per AC3) and does not include sending or receiving an
  actual email message. **Resolved 2026-09-15 (owner decision, E12):**
  mail continuity is proven by byte-identical before/after record
  comparison via the Cloudflare API plus an external `dig`; no test email
  is ever sent. Sending one would itself be a separate outbound-email
  escalation under CLAUDE.md — the reasoning that produced this narrower
  scope, and the reasoning the owner upheld in choosing it over an
  end-to-end send test.

**R-7.4** Insecure requests are upgraded.
- AC1 — Given `http://www.haroonie.ai/`, When requested, Then a redirect to
  the `https://` equivalent is returned.
- AC2 — Given an HTTPS response, When headers are inspected, Then
  Strict-Transport-Security is present.

**R-7.5** Baseline security response headers are served. (Mechanism amended
2026-09-16, REQ-001-A2 — owner-approved: E14, the architecture change;
E15, the disclosed trust-dependency. Verbatim: *"Approve e14"*, then
*"Approve E15 then merge or #7"* — both recorded in merge commit
`5a8f4990`; see §6 for the full record.)

- AC1 — Given any production page response, When headers are inspected,
  Then `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, and a
  `Content-Security-Policy` are present. **Clarifying note (REQ-001-A2):**
  as of this amendment, these headers' authoritative source is a
  Cloudflare Pages Function (`functions/_middleware.ts` or equivalent) —
  this site's first server-side, request-time execution (E14) — not the
  static `public/_headers` file. `public/_headers`'s overlapping CSP /
  `X-Content-Type-Options` / `Referrer-Policy` lines are deleted, not kept
  as a fallback (see AC1f; U15).
- AC1a — Given two separate requests to the same production URL, When each
  response's `Content-Security-Policy` header is inspected, Then the
  `nonce-` token's value in `script-src` differs between the two
  responses, proving per-response generation rather than a cached or fixed
  value.
- AC1b — Given the `Content-Security-Policy` header's `script-src`
  directive, When inspected, Then it contains `'self'` and exactly one
  `nonce-<value>` token, and never contains `'unsafe-inline'` — including
  on the fail-safe path (AC1e) — since a browser that does not honor the
  nonce would otherwise silently fall back to authorizing all inline
  script. `'unsafe-inline'` remains rejected under R-8.3, as it was when
  QA-005 considered and discarded it.
- AC1c — Given a sample of at least 20 consecutive production responses,
  When their nonce values are compared, Then no two repeat, and each
  decodes to at least 128 bits (16 bytes) of randomness from a
  cryptographically secure source (e.g. Web Crypto
  `crypto.getRandomValues`) — not `Math.random()`, a counter, a timestamp,
  or any value already visible elsewhere in the response (e.g. the Ray
  ID).
- AC1d — Given a request to any path under
  `/cdn-cgi/challenge-platform/`, When the CSP is inspected, Then that
  path resolves under `'self'` (same-origin) — the specific allowance
  Cloudflare's documentation states this feature requires.
- AC1e — Given the Pages Function fails to execute for any reason
  (unhandled exception, runtime error, timeout), When the response is
  nonetheless served, Then it still carries a `Content-Security-Policy` at
  least as strict as the pre-amendment static policy (`script-src 'self'`,
  no `'unsafe-inline'`, no nonce), and the response is not a 500/error
  page solely because of this fallback — a Function fault degrades CSP
  strictness back to today's already-tolerated behaviour, not availability
  (R-7.2 AC1) or CSP presence at all (AC1f).
- AC1f — Given any production page response, When its raw headers are
  inspected, Then exactly one `Content-Security-Policy` header is present
  — never zero (the Function silently not running and nothing else
  supplying it), never two (the Function and a stale `public/_headers`
  entry both firing on the same response).
- AC2 — Given the CSP, When the site is browsed, Then no page produces a
  CSP violation in the console. **Currently FAILS on production
  (2026-09-16, QA-005 Finding 1):** 18 CSP violations, 3 engines × 6
  routes, against `https://www.haroonie.ai/` — Cloudflare's JavaScript
  Detections injects an inline bootstrap script the static, nonce-less
  policy correctly blocks. The CSP is behaving as designed; the defect is
  the injection. This is an outstanding failure pending Wave 4-R1
  (PLAN-001 §7) implementing AC1a–AC1f above, not a satisfied criterion —
  it is only meaningfully verified against the real production hostname
  (R-7.8), which no suite exercised before QA-005.
- Trust-dependency disclosure (E15, owner-accepted 2026-09-16): a
  per-response nonce is not weaker than today's `'self'`-only policy
  against attacker-injected script — by the standard justification for
  nonce-based CSP, arguably stronger, since an attacker who injects a
  `<script>` tag still cannot execute it without also learning that
  response's unpredictable nonce — but it does introduce a new, narrow
  dependency this program did not previously have: the same mechanism
  that authorizes Cloudflare's JavaScript Detections script would also
  authorize any other inline script Cloudflare's edge chooses to inject
  and stamp with that response's nonce, and this program cannot inspect or
  constrain that content before it executes in a visitor's browser. The
  owner accepted this knowingly and explicitly, as a decision distinct
  from E14 (merge commit `5a8f4990`).
- Verified by: AC1a–AC1d and AC1f are testable against any deployed Pages
  environment that runs the Function (preview or production alike, since
  the Function itself generates the nonce); AC1e is testable by
  deliberately forcing a Function error in a non-production deployment and
  inspecting the fallback response; AC2 is testable **only** against the
  real production hostname (R-7.8), since JavaScript Detections' injection
  is a zone-level, Bot-Fight-Mode-gated behaviour absent from
  `*.pages.dev`. None of AC1a–AC1f, AC2 or R-7.8 is implemented yet —
  sequenced as Wave 4-R1 (PLAN-001 §7).

**R-7.6** The Pages project serves the built output with correct routing.
- AC1 — Given any in-scope path without a trailing slash, When requested,
  Then it resolves consistently to a single canonical form rather than
  serving duplicate content at two URLs.

**R-7.7 — Wave 4's DNS and zone-setting changes are non-destructive to
existing mail and Microsoft 365 records.** (Added 2026-09-15, REQ-001-A1,
approved by the owner.)

Applies to every DNS record or zone-level setting change made in service
of R-7.1–R-7.6, not only the apex record discussed in R-7.3. The mail /
Microsoft 365 records this requirement protects are permanent
infrastructure (A9, confirmed by the owner 2026-09-15 — E11): Wave 4's
relationship to them is create-only, permanently, not only for the
duration of Wave 4, and any future change to them is its own escalation,
never a routine implementation decision.

- AC1 — Given the zone as it exists before any Wave 4 change, When Wave 4
  begins, Then a complete, independently-queried enumeration of every
  existing DNS record (name, type, content, proxy status) is captured and
  recorded before any write is made. This enumeration must be freshly
  queried by the executing agent/session, not copied from any prior
  document or conversation, and must confirm the record count is exactly
  six (1 MX, 2 TXT, 3 CNAME) before proceeding — a different count is
  itself a signal to stop and re-verify before any write, not to proceed on
  an assumption.
- AC1a — Given Wave 4 requires a Cloudflare credential capable of writing
  DNS records, zone settings and redirect rules (R-7.2–R-7.4), When that
  credential is selected, Then it is a scoped API token — not Cloudflare's
  interactive OAuth path, which is independently confirmed (see
  REQ-001-A1 §5) to return zero visible zones for this account and
  therefore cannot perform any of Wave 4's writes at all, regardless of
  preference. **Resolved 2026-09-15 (owner decision, E13):** the token is
  the existing `CLOUDFLARE_ZONE_TOKEN`. Its write grants are untested
  (only read access — DNS records, rulesets, zone settings, Pages — has
  been verified) and it has no expiry set; Wave 4 must treat both facts as
  live risk, not settled ones, until the first write is attempted (see
  AC2's sequencing constraint).
- AC2 — Given that baseline is exactly the six pre-existing records (AC1),
  When any Wave 4 DNS or zone-setting change is made, Then the operation
  performed is create-only: it adds new records (the `www` record for
  R-7.2 and the apex record for R-7.3) or changes zone-level settings
  (R-7.4's `always_use_https`), and it never issues an update or delete
  call against any of the six pre-existing records — this is a
  create-only rule to be enforced and checked, not a caution to bear in
  mind, made possible by the confirmed fact that zero web-facing (A/AAAA/
  CNAME) records exist anywhere on the zone today, so no legitimate Wave 4
  operation ever needs to touch an existing record at all. **Sequencing
  constraint (owner decision 2026-09-15, E13):** the first write operation
  Wave 4 performs must be creating the `www` record (R-7.2) — never the
  apex record (R-7.3) or any zone-level setting first — so that a missing
  write grant on `CLOUDFLARE_ZONE_TOKEN` surfaces on a name that carries
  nothing rather than mid-change on the name carrying live mail. The apex
  write (R-7.3) may only proceed once the `www` write is independently
  confirmed to have succeeded and to have left the six pre-existing
  records untouched.
- AC3 — Given the create-only rule (AC2), When a post-change enumeration
  of the zone is performed, Then it shows exactly the original six
  records, byte-identical in name, type, content and proxy status, plus
  only the new records R-7.2/R-7.3 require — verified by count (six plus
  exactly the new additions) and by field-for-field comparison against the
  AC1 baseline, not by spot-checking the apex alone. The apex record
  required by R-7.3 specifically coexists with the pre-existing MX and TXT
  records there without modifying either; this AC verifies that the
  actual operation performed was in fact a targeted, single-record
  creation, not a bulk or replace-all call against that name.
- AC4 — Given the change is complete, When the MX record and both TXT
  records at the apex, and the three Microsoft CNAMEs (`autodiscover`,
  `enterpriseenrollment`, `enterpriseregistration`), are queried externally
  (e.g. `dig`/`nslookup` against public resolvers), Then each resolves
  with content identical to the pre-change baseline, and the three CNAMEs
  remain DNS-only (unproxied). Per E12 (resolved 2026-09-15), this
  DNS-record-level comparison — not a test email send — is how mail
  continuity is proven.
- AC5 — Given the correct target for R-7.2's custom-domain attachment is
  the `haroonie-ai-public-site` Cloudflare Pages project, When
  `www.haroonie.ai` is attached, Then the attachment is verified to name
  that project specifically — not `haroonie-bb8eb` (an older project on
  the same account, already bound to a different domain,
  `www.haroonie.com`) — by inspecting the target project's custom-domains
  list after attachment, not by assuming the correct project was selected.
- AC6 — Given any Wave 4 change is found to have altered or removed any
  record in scope of AC1 (i.e. the create-only rule in AC2 was violated),
  When this is detected, Then it is treated as a critical incident under
  CLAUDE.md's destructive-operation policy: the change is reverted
  immediately using the AC1 baseline, and the owner is notified before any
  further Wave 4 work continues — not silently "fixed forward" and
  reported as a footnote.
- Verified by: recorded manual check (per R-8.1) — pre/post API
  enumeration output, diffed and attached to the Wave 4 record. This
  cannot be meaningfully expressed as a CI-gated Playwright test: it
  requires live access to the production zone at execution time, and
  running it automatically and repeatedly against production DNS on every
  build would itself be a risk this requirement exists to avoid. It is a
  one-time, evidenced, human-auditable step at Wave 4 execution, not a
  regression test. AC1a is verified once, at credential-selection time, by
  confirming which mechanism was actually used.

**R-7.8 — Automated verification of security headers and script execution
runs against the real production hostname, not build output or the
`pages.dev` origin.** (Added 2026-09-16, REQ-001-A2, approved by the
owner — E14.) Closes QA-005 Finding 2, and closes R-7.5 AC1's standing
deploy-time gap (no automated coverage against a live response existed
before this requirement).

- AC1 — Given a completed production deployment (R-6.4), When the
  post-deployment smoke suite runs, Then it additionally requests
  `https://www.haroonie.ai/` — not `*.pages.dev`, not local build output —
  across Chromium, Firefox and WebKit, and asserts zero CSP violations and
  zero console errors on each of the six R-2 routes.
- AC2 — Given the same production smoke run, When response headers are
  inspected, Then `X-Content-Type-Options`, `Referrer-Policy` and
  `Content-Security-Policy` (R-7.5 AC1) are verified present on the live
  response itself, not inferred from `_headers` file content or local
  build output.
- AC3 — Given the same production smoke run, When total transferred
  JavaScript is measured per page, Then the figure is recorded against the
  production hostname specifically (R-5.2 AC2), superseding any figure
  recorded only against `*.pages.dev` or local output.
- AC4 — Given this amendment is deployed to production, When R-5.2 AC1's
  existing Lighthouse Performance / LCP audit is next executed, Then it is
  re-run against the post-Function production hostname and compared to
  the most recent pre-Function baseline, with any regression reported
  rather than silently absorbed as "still passing" without a stated
  comparison.
- AC5 — Given this suite exists, When it fails, Then the failure is
  surfaced as a CI failure and a rollback recommendation is recorded, per
  R-6.4 AC2's existing pattern — not merely logged.
- AC6 — Given this new production-hostname suite exists alongside the
  pre-existing build-output suites (`cross-browser.spec.ts`,
  `lighthouse.spec.ts`, `security-headers.spec.ts`), When both run, Then
  the build-output suites are retained unchanged as fast pre-merge gates —
  they were never wrong, only insufficient alone (QA-005) — and the new
  suite is additive, not a replacement.
- Verified by: a new Playwright spec (naming is an Engineer decision)
  executed as part of the post-deployment job in `ci-cd.yml`, gated the
  same way R-6.4's existing smoke suite is gated. Not yet implemented —
  sequenced as Wave 4-R1 (PLAN-001 §7).

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
- Note (2026-09-16, REQ-001-A2 §2): the R-7.5 CSP-nonce mechanism was
  interrogated against this gate before adoption. Conclusion: it does not
  trigger AC1 — R-7.5 AC2's text is unchanged and remains strict; the
  fix makes production conform to the existing strict assertion, rather
  than loosening the assertion to tolerate production. `'unsafe-inline'`
  was the alternative that would have triggered this gate, and was
  rejected for that reason. Recorded here so the analysis is traceable
  from the gate it was checked against, not only from the amendment.

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
| Cloudflare zone ID | `3708736be9e9237044212d032e737484` | Owner (queried 2026-09-15) |
| Cloudflare account ID | `bb8eb20a5a4694930299522043258e3e` | Owner (queried 2026-09-15) |
| Pre-existing apex records (baseline for R-7.7 AC1–AC4) | MX (1); TXT (2, one SPF-shaped) | Owner (queried 2026-09-15) — Wave 4 must independently re-confirm per U11, not treat this row as sufficient evidence on its own |
| Pre-existing Microsoft CNAMEs | `autodiscover`, `enterpriseenrollment`, `enterpriseregistration` — all must remain DNS-only (unproxied); permanent per E11/A9 | Owner (queried 2026-09-15; permanence confirmed 2026-09-15) |
| `always_use_https` current value (pre-Wave-4) | `off` | Owner (queried 2026-09-15) |
| `CLOUDFLARE_ZONE_TOKEN` (user token, prefix `cfut_`, no expiry set) | Read confirmed across DNS records, rulesets, zone settings, Pages. Write untested. **Selected as Wave 4's credential by owner decision 2026-09-15 (E13)** — see R-7.7 AC1a/AC2 for the untested-write and required-sequencing consequences | Verified read-only by a separate session 2026-09-15; write status remains unverified until Wave 4's first write |
| GitHub ruleset on `main` | Ruleset `23484592`, active — `required_status_checks` ("Install, lint, build, Playwright", strict up-to-date), `non_fast_forward`, `deletion` protection | Owner/Engineer, confirmed 2026-09-15 (E8 resolution, `status/STATUS.md` numbering) |
| Repository visibility | Public (`haroonie-ai-ops/public-site`); all 91 commits secret-scanned clean beforehand | Owner, confirmed 2026-09-15 (E8 resolution) |
| Cloudflare documentation citations (JS Detections + Bot Fight Mode + CSP) | `developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/`; `developers.cloudflare.com/bots/get-started/bot-fight-mode/` | Fetched via Cloudflare documentation search, 2026-09-16 (REQ-001-A2 §0.3 on evidentiary weight) |
| Current CSP baseline (pre-REQ-001-A2), for the "only `script-src` changes" rule (U16) | `default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'` | `public/_headers`, R-7.5 (as merged to `main`, PR #4) |
| Measured injected-script size, production hostname | ~938 bytes, `www.haroonie.ai/services/` | QA-005, 2026-09-16 |
| Minimum nonce entropy | 128 bits (16 bytes), CSPRNG-sourced | W3C CSP Level 3 recommendation; a security-engineering default applied per U14, not owner-supplied |

---

## 5. Ambiguities and residual risk

| # | Ambiguity | Safest default applied |
|---|-----------|------------------------|
| U1 | Is `haroonie.ai` already registered and under the owner's control? | **Resolved 2026-09-10 — confirmed registered by owner.** R-7 is no longer blocked by registration; it remains blocked by E1 (Cloudflare account/zone) and E2 (nameserver delegation) until those are actioned |
| U2 | Does an existing site or content need migrating? | Assume greenfield. **Correction (2026-09-15, REQ-001-A1):** this default was right for *content* — there is still no existing website to migrate — but wrong applied to *DNS occupancy*: the zone carries live non-website records (MX, 2×TXT, 3×Microsoft CNAMEs; see §4). Left visible rather than deleted, per this program's convention of leaving superseded text beside its dated correction, because the miss is instructive. Superseded by U2a/U2b below. |
| U2a (2026-09-15) | Does existing site *content* need migrating? | Confirmed: no. No prior website exists at `haroonie.ai` or `www.haroonie.ai`. |
| U2b (2026-09-15) | Does the DNS *zone* carry existing, non-website records that must be preserved? | Confirmed: yes (§4). This is what R-7.7 exists to protect. |
| U3 | Should the apex redirect to `www`, or the reverse? | `www` canonical per A8; cheap to reverse before launch, costly after |
| U4 | Preferred booking tool? | Cal.com; substitute freely |
| U5 | Public or private GitHub repository? | Assume private |
| U6 | Tone and positioning of the copy | Agents draft, owner rewrites; placeholders blocked from production by section 1.3 |
| U7 (2026-09-15) | Is the Microsoft 365 setup permanent, or legacy infrastructure the owner may eventually retire? | **Resolved 2026-09-15 (owner decision, E11): permanent.** MX, both apex TXT records, and the three Microsoft CNAMEs are permanent infrastructure. Wave 4's relationship to them is create-only, permanently — not only for Wave 4's duration — and any future change to them is its own escalation. See A9, R-7.7. |
| U8 (2026-09-15) | Is a CAA record needed to constrain TLS certificate issuance for this zone? | None exists today, and none is required for MVP — Cloudflare's own managed certificates work without one. Flagged as residual risk (an unconstrained zone can technically have a certificate issued by any public CA), not added to MVP scope. No action taken. |
| U9 (2026-09-15) | Are SPF/DKIM/DMARC completeness for `haroonie.ai` in scope for this program? | Out of scope. This program builds a website; the existing TXT record is almost certainly SPF, but its exact content, and the presence/absence of DKIM/DMARC records, have not been inspected and are not this program's to fix. Flagged as a residual mail-deliverability risk to the owner (relevant to R-2.4/R-3.1's mailbox), not an MVP requirement. |
| U10 (2026-09-15) | Is `www.haroonie.ai` already used by anything (a SaaS binding, a Microsoft vanity domain, etc.)? | Resolved by direct evidence: no A/AAAA/CNAME exists at `www` today. Treated as clear. If a future need for `www` conflicts with this program, that is a conflict to raise when it happens, not now. |
| U11 (2026-09-15) | Is the zone/record data behind R-7.7 independently verified, or a single unverified report? | Single query, single session, at drafting time. Safest default: usable for drafting requirements against, but Wave 4 must independently re-query and diff the live zone (R-7.7 AC1) before making any change; no prior report is itself AC1's evidence. |
| U12 (2026-09-15) | What exact permission scope must Wave 4's Cloudflare credential carry, and is the existing `CLOUDFLARE_ZONE_TOKEN` the right instrument? | **Resolved 2026-09-15 (owner decision, E13): use the existing `CLOUDFLARE_ZONE_TOKEN`.** Its write grants are untested and it has no expiry set — both recorded as live risk, not closed by this decision. Consequence: R-7.7 AC2's create-only rule requires the first write to be the `www` record, never the apex, so a missing grant surfaces on a name carrying nothing. Post-Wave-4 revocation of this token is recommended (non-binding — see §6 E13). Cloudflare's interactive OAuth path remains confirmed non-viable for this account (R-7.7 AC1a). |
| U13 (2026-09-16) | Should the CSP-nonce Function's route-matching be global (`functions/_middleware.ts` applying to every request) or scoped only to HTML document routes? | Global. CSP headers on non-document responses (assets, `sitemap.xml`, etc.) are inert in browsers, not harmful; excluding paths adds complexity — and a new class of "did we forget a path" bug — for no protective benefit. R-7.5 AC1's "any production page response" reads most naturally as global anyway. |
| U14 (2026-09-16) | Nonce generation source and minimum entropy — no owner or prior-document guidance exists on this. | `crypto.getRandomValues()` (Web Crypto, available in the Pages Functions runtime), at least 16 random bytes (128 bits), base64-encoded. Not `crypto.randomUUID()` (fewer effective random bits than a raw 128-bit CSPRNG value, per its version/variant bits), not `Math.random()`, not derived from any value already visible in the response. |
| U15 (2026-09-16) | Should `public/_headers`'s `Content-Security-Policy`, `X-Content-Type-Options` and `Referrer-Policy` lines be deleted once the Function takes over, or left in place as a "backup"? | Deleted. R-7.5 AC1f requires exactly one CSP header per response; no Cloudflare documentation was found establishing a defined precedence between a Pages Function's headers and a static `_headers` file for the same header name (searched 2026-09-16, no result — see U17), so "leave both and hope one wins predictably" is not treated as safe. Deleting the overlapping lines removes the ambiguity outright. |
| U16 (2026-09-16) | Is REQ-001-A2's CSP change scoped to `script-src` only, or an invitation to revisit the whole policy? | `script-src` only. Every other directive (`default-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `form-action`, `frame-ancestors`, `base-uri`, `object-src`) carries over unchanged, verbatim, from the current `public/_headers` baseline (§4), so this does not become an undisclosed, unreviewed CSP rewrite riding on an architecture-change approval. |
| U17 (2026-09-16) | What is Cloudflare's actual precedence/interaction rule between a Pages Function's response headers and a static `_headers` file rule for the same header name? | Not established (queried 2026-09-16; no result). Safest default: do not rely on an assumed precedence at all. R-7.5 AC1f's "exactly one header, empirically verified against a live deployed response" is the requirement, regardless of which mechanism a reader might expect to "win" — any deviation is a build/deploy defect to fix, not a surprising-but-acceptable outcome to explain away. |
| U18 (2026-09-16) | Which direction should the Function fail in if it errors — degrade strictness, degrade availability, or ship with no CSP? | Degrade strictness (R-7.5 AC1e): fall back to the pre-amendment static policy value. Never zero CSP, never a 500 solely because of this fallback. |
| U19 (2026-09-16) | Does deploying a Pages Function require any Cloudflare permission beyond CI's existing scoped token (R-6.6, Pages: Edit)? | Assume no new grant is required — Functions ship as part of the same Pages deployment artifact, through the same GitHub Actions → Cloudflare Pages path (R-6.3) already in use — but this is unverified by this program specifically for Functions. If a deployment attempt is rejected for a permissions reason, that is E16 (§6), not a problem to work around by unilaterally broadening the token's scope. |

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

**Note on escalation numbering (added 2026-09-15):** the table's own E7
and E8 above were assigned during this document's original 2026-09-10
drafting, to two meta-approvals (design decision D-02, and this
specification itself) — both already resolved. `status/STATUS.md`
maintains a separate, program-wide escalation ledger that independently
continued numbering from E1, so its E7 and E8 refer to different, later,
operational items. This is a pre-existing numbering collision between the
two documents, not something introduced or resolved here; it is flagged
rather than silently fixed, consistent with §5's treatment of U2. Every
"E8", "E11", "E12", "E13", "E14", "E15" and "E16" reference below is to
`status/STATUS.md`'s numbering, per the owner's 2026-09-15 instruction —
not to this table's own already-resolved local E8 above.

| # | Item | Blocks |
|---|------|--------|
| ~~E8~~ (`STATUS.md` numbering) | ~~R-6.1 AC2's enforcement clause was unimplementable on a private GitHub Free repository — branch protection and rulesets return 403 on that plan~~ — **Resolved 2026-09-15:** the repository is now public (`haroonie-ai-ops/public-site`; all 91 commits secret-scanned clean beforehand) and GitHub ruleset `23484592` is active on `main` (`required_status_checks` — "Install, lint, build, Playwright", strict up-to-date; `non_fast_forward`; `deletion` protection). R-6.1 AC2 is satisfiable as originally written — the enforcement clause is implementable and was never amended away. | resolved |
| ~~E11~~ | ~~Owner must explicitly confirm the mail/Microsoft 365 DNS records (§4) are to remain permanently, with no agent authorized to alter or remove them under any circumstance~~ — **Resolved 2026-09-15 (owner decision):** confirmed permanent. Wave 4's relationship to the MX record, both apex TXT records, and the three Microsoft CNAMEs is create-only, permanently — not only for Wave 4's duration — and any future change to them is its own escalation, never a routine implementation decision. See A9, U7, R-7.7. | resolved |
| ~~E12~~ | ~~Owner must decide whether mail-continuity verification (R-7.3 AC4 / R-7.7 AC4) may include an actual end-to-end test email send~~ — **Resolved 2026-09-15 (owner decision): no.** Verification is DNS-record-level only — byte-identical before/after record comparison via the Cloudflare API plus an external `dig`. No test email is sent; doing so would itself be a separate outbound-email escalation under CLAUDE.md, which is the reasoning the owner upheld in choosing the narrower option over an end-to-end send test. | resolved (nothing was blocked pending this — the default already satisfied the ACs without a send) |
| ~~E13~~ | ~~Owner must confirm the exact permission scope for Wave 4's Cloudflare credential, and whether the existing `CLOUDFLARE_ZONE_TOKEN` is the intended instrument~~ — **Resolved 2026-09-15 (owner decision): use the existing `CLOUDFLARE_ZONE_TOKEN`.** Its write grants are untested and it has no expiry set — recorded as live risk, not closed by this decision. Sequencing consequence carried into R-7.7 AC2: the first write Wave 4 performs must create the `www` record, never the apex, so a missing grant surfaces on a name carrying nothing rather than mid-change on the name carrying live mail. Post-Wave-4 revocation of this token is recommended (non-binding — an implementation follow-up for whoever executes Wave 4, not itself a new AC). | resolved — still blocks Wave 4 *execution* of any DNS write until Wave 4 actually begins (nothing in this document authorizes starting Wave 4) |
| ~~E14~~ | ~~Owner must approve the architecture change itself: adopting a Cloudflare Pages Function as a new, server-side, request-time execution component of what has been a purely static site through every prior wave, and moving R-7.5's CSP header off `public/_headers` onto that Function's output~~ — **Approved 2026-09-16 (owner decision).** Verbatim: *"Approve e14."* Recorded in merge commit `5a8f4990` (PR #7). See R-7.5, R-7.8. | resolved — implementation not yet started; sequenced as Wave 4-R1 (PLAN-001 §7) |
| ~~E15~~ | ~~Owner must accept, as a disclosed consequence of E14 rather than a hidden side effect, the trust-dependency identified in REQ-001-A2 §2: a nonce-based CSP delegates to Cloudflare's edge the decision of which inline script content is authorized on every response, for as long as JavaScript Detections/Bot Fight Mode is enabled on this zone, and this program cannot inspect or constrain that content before it executes in a visitor's browser~~ — **Approved 2026-09-16 (owner decision).** Verbatim: *"Approve E15 then merge or #7."* The owner knowingly accepts that the CSP's guarantee changes from "nothing inline executes" to "nothing inline executes except what Cloudflare stamps." Approved as a decision distinct from E14. Recorded in merge commit `5a8f4990` (PR #7). See R-7.5. | resolved |
| E16 (conditional) | If, during implementation, deploying a Pages Function is found to require a Cloudflare permission grant beyond CI's existing scoped token (R-6.6), that is a credentials/access escalation under CLAUDE.md and must stop for owner action rather than be resolved by unilaterally broadening the token's scope. | not yet triggered (U19) — blocks nothing today; only relevant if a broader grant turns out to be needed |

Agents will proceed with all work not dependent on the above, and will not
create accounts, register domains, or handle credentials autonomously.
