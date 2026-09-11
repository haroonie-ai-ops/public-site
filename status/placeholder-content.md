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

---

## Open placeholders

| # | Page | Field | Current placeholder value | Real value awaited from | Introduced by |
|---|------|-------|---------------------------|--------------------------|---------------|
| P1 | Home (`/`) | `<meta name="description">` | "haroonie.ai is a tech consulting practice. Full home page copy ships in Wave 2 (REQ-001 R-2.1)." | Wave 2b Home engineer, drafting the real one-line offer statement (R-2.1) | Wave 2a Engineer |
| P2 | Services (`/services/`) | `<meta name="description">` | "Consulting services offered by haroonie.ai. Full service listing ships in Wave 2 (REQ-001 R-2.2)." | Wave 2b Services engineer, once service entries (E6) are drafted | Wave 2a Engineer |
| P3 | About (`/about/`) | `<meta name="description">` | "About haroonie.ai. Owner biography ships in Wave 2 (REQ-001 R-2.3)." | Wave 2b About engineer, once owner biography (E6) is drafted | Wave 2a Engineer |
| P4 | Contact (`/contact/`) | `<meta name="description">` | "Get in touch with haroonie.ai. Contact details and enquiry form ship in Wave 2 / Wave 5 (REQ-001 R-2.4, R-3.1)." | Wave 2b Contact engineer, once contact/booking details (E6) are drafted | Wave 2a Engineer |
| P5 | Privacy (`/privacy/`) | `<meta name="description">` | "How haroonie.ai collects, uses and protects personal data. Full policy ships in Wave 2 (REQ-001 R-2.5)." | Wave 2b Privacy/Terms engineer, once real policy text (E6) is drafted | Wave 2a Engineer |
| P6 | Terms (`/terms/`) | `<meta name="description">` | "Terms of service for haroonie.ai. Full terms ship in Wave 2 (REQ-001 R-2.5)." | Wave 2b Privacy/Terms engineer, once real terms text (E6) is drafted | Wave 2a Engineer |
| P7 | All pages | `og:image` / `twitter:image` (default, `src/components/SeoHead.astro`) | `/favicon.svg` (an SVG wordmark icon, not a proper social-share image) | A real 1200x630 raster Open Graph image from the owner/design (no brand assets exist yet per REQ-001 A5) | Wave 2a Engineer |
| P8 | Home (`/`) | JSON-LD `description` (`src/components/OrganizationSchema.astro` usage in `src/pages/index.astro`) | "haroonie.ai — tech consulting." (generic positioning line, carried over from the Wave 1 layout default, not fabricated but not owner-approved final positioning either) | Owner-approved company description / positioning statement | Wave 2a Engineer |

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

## Resolved

_(none yet)_
