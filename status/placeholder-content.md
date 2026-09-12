# Placeholder Content Register

Owned jointly with Business Analyst (PLAN-001 §4). Every piece of
placeholder copy or asset introduced in Wave 2 is logged here with the page,
the field, and the real value it is waiting on. REQ-001 §1.3 prohibits any
entry on this register from reaching production — this file is checked at
Wave 7 exit (go-live) and must be empty (or every remaining row explicitly
waived by the owner) before acceptance.

Do not remove a row by deleting it silently — when a real value lands,
strike the row through or move it to a "Resolved" section with the date and
source, so there is a durable record of what changed and when.

**Wave 2b note on the `placeholder` schema field vs. this register.** Every
content collection entry (`src/content.config.ts`) carries a `placeholder`
boolean. That flag drives the visible `PlaceholderNotice` banner and marks
copy that would otherwise risk violating REQ-001 §1.3 (inventing client
names, testimonials, outcomes, headcount, revenue, certifications, or years
of experience) or that is explicitly required to carry "no placeholder
markers" (R-2.3 AC1). It is **not** the same thing as "reviewed and
approved" — REQ-001 §1.1 states owner sign-off on *all* public copy is an
acceptance gate for R-2.x, so some rows below (Privacy/Terms policy
wording) are logged here for that broader sign-off gate even though their
schema `placeholder` flag is `false`, because they don't invent any of the
specific facts §1.3 bans. See each row's notes.

---

## Open placeholders

| # | Page | Field | Current placeholder value | Real value awaited from | Introduced by |
|---|------|-------|---------------------------|--------------------------|---------------|
| P1 | Home (`/`) | `heading`/`subheading`/`metaDescription` (`src/content/home/index.md`) | "haroonie.ai — tech consulting for teams shipping software" + supporting positioning copy | Owner-approved positioning statement (E6) | Wave 2b Engineer |
| P2 | Services (`/services/`) | `metaDescription` (`src/content/pages/services.md`) | "Consulting services offered by haroonie.ai." | Owner/E6 — should summarise the real service list once it exists | Wave 2b Engineer |
| P3 | About (`/about/`) | `heading`/`metaDescription`/biography body (`src/content/about/index.md`) | Generic "About" heading + placeholder notice explaining no bio exists yet | Owner-approved biography (E6). **R-2.3 AC1 cannot pass until this lands — see status/STATUS.md.** | Wave 2b Engineer |
| P9 | Services (`/services/`) | `title` + body (`src/content/services/service-1.md`) | "Service area 1 — placeholder" + explanatory placeholder body | Real service #1 name and description (E6) | Wave 2b Engineer |
| P10 | Services (`/services/`) | `title` + body (`src/content/services/service-2.md`) | "Service area 2 — placeholder" + explanatory placeholder body | Real service #2 name and description (E6) | Wave 2b Engineer |
| P11 | Services (`/services/`) | `title` + body (`src/content/services/service-3.md`) | "Service area 3 — placeholder" + explanatory placeholder body | Real service #3 name and description (E6) | Wave 2b Engineer |
| P7 | All pages | `og:image` / `twitter:image` (default, `src/components/SeoHead.astro`) | `/favicon.svg` (an SVG wordmark icon, not a proper social-share image) | A real 1200x630 raster Open Graph image from the owner/design (no brand assets exist yet per REQ-001 A5) | Wave 2a Engineer |
| P8 | Home (`/`) | JSON-LD `description` (now sourced from `home.metaDescription` via `src/content/home/index.md`, no longer hardcoded in `OrganizationSchema` usage) | Same placeholder positioning text as P1 | Owner-approved company description / positioning statement (E6) | Wave 2a Engineer; content-sourced by Wave 2b |
| P13 | Privacy (`/privacy/`) | `dataCollected`/`lawfulBasis`/`retentionPeriod`/`rightsProcedure` + intro body (`src/content/legal/privacy.md`) | Agent-drafted GDPR policy text applying REQ-001 assumption A4 (UK/EU GDPR applies); does **not** invent any REQ-001 §1.3-banned fact (no client names, outcomes, headcount, revenue, certifications, or years of experience), so the schema `placeholder` flag is `false` and no `PlaceholderNotice` banner is shown | Owner/legal review and sign-off before production go-live (general R-2.x gate, REQ-001 §1.1) — the retention-period wording in particular is a business policy choice the owner may want to change | Wave 2b Engineer |
| P14 | Terms (`/terms/`) | Body copy (`src/content/legal/terms.md`) | Agent-drafted, generic terms-of-use boilerplate; deliberately does not state a registered legal entity name, company number, or address (those are not owner-supplied — see the Contact/E6 note below) | Owner/legal review and sign-off before production go-live (general R-2.x gate); a real legal entity name/address if the owner wants Terms to name one | Wave 2b Engineer |

## Notes

- None of the above invents client names, testimonials, outcomes,
  headcount, revenue, certifications or years of experience (REQ-001 §1.3)
  — they are placeholder *labels* pointing at real work still to be done,
  not fabricated claims.
- Page `<title>` tags (e.g. "Services — haroonie.ai") are considered
  structural, not placeholder — they are expected to remain stable in this
  or a similar form once real content lands, and are not tracked here.
- JSON-LD `name` and `url` fields (`OrganizationSchema.astro`) are the real
  company name and the real canonical site URL — not placeholders.
- **Wave 2b content-integrity decision on REQ-001 §4's test-data table:**
  "1123 Test St Chicago, IL1", "Test;Test1;Test3", and "Test biography."
  are owner-entered *test data*, not supplied real copy — confirmed by the
  Project Manager's assessment that E6 should not be considered satisfied
  by that table. None of those literal strings were rendered anywhere on
  the site; Services and About use clearly-marked, honestly-labelled
  placeholder text instead (P3, P9-P11).
- **Two values from that same table were treated as real and used
  directly:** the enquiry mailbox `dev@haroonie.ai` and the booking URL
  `https://www.haroonie.ai/booking` (`src/content/contact/index.md`,
  `placeholder: false`). Both are concrete, actionable, owner-supplied
  facts (an email address and a URL) rather than descriptive business
  copy open to interpretation, and the task brief accompanying this wave
  explicitly named both as "genuinely usable." Company legal name/address
  and the service list from the same table were **not** treated as real,
  for the reasons in the row above.

## Resolved

| # | Page | Field | Resolution | Date / source |
|---|------|-------|------------|----------------|
| P4 | Contact (`/contact/`) | `metaDescription` (`src/content/contact/index.md`) | Replaced the Wave 2a stub description with real, non-placeholder copy — Contact's content (email, booking link) is real, owner-supplied data (E6, partial: mailbox + booking URL only) | 2026-09-12, Wave 2b Engineer |
| P5 | Privacy (`/privacy/`) | `metaDescription` (`src/content/legal/privacy.md`) | Replaced the Wave 2a stub description with real copy describing the actual policy page (the *policy body* itself is still logged as P13 pending owner/legal sign-off — resolving this row covers only the meta description, not the full page) | 2026-09-12, Wave 2b Engineer |
| P6 | Terms (`/terms/`) | `metaDescription` (`src/content/legal/terms.md`) | Replaced the Wave 2a stub description with real copy describing the actual policy page (the *page body* itself is still logged as P14) | 2026-09-12, Wave 2b Engineer |
