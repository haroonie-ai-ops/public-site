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
| P7 | All pages | `og:image` / `twitter:image` (default, `src/components/SeoHead.astro`) | `/favicon.svg` (an SVG wordmark icon, not a proper social-share image) | A real 1200x630 raster Open Graph image from the owner/design (no brand assets exist yet per REQ-001 A5) | Wave 2a Engineer |

| P15 | Home (`/`) | `servicesSummary` (`src/content/home/index.md`) | Agent-drafted: "Artificial intelligence, data, cloud and custom software — three service areas built around what your business actually needs." Replaced pre-E6 wording that described the OLD positioning and contradicted the three new service areas. Derived only from the owner's approved service titles; invents nothing | Owner confirmation of wording (proposed in `status/E6-copy-for-review.md` §2, not yet nodded) | 2026-09-17 Engineer |
| P16 | About (`/about/`) | `metaDescription` (`src/content/about/index.md`) | Agent-drafted, derived strictly from the owner's own approved biography body; introduces no new claim. Required by the collection schema, and the owner supplied a heading and body but no meta description | Owner confirmation of wording (proposed in `status/E6-copy-for-review.md` §3.3, not yet nodded) | 2026-09-17 Engineer |

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

## QA-004 remediation (PRODUCT_DEFECT, High) — 2026-09-12

Independent Tester review (`status/QA-004-wave2b-tester-review.md`, Finding
1) found that Privacy's and Terms' rendered bodies admitted, to site
visitors, that the policy had not undergone legal review and pointed them
at this register's file path (`status/placeholder-content.md`), and that
Terms additionally named an internal role ("Project Manager") and an
internal requirement ID. This is a rendered-output defect, not a
placeholder-labelling defect — the affected rows (P13, P14) were already
correctly logged here; the problem was that the *process commentary
recorded for this register* had also been copy-pasted into the visitor-
facing Markdown body that the page actually renders through `<Content />`.

Sweeping beyond the two pages named in the finding turned up the same class
of leak on About (P3) and all three Services entries (P9–P11) — internal
requirement/escalation IDs and this same file path, also rendered via
`<Content />` — and, in Contact's `formIntro` and a raw HTML comment in
`src/pages/contact/index.astro`'s markup, an internal requirement ID and
wave number (not a registered placeholder row, since `formIntro` is real,
accurate copy — it just had leaked jargon in its wording).

**Fix applied, uniformly:** every internal reference (file paths, role
names, escalation IDs, requirement/wave IDs, "agent-drafted"/"boilerplate
pending" phrasing) was removed from visitor-facing prose and from any HTML
comment reachable by a page's render path, and relocated to YAML frontmatter
comments in the affected content files (which Astro's content-collection
schema parser discards — they never reach compiled output) or to this
register. No fact was deleted; every relocated detail is either restated
here or in the frontmatter comment immediately above the affected body in
each `.md` file. `src/components/PlaceholderNotice.astro`'s visible banner
text was also trimmed of its internal requirement/wave reference (kept:
"final content pending owner-supplied copy. Not for production.").

**Verified both directions after the fix:** every row still open below
correctly matches what a visitor to that page actually sees (checked
against a real `astro build`'s `dist/` output, not just the source), and no
`dist/**/*.html` file contains a repository path, `.md` reference, internal
role name, escalation ID, or the banned process phrases — enforced going
forward by `tests/seo-preview.spec.ts`'s new "no internal program artifacts
in rendered page content (QA-004 regression)" test, which runs against the
built `static-preview` output for all six pages.

## Resolved

| # | Page | Field | Resolution | Date / source |
|---|------|-------|------------|----------------|
| P4 | Contact (`/contact/`) | `metaDescription` (`src/content/contact/index.md`) | Replaced the Wave 2a stub description with real, non-placeholder copy — Contact's content (email, booking link) is real, owner-supplied data (E6, partial: mailbox + booking URL only) | 2026-09-12, Wave 2b Engineer |
| P5 | Privacy (`/privacy/`) | `metaDescription` (`src/content/legal/privacy.md`) | Replaced the Wave 2a stub description with real copy describing the actual policy page (the *policy body* itself is still logged as P13 pending owner/legal sign-off — resolving this row covers only the meta description, not the full page) | 2026-09-12, Wave 2b Engineer |
| P6 | Terms (`/terms/`) | `metaDescription` (`src/content/legal/terms.md`) | Replaced the Wave 2a stub description with real copy describing the actual policy page (the *page body* itself is still logged as P14) | 2026-09-12, Wave 2b Engineer |
| P1 | Home (`/`) | `heading`/`subheading`/`metaDescription` | Owner-supplied E6 copy applied. `servicesSummary` was NOT owner-supplied — see P15. | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
| P2 | Services (`/services/`) | `metaDescription` | Owner-supplied E6 copy applied verbatim (170 chars; will truncate in SERPs, accepted — R-4.1 sets no limit). | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
| P3 | About (`/about/`) | `heading` + biography body | Owner-supplied E6 biography applied; R-2.3 AC1 now asserted live in `tests/about.spec.ts` (fixme flipped on). `metaDescription` was NOT owner-supplied — see P16. | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
| P8 | Home (`/`) | JSON-LD `description` | Closed with P1 — sourced from the same owner-supplied `metaDescription`. | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
| P9 | Services (`/services/`) | `title` + body | Real service: **AI & Intelligent Automation**. | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
| P10 | Services (`/services/`) | `title` + body | Real service: **Data & Analytics**. | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
| P11 | Services (`/services/`) | `title` + body | Real service: **Software & Cloud Solutions**. | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
| P13 | Privacy (`/privacy/`) | Legal entity + registered address | `haroonie.ai LLC`, 2501 Chatham Rd, Suite N, Springfield, IL 62704, USA. Entity capitalization and the dropped d/b/a clause are explicit owner decisions (review §5.1/§5.2). **A4/GDPR jurisdiction flag raised, not resolved — review §5.3.** | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
| P14 | Terms (`/terms/`) | Legal entity + registered address | Same values; the paragraph disclosing their absence removed as no longer true. Governing-law clause now resolves to Illinois via the stated place of business — flagged for the owner's adviser. | 2026-09-17, owner-supplied (E6); record: `status/E6-copy-for-review.md` |
