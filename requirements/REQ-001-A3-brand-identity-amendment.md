**Status: APPROVED — 2026-09-17.** The owner approved this amendment
directly, in-session. Verbatim: *"#4 - approved"* (the amendment) and
*"#5 - approved"* (striking A5 for A10, a material change to an approved
assumption).

Its content is now folded into `requirements/REQ-001-mvp-public-website.md`,
which is the operative specification from this point forward — R-9.1 to
R-9.9, A10, the amendments to R-2.7/R-4.1/R-5.1/R-5.2, the §4 test-data
corrections, U20-U33 and E17-E22. This file now stands as the historical
record of *why*: the gap assessment, the CSP analysis in §2, and above all
the eleven computed contrast ratios in §3.2 that R-9.5 rests on. Where this
file and REQ-001 disagree on wording, REQ-001 governs.

**Owner decisions taken against this amendment's escalations, same session:**
E17 approved (source assets still outstanding — the supplied material remains
rendered PNGs, not production SVGs); E18 resolved — publish `dev@haroonie.ai`
and the real phone number `312-970-9638`, confirming refusal of the business
card's `hello@haroonie.ai`, `(312) 555-0100` and `Chicago, IL`; E19 parked
("ignore for now") so no Projects route and no "Get Started" CTA; E20
answered in part — the photographic hero was **replaced by the owner with an
illustrated skyline**, removing the stock-photo licence question, though
authorship/assignment of the illustration and logo remains open; E21 not
triggered (self-hosting adopted); E22 parked — light theme only.

Amends: `requirements/REQ-001-mvp-public-website.md` — §2 (A5 → proposed
A10), R-2.7, R-4.1 AC3, R-5.1, R-5.2, §4 (test data), §5 (U20–U33), §6
(E17–E22); adds a new requirement group **R-9**.
Cross-references: `requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md`
(structure and conventions followed here), `status/placeholder-content.md`
(row **P7** — this amendment closes it), `status/E6-copy-for-review.md`
(the copy decisions this brand sheet partly contradicts),
`status/PERF-001-wave6-audit.md` (the performance baseline this amendment
must not spend), `planning/PLAN-001-execution-waves.md`.
Author: Business Analyst
Date: 2026-09-17
Trigger: Owner instruction, 2026-09-17, verbatim: *"analyze the attached
styling and update the requirements to include changes to accommodate
coloring, fonts, styles and themes. Add logos, icons where necessary."*
Source material: two owner-supplied images — a marketing hero banner, and a
full brand identity sheet (logo variants, colour palette with hex values,
typography specimen, business card, website-header mockup, favicon sizes,
social variants, brand-value icons, brand pattern).

This document does not implement anything. It writes no CSS, no component,
no test, and no asset file. It is analysis and a proposed specification
change only.

---

## 0. What the owner is being asked to approve

Six things, and only these six:

1. **Replacing assumption A5.** REQ-001 §2 A5 states, as an approved
   assumption, that there are *no existing brand assets* and the site is
   *"minimal typographic design, wordmark not logo."* The supplied brand
   sheet contradicts that directly. Overturning an approved assumption is,
   by REQ-001 §2's own wording, *"a material requirement change"* — so it
   is the owner's decision, not an implementation detail. Proposed
   replacement: **A10** (§3.1).
2. **A new requirement group, R-9 — Brand identity and visual design**
   (§3.3): design tokens as a single source (R-9.1), typography (R-9.2),
   logo (R-9.3), iconography (R-9.4), colour and contrast (R-9.5), asset
   provenance and licensing (R-9.6), favicon/app-icon/Open-Graph assets
   (R-9.7), imagery and its performance budget (R-9.8), and theme policy
   (R-9.9).
3. **A recommendation on web fonts that avoids touching the CSP at all**
   (§2): self-host Manrope. The alternative — Google Fonts — would widen
   two CSP directives beyond the `script-src`-only rule U16 set when the
   owner approved E14, and is therefore treated here as its own owner
   decision (**E21**), not as something this amendment may assume.
4. **Amendments to four existing requirements** (§3.4): R-2.7 (header
   logo), R-4.1 AC3 (a real Open Graph image, closing register row **P7**),
   R-5.1 (concrete contrast rules derived from the actual palette hex
   values), and R-5.2 (protecting the measured performance budget against a
   photographic hero and web fonts, plus a CLS criterion the budget
   currently lacks).
5. **Four refusals to adopt parts of the supplied material** (§4) —
   business-card contact details that contradict facts the owner settled
   *today*, a nav item outside the six approved routes, a CTA relabel, and
   unapproved taglines. Each is flagged, with a stated default, rather than
   silently adopted or silently dropped.
6. **A theme decision** (§5): the sheet includes a "logo on dark" variant,
   which raises but does not answer whether the site gains a dark theme.
   This document recommends **light-only for MVP** and states what a dark
   theme would cost.

**What this does not do.** It adds no page, no route, no feature, no
client-side JavaScript, and no new visitor-facing copy. Every page still
does exactly what R-2 already requires. This changes how the site *looks*,
not what it *is*.

### 0.1 Facts this amendment is built on

Read directly from the two supplied images this session:

- **Palette, five colours with hex values**: `#0A2A87` Deep Navy (Primary),
  `#155BEF` Royal Blue (Brand), `#2E83FF` Bright Blue (Accent), `#66B4FF`
  Light Blue (Highlight), `#F5F8FF` Light Gray (Background).
- **Typography**: Manrope — ExtraBold (logo), Bold (headings), Regular
  (body). One family, three weights. No secondary family is specified,
  despite the sheet's "Primary and secondary fonts" label.
- **Logo variants**: horizontal full-colour, on-dark, mark-only, stacked,
  two monochrome (dark and grey), app icon / avatar (rounded square, dark
  and light), three circular social variants, favicon at 16/32/48.
- **Icons**: three service icons in the hero banner (lightbulb — "AI &
  AUTOMATION"; bar chart — "DATA & ANALYTICS"; cloud — "SOFTWARE & CLOUD
  SOLUTIONS"), and five "Brand values (optional)" icons (Innovate, Solve,
  Scale, Collaborate, Deliver). All single-weight line icons.
- **A brand pattern**: a subtle offset-square/pixel motif, used as a
  background element and as the dissolving-pixel detail in the logo mark.
- **A tagline lockup**: `IDEAS → SOLUTIONS → IMPACT`, rendered as part of
  the logo artwork itself in most variants.

Read from the repository this session:

- The site has **no brand identity applied**. `src/layouts/BaseLayout.astro`
  carries the entire visual design in one scoped `<style>` block: a
  `system-ui` font stack, five ad-hoc custom properties (`--ink: #14171a`,
  `--paper: #ffffff`, `--muted: #5b6470`, `--accent: #2452ff`, `--border:
  #e2e5ea`), and a text wordmark `haroonie.ai` in the header. **None of
  those five colours is in the supplied palette** — `#2452ff` is close to
  `#155BEF` but is not it.
- **`public/favicon.svg` is the unmodified Astro starter favicon.** It was
  added in commit `62633a5` ("shared layout shell and route stubs") and has
  never been edited since. The site therefore currently ships a third-party
  framework's logo as its own identity.
- **That same file is the site-wide Open Graph image fallback**
  (`src/components/SeoHead.astro`, `ogImage = '/favicon.svg'`), which is
  register row **P7**. P7 is recorded as *"Cosmetic"* in
  `status/E6-copy-for-review.md` §0. It is worse than cosmetic, in two
  compounding ways this amendment corrects: the major social platforms do
  not render SVG Open Graph images at all, so shares currently produce **no
  image**; and to the extent anything resolves it, the picture served as
  haroonie.ai's identity is Astro's logo.
- **The live CSP is emitted by the Pages Function**, built in
  `src/lib/csp.ts`: `font-src 'self'`, `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data:`, and no external origin in any directive.
- **The site ships zero bytes of its own JavaScript.** `package.json` has
  no client framework; `status/PERF-001-wave6-audit.md` records Lighthouse
  Performance **100** and LCP ~0.96–1.2s on production, and the only JS on
  the production hostname is the ~938 bytes Cloudflare injects itself.
- `sharp` is present in `node_modules` and Astro 7 is installed, so
  `astro:assets` image optimisation (AVIF/WebP, responsive `srcset`,
  intrinsic dimensions) is available with no new dependency.
- Accessibility coverage today is `tests/accessibility.spec.ts` — an
  unrestricted axe-core scan of all six routes, filtered to
  serious/critical (`tests/support/a11y.ts`). Axe's `color-contrast` rule
  is **serious** impact and is already inside that scan, so R-5.1 AC3 has
  real automated coverage today for colours axe can compute. §3.4's R-5.1
  amendment is deliberately written to extend that scan, not duplicate it.

### 0.2 Why this is a material change, not routine implementation detail

Choosing a shade of grey for a border is routine. This is not that. It
overturns an approved assumption (A5); it introduces the first binary
assets this program has ever shipped, each carrying a licensing question
(R-9.6); it puts a large photographic image in front of a performance
budget that currently passes with a perfect score and no headroom above it;
and the supplied material contains four items that contradict facts the
owner personally settled earlier today. CLAUDE.md reserves *"material
requirement changes"* to the owner. Each of those four is individually
small, and collectively they are exactly the kind of thing that gets
adopted silently if a specification does not stop and name them.

### 0.3 Evidentiary weight of the source material

This program has a standing practice of stating how much weight its inputs
carry before drafting against them (REQ-001-A1 §0.3; REQ-001-A2 §0.3).
Applied here:

The two images are **owner-supplied and therefore authoritative as to
design intent** — the palette hex values, the typeface name and the logo
forms are read directly off them and are not inferred. But they are
**renders, not assets**. A PNG mockup of a logo is a picture of a logo. No
production SVG can be extracted from it: the gradients, the pixel-dissolve
detail, the exact letterform spacing and the vector outlines do not survive
rasterisation, and tracing a 200-pixel-wide render yields a fuzzy
approximation, not the mark. Equally, the sheet is silent on things a
working design system needs and a picture cannot convey — a neutral/grey
text ramp, semantic status colours for form validation, a type scale, a
spacing scale, focus-ring treatment, and what happens at 320px.

So: the palette and typeface are **settled facts**; the logo, icons, hero
image and favicon set are **specified but not yet supplied** (E17); and the
unstated parts of the system are **ambiguities with defaults** (§6), not a
licence to invent brand decisions.

---

## 1. Gap assessment

| REQ-001 location | Written assuming | Now known | Consequence |
|---|---|---|---|
| §2 **A5** — "No existing brand assets; minimal typographic design, wordmark not logo" | The owner has no brand identity, so the site should stay deliberately plain | A full brand identity exists: five-colour palette, Manrope, eight logo variants, an icon set, a pattern, a favicon spec | A5 is now false. It must be replaced, not quietly ignored — it is an approved assumption, and REQ-001 §2 makes overturning one a material change (§3.1, proposed **A10**) |
| **R-2.7 AC1** — header exposes Home/Services/About/Contact, current page indicated | The header's brand element is a text wordmark | The brand has a specific horizontal logo lockup, and the mockup shows it in the header | R-2.7 needs a logo criterion that preserves the home link's accessible name, so replacing text with artwork cannot silently regress R-5.1 (§3.4) |
| **R-4.1 AC3** — OG title/description/type/url/image present | An image tag being *present* is sufficient | The present value is `/favicon.svg` — an SVG, which major platforms do not render, and which is Astro's logo, not haroonie.ai's | AC3 passes on the letter and fails on the purpose. Needs a raster 1200×630 criterion (§3.4). Closes **P7** |
| **R-5.1 AC3** — 4.5:1 body, 3:1 large text | Colours unknown at drafting time, so the rule is stated abstractly | Exact hex values are known, and **two of the five palette colours cannot carry body text on white** (§3.2) | The abstract rule stays; a concrete per-pair usage rule is added so the failure is designed out rather than discovered by axe afterwards (§3.4) |
| **R-5.2 AC1/AC2** — Lighthouse ≥95, LCP <2.5s, JS <50 KB | A text-only site with no images and no web fonts, measured at Performance **100** | A photographic hero banner and three web-font weights are proposed | The budget has no headroom above 100 and is about to be spent. Needs explicit format/dimension/loading criteria and a re-verification criterion, mirroring R-7.8 AC4 (§3.4) |
| **R-5.2** (no CLS criterion exists) | Nothing on the page could shift — no fonts, no images | Web fonts and a hero image are the two canonical sources of layout shift | A CLS criterion is added. It is not a new burden invented here; it is the criterion that becomes meaningful for the first time (§3.4) |
| **R-2.8** — all *copy* originates from Markdown, never hard-coded in components | Copy was the only thing at risk of being scattered across components | Brand tokens (hex values, font stacks) are about to become the same class of thing, scattered across whichever component needs them | R-2.8's guarantee needs an equivalent for tokens — **R-9.1** (§3.3) |
| **R-7.5** / `src/lib/csp.ts` — `font-src 'self'`, no external origins; U16 scopes CSP change to `script-src` only | Nothing external is ever fetched | Manrope must come from somewhere | Self-hosting needs **no CSP change at all**; Google Fonts needs two directives widened, contrary to U16 (§2). This is the single highest-consequence decision in the amendment |
| §4 Test data — "Company legal name and address: `1123 Test St Chicago, IL1`" | Owner-entered test data standing in for a real address | The real entity and address landed 2026-09-17: `haroonie.ai LLC`, 2501 Chatham Rd, Suite N, Springfield, IL 62704 | **Pre-existing staleness, found while cross-checking the business card.** Not caused by this amendment; corrected in §3.5 rather than left to mislead a later reader |
| §1.3 Content integrity — no invented facts | Applies to page copy | The business card carries an email, a phone number and a city that each contradict an approved fact or are fictional by construction | §1.3 applies to brand collateral exactly as it applies to prose (§4) |

---

## 2. Web fonts and the CSP — the decision this amendment turns on

**The constraint.** The live policy (`src/lib/csp.ts`) contains
`font-src 'self'` and `style-src 'self' 'unsafe-inline'`, with no external
origin anywhere in it. When the owner approved E14, **U16** recorded the
rule that came with that approval: the CSP change was scoped to
`script-src` **only**, and *"every other directive … carries over unchanged,
verbatim … so this does not become an undisclosed, unreviewed CSP rewrite
riding on an architecture-change approval."* A font decision that widens
`font-src` and `style-src` is precisely the thing U16 exists to prevent
happening quietly.

### 2.1 Option A — self-host Manrope (RECOMMENDED)

Ship subsetted `woff2` files from the site's own origin and declare
`@font-face` in the site's own CSS.

| | |
|---|---|
| **CSP impact** | **None.** `font-src 'self'` already permits it; `style-src 'self' 'unsafe-inline'` already permits the `@font-face` rule. Not one character of `src/lib/csp.ts` changes. U16's rule is honoured rather than argued around |
| **Performance** | Best available. Same origin, same HTTP/2 connection, no third-party DNS lookup, no third-party TLS handshake, no render-blocking stylesheet from another host. A `<link rel="preload">` for the one weight the LCP heading uses is possible *because* the URL is known at build time — it is not, under Google Fonts' two-hop CSS-then-font pattern |
| **Privacy** | Nothing about a visitor reaches a third party. Directly relevant: R-4.5 requires cookieless analytics with no consent banner, and the Privacy Policy is GDPR-framed (A4). Google Fonts transmits visitor IP addresses to Google — a third-party recipient a GDPR-framed policy would have to disclose. Self-hosting leaves nothing to disclose |
| **Licensing** | Manrope is understood to be published under the SIL Open Font License 1.1, which permits self-hosting and redistribution provided the licence file travels with the fonts. R-9.6 AC2 requires this be **confirmed against the actual font files at acquisition**, not taken from this sentence |
| **Cost** | Three `woff2` files (Latin subset, roughly 15–25 KB each), a licence file, and an `@font-face` block. Version pinning becomes the repository's responsibility rather than Google's — a benefit for reproducibility (R-6.7) and a small maintenance cost |

### 2.2 Option B — Google Fonts

| | |
|---|---|
| **CSP impact** | Requires `style-src` to gain `https://fonts.googleapis.com` and `font-src` to gain `https://fonts.gstatic.com`. **Two directives widened, neither of them `script-src`** — directly contrary to U16 |
| **Performance** | Two extra origins on the critical path before any glyph renders: DNS + TLS + a render-blocking CSS request to `fonts.googleapis.com`, which only then reveals the font URLs on `fonts.gstatic.com`. This is the classic LCP regression pattern, and it lands on a budget currently measured at Performance 100 (§0.1) with a photographic hero already proposed to spend it |
| **Privacy** | Visitor IP addresses reach Google on every page load. Requires a Privacy Policy change under A4 |
| **Cost** | Zero build setup — genuinely its only advantage here |

### 2.3 Recommendation

**Self-host (Option A).** It is better on every axis that matters to this
program — CSP untouched, faster, no third-party data flow, no Privacy
Policy consequence — and its only cost is three files in the repository.
There is no trade being made here; Option B is worse at everything except
initial setup effort.

**Accordingly, this amendment specifies Option A (R-9.2) and requires no
CSP change whatsoever.** If the owner nonetheless prefers Google Fonts,
that is **E21**: a CSP widening that must be approved on its own terms, as
a decision distinct from approving this amendment, exactly as E14 and E15
were kept distinct. It is recorded as a conditional escalation so it cannot
arrive later as an implementation detail riding on a styling approval.

### 2.4 What else the brand does *not* need from the CSP

Checked deliberately, so that "we'll widen it a bit more while we're in
there" never becomes the path of least resistance:

- **Logo and icons as inline or same-origin SVG** — `img-src 'self' data:`
  and `default-src 'self'` already cover every form (inline `<svg>`,
  `<img src="/….svg">`, a same-origin sprite). No change.
- **Hero and Open Graph images**, self-hosted and build-optimised — covered
  by `img-src 'self' data:`. No change.
- **Astro's scoped component styles**, which compile to inline `<style>`
  elements — already covered by the pre-existing `'unsafe-inline'` in
  `style-src`. No change, and no new reliance: that token predates this
  amendment and is not touched by it.
- **No icon font, no CSS framework CDN, no third-party asset host.**

**Net CSP delta for this entire amendment under Option A: zero.**

---

## 3. Proposed amendment text

Everything in this section is proposed new/changed text for
`requirements/REQ-001-mvp-public-website.md`. It is **not** in force. On
approval it is folded into REQ-001, which remains the operative
specification; this file then stands as the historical record of why.

### 3.1 Proposed replacement for assumption A5

Strike A5. Replace with **A10**, and leave A5 visible with its dated
correction, per this program's convention (REQ-001 §5 U2's treatment):

> | A5 | ~~No existing brand assets; minimal typographic design, wordmark not logo~~ — **superseded 2026-09-17 by A10 (REQ-001-A3).** Correct when written (2026-09-10): no brand identity existed, or was known to be coming. Left visible rather than deleted, because every "minimal by design" choice in `BaseLayout.astro` traces to this assumption and a later reader needs to know why they were made. |
> | A10 (2026-09-17) | A brand identity exists and is owner-supplied: a five-colour palette (`#0A2A87`, `#155BEF`, `#2E83FF`, `#66B4FF`, `#F5F8FF`), the Manrope typeface in three weights, a horizontal logo lockup with on-dark, mark-only, stacked, monochrome and app-icon variants, a line-icon set, and a favicon specification. The site applies this identity rather than a generic minimal treatment. The identity is supplied as **design direction in rendered form**; production-quality source assets are a separate, outstanding owner action (**E17**). Adopting the identity changes no page's purpose, route set, or copy. |

### 3.2 Contrast, computed from the actual palette

Every ratio below was computed this session from the supplied hex values
using the WCAG 2.x relative-luminance formula. These are not estimates, and
they are the reason R-9.5 is written as a usage rule rather than a
restatement of "meet 4.5:1".

| Foreground | Background | Ratio | WCAG 2.2 AA verdict |
|---|---|---|---|
| `#0A2A87` Deep Navy | `#FFFFFF` | **12.40:1** | Passes AA and AAA for all text |
| `#0A2A87` Deep Navy | `#F5F8FF` Light Gray | **11.66:1** | Passes AA and AAA for all text |
| `#155BEF` Royal Blue | `#FFFFFF` | **5.56:1** | Passes AA body text (4.5:1). Fails AAA (7:1) |
| `#155BEF` Royal Blue | `#F5F8FF` | **5.23:1** | Passes AA body text |
| `#FFFFFF` | `#155BEF` Royal Blue | **5.56:1** | Passes AA — safe for a solid primary button |
| `#2E83FF` Bright Blue | `#FFFFFF` | **3.62:1** | **FAILS AA body text.** Passes large text (3:1) and non-text UI (3:1) |
| `#FFFFFF` | `#2E83FF` Bright Blue | **3.62:1** | **FAILS AA** for a normal-size button label |
| `#66B4FF` Light Blue | `#FFFFFF` | **2.20:1** | **FAILS everything.** Non-text decoration only |
| `#66B4FF` Light Blue | `#0A2A87` Deep Navy | **5.63:1** | Passes AA body text — on dark surfaces only |
| `#F5F8FF` Light Gray | `#0A2A87` Deep Navy | **11.66:1** | Passes AA and AAA — the dark-surface body pairing |
| `#2E83FF` Bright Blue | `#0A2A87` Deep Navy | **3.43:1** | Large text and non-text UI only |

**Three consequences that would otherwise be found the hard way:**

1. The hero banner sets *"Real-World Impact."* in Bright Blue on near-white.
   At that size it is large text and **passes at 3.62:1**. The same colour
   in a paragraph, a link, or a caption **fails**. The distinction is size,
   and it is invisible to anyone reading the palette swatch alone.
2. A solid Bright Blue button with a white label — a plausible reading of
   the mockup's CTA — **fails AA**. The same button in Royal Blue passes at
   5.56:1. That is a one-token difference between conforming and not.
3. Light Blue `#66B4FF` is unusable for any text on any light surface. The
   sheet labels it "Highlight", which is consistent with this; the risk is
   a later reader treating five palette entries as five interchangeable
   text colours.

### 3.3 New requirement group — R-9 (insert after R-8)

#### R-9.1 — Brand tokens have a single source, as page copy does (R-2.8's analogue)

All brand values — colour, typeface family and weight, type scale, spacing
scale, radii — originate from one token definition in the repository. No
component declares a raw colour value, font family or font weight of its
own.

- **AC1** — Given the token source's value for the primary brand colour is
  changed and nothing else is edited, When the site is rebuilt, Then every
  page that renders that colour reflects the new value in its computed
  styles, and no page anywhere on the site still renders the previous
  value.
- **AC2** — Given the repository, When every `.astro` component and page is
  inspected, Then no hex colour literal, `rgb()`/`hsl()` colour literal, or
  `font-family` declaration appears outside the token source — brand values
  are referenced through tokens only.
- **AC3** — Given any page, When the computed `font-family` is read from a
  rendered heading and from a rendered paragraph, Then both resolve through
  the token-defined stack rather than a component-local declaration.
- Rationale: identical in kind to R-2.8. R-2.8 exists so a copy change
  never requires touching a component; R-9.1 exists so a brand change never
  does either. Without it, five palette values scatter across however many
  components need them, and "change the brand blue" becomes a repo-wide
  search-and-hope.
- Verified by: AC1 and AC3 by Playwright reading computed styles before and
  after a token edit; AC2 by a repository/build-artifact check, in the same
  class as R-1.4's secret scan.

#### R-9.2 — Typography is Manrope, self-hosted, with no CSP change

- **AC1** — Given any page, When a rendered heading's computed
  `font-family` is inspected, Then the first resolved family is Manrope,
  and Manrope is likewise the first resolved family for body text.
- **AC2** — Given any page load, When every network request is recorded,
  Then no request is made to any origin other than the site's own —
  specifically none to `fonts.googleapis.com` or `fonts.gstatic.com` — and
  every font file is served from the site's own origin.
- **AC3** — Given the deployed `Content-Security-Policy` header, When
  compared to the policy in force immediately before this amendment ships,
  Then it is **byte-identical**. This amendment changes no directive.
- **AC4** — Given the shipped font files, When inspected, Then each is
  `woff2`, each is subset to the character ranges the site actually uses,
  and exactly three weights ship (Regular 400, Bold 700, ExtraBold 800) —
  no weight ships that no page renders.
- **AC5** — Given a page load with a cold font cache, When the page
  renders, Then text is visible throughout (no invisible-text period), and
  layout shift attributable to font swap stays within R-5.2 AC3's budget.
- **AC6** — Given the LCP element's font weight, When the page's `<head>`
  is inspected, Then that one font file is preloaded and no other font file
  is.
- Verified by: Playwright (computed styles, request interception, header
  comparison) plus the Lighthouse audit already in
  `tests/lighthouse.spec.ts`.

#### R-9.3 — The logo replaces the text wordmark, without regressing accessibility or navigation

- **AC1** — Given any page, When the header renders, Then the brand logo is
  visible in the header and is the site's home link.
- **AC2** — Given that home link, When its accessible name is computed,
  Then it is `haroonie.ai` — unchanged in substance from the text wordmark
  it replaces, so R-2.7 AC1 and R-5.1 AC1 continue to hold with the logo in
  place. If the logo is an inline `<svg>`, its accessible name comes from a
  `<title>` or `aria-label`; if an `<img>`, from `alt`.
- **AC3** — Given the logo is rendered, When the page is viewed at 320px
  and at 1920px viewport width, Then the logo renders without distortion,
  without overflowing the header, and without pushing any navigation link
  out of view — R-2's 320px–1920px responsiveness clause applies to it as
  to everything else.
- **AC4** — Given the logo asset, When inspected, Then it is a vector (SVG)
  at every size the header renders it, so it is resolution-independent and
  adds no raster weight against R-5.2.
- **AC5** — Given the logo is a link, When it receives keyboard focus, Then
  a visible focus indicator appears (R-5.1 AC2), and that indicator meets
  3:1 contrast against both the header background and the logo's own
  adjacent pixels.
- **AC6** — Given the footer, When it renders, Then the company name
  remains present and readable as text — R-2.7 AC2 is satisfied by text,
  not by an image alone.

#### R-9.4 — Icons are decorative, accessible, and cost no JavaScript

- **AC1** — Given any icon rendered anywhere on the site, When the
  accessibility tree is inspected, Then each icon that merely accompanies
  adjacent visible text is hidden from assistive technology
  (`aria-hidden="true"`, or `alt=""` for an `<img>`), so no screen reader
  announces a duplicate of the label beside it — satisfying R-5.1 AC4.
- **AC2** — Given any icon that is **not** accompanied by visible text,
  When its accessible name is computed, Then it has one, and it describes
  the icon's purpose rather than its shape.
- **AC3** — Given any page containing icons, When total transferred
  JavaScript is measured, Then it is unchanged by their presence — icons
  ship as SVG markup or same-origin SVG files, never via an icon font and
  never via a runtime icon library.
- **AC4** — Given an icon rendered beside a service heading, When the icon
  fails to load or render, Then the heading and its description remain
  fully legible and the layout does not shift — no meaning is carried by an
  icon alone (WCAG 1.4.1, consistent with the existing "not by colour
  alone" treatment in `BaseLayout.astro`'s nav).
- Scope note: the sheet's five "Brand values" icons are labelled *optional*
  on the sheet itself, and no approved requirement calls for a brand-values
  section. They are **not** adopted into any page by this amendment;
  introducing one would be new page content requiring its own approval
  (§4.4). The three service icons map to the three existing,
  owner-approved service areas and are adopted.

#### R-9.5 — Colour is applied within the contrast rules its own values impose

- **AC1** — Given body text anywhere on the site, When its foreground and
  background are compared, Then the ratio is at least 4.5:1 — and
  specifically, `#2E83FF` and `#66B4FF` are never the foreground of body
  text on a light background (§3.2 computes them at 3.62:1 and 2.20:1).
- **AC2** — Given any solid-filled button or other call-to-action, When its
  label's contrast against its own fill is measured, Then it is at least
  4.5:1 — so a white label sits on `#155BEF` (5.56:1) or `#0A2A87`
  (12.40:1), never on `#2E83FF` (3.62:1).
- **AC3** — Given any text rendered over the hero image or any other
  photographic or gradient background, When measured against the actual
  pixels behind each glyph at 320px, 768px and 1920px viewport widths, Then
  the ratio meets 4.5:1 for body text and 3:1 for large text at **every**
  one of those widths — a photographic background crops differently at
  different widths, so a single-width measurement does not establish this.
- **AC4** — Given any non-text UI element that conveys information — focus
  indicators, form-field borders, icon-only affordances, the active-nav
  indicator — When measured against its adjacent background, Then the ratio
  is at least 3:1 (WCAG 2.2 SC 1.4.11).
- **AC5** — Given the current-page indicator in the header nav, When
  rendered, Then it remains distinguishable by something other than colour
  (weight, underline and `aria-current="page"` are already in place and
  must survive the restyle).
- **AC6** — Given any page, When scanned by the existing axe-core suite
  (`tests/accessibility.spec.ts`), Then zero serious or critical violations
  are reported, `color-contrast` included — i.e. R-5.1 AC1 continues to
  hold after the brand is applied.
- Relationship to R-5.1: R-9.5 does not replace R-5.1 AC3 and does not
  duplicate the axe scan. R-5.1 AC3 states the abstract rule and axe
  enforces it generically; R-9.5 states which specific palette pairings
  satisfy it, so a failure is designed out rather than caught afterwards —
  and it covers the two cases axe cannot compute at all: text over imagery
  (AC3), and contrast at viewport widths other than the one scanned (AC3).

#### R-9.6 — Every shipped brand asset has known provenance and a licence permitting commercial use

- **AC1** — Given each binary asset in the repository (logo, favicon set,
  app icons, Open Graph image, hero image, icons, font files), When the
  asset register is inspected, Then each has a recorded origin, creator,
  licence, and a confirmation that the licence permits commercial use on a
  public company website.
- **AC2** — Given the shipped font files, When the repository is inspected,
  Then the font's licence file is present alongside them, and its terms are
  confirmed to permit self-hosted web distribution.
- **AC3** — Given any asset whose provenance or licence cannot be
  established, When it is identified, Then it is **not shipped** — it is
  raised as an escalation (**E20**), not published on the assumption that
  an owner-supplied file carries owner-held rights.
- Rationale: this is the first program wave to ship binary creative assets.
  A logo whose rights are unclear, or a stock photograph used outside its
  licence, is a legal exposure on a public commercial site, and unlike a
  code defect it is not cheap to unwind after publication. §1.3's
  content-integrity constraint is the same instinct applied to prose; this
  is its asset equivalent.
- Verified by: recorded manual check (R-8.1's "explicitly recorded manual
  verification" path), held as an asset register beside
  `status/placeholder-content.md`.

#### R-9.7 — Favicon, app icons and the Open Graph image are the brand's, and are real

- **AC1** — Given `/favicon.svg`, When requested, Then it returns the
  haroonie.ai logo mark — **not** the Astro starter favicon currently
  shipped (§0.1).
- **AC2** — Given any page, When the `<head>` is inspected, Then an SVG
  favicon, an `.ico` fallback carrying 16×16/32×32/48×48, and a 180×180
  apple-touch-icon are all declared, and each URL returns 200 with the
  declared content type.
- **AC3** — Given any page, When the `og:image` and `twitter:image` values
  are read, Then they resolve to a **raster** image (PNG or JPEG) of
  exactly 1200×630 pixels served from the site's own origin — not an SVG,
  which the major social platforms do not render. **This closes register
  row P7.**
- **AC4** — Given that Open Graph image, When it is rendered at the
  thumbnail size social platforms actually display, Then the logo and any
  text on it remain legible.
- **AC5** — Given the favicon mark at 16×16, When rendered, Then it is
  recognisable — the pixel-dissolve detail of the full mark may be
  simplified or dropped at that size, since the sheet itself shows a
  simplified favicon treatment.
- **AC6** — Given the Open Graph image file, When its transferred size is
  measured, Then it is under 300 KB — a social-platform-facing asset never
  on the site's own critical path, but still fetched by crawlers.

#### R-9.8 — Brand imagery ships inside the existing performance budget, which is not assumed to survive it

- **AC1** — Given the home page's hero image, When the page loads, Then the
  image is served in a modern format (AVIF or WebP) with a JPEG/PNG
  fallback, at a responsive `srcset` covering at least the 320px, 768px and
  1920px breakpoints, so a phone never downloads a desktop-sized file.
- **AC2** — Given the hero image element, When the HTML is inspected, Then
  explicit intrinsic `width` and `height` (or an equivalent aspect-ratio
  reservation) are present, so its space is reserved before it loads.
- **AC3** — Given the hero image is the Largest Contentful Paint element,
  When the HTML is inspected, Then it is eagerly loaded and marked
  `fetchpriority="high"`, and **no other image on the page is** — every
  below-the-fold image is `loading="lazy"`.
- **AC4** — Given the home page on a simulated mobile connection, When the
  transferred bytes of the hero image variant actually selected at that
  viewport are measured, Then the figure is under **200 KB**.
- **AC5** — Given the hero image, When its accessibility is inspected, Then
  it is marked decorative (`alt=""`) if the heading beside it carries the
  meaning, or carries a description of its content if it does not — one or
  the other, never a filename and never `"hero image"` (R-5.1 AC4).
- **AC6** — Given this amendment is deployed, When R-5.2 AC1's Lighthouse
  Performance / LCP audit is next executed against the production hostname,
  Then the result is **compared against the most recent pre-brand
  baseline** (`status/PERF-001-wave6-audit.md`: Performance 100, LCP
  ~0.96–1.2s), and any regression is reported explicitly rather than
  absorbed as "still passing". Deliberately mirrors R-7.8 AC4's pattern,
  for the same reason: a budget with a stated comparison catches drift that
  a pass/fail threshold alone hides.
- **AC7** — Given any page after this amendment, When total transferred
  JavaScript is measured against the production hostname (R-7.8 AC3), Then
  the site's **own** JavaScript remains 0 bytes. No part of this brand —
  fonts, icons, theme, hero — introduces client-side script.

#### R-9.9 — Theme policy: one light theme for MVP

- **AC1** — Given any page, When rendered under `prefers-color-scheme:
  light`, under `prefers-color-scheme: dark`, and with no preference
  expressed, Then the page renders **identically** in all three, with the
  brand's light surfaces and no partially-applied dark treatment.
- **AC2** — Given the document root, When its `color-scheme` is inspected,
  Then it declares `light` only. **This is a correction:**
  `BaseLayout.astro` currently declares `color-scheme: light dark` while
  hard-coding `--paper: #ffffff`, so it tells the browser it supports a
  dark rendering it does not actually provide — form controls and
  scrollbars can be UA-darkened against a permanently white page.
- **AC3** — Given the on-dark logo variant exists, When the site is
  inspected, Then it is used **only** where a genuinely dark surface exists
  (the Open Graph image, app/social icons, and any dark footer or section
  band the design calls for) — its existence does not imply a site-wide
  dark theme.
- **AC4** — Given `/favicon.svg`, When the browser is in dark mode, Then
  the mark remains legible against dark browser chrome. The current
  Astro-default file already achieves this with an internal
  `prefers-color-scheme` rule; the replacement must not lose that
  behaviour.
- See §5 for the reasoning, and for the stated cost of the dark theme this
  requirement defers.

### 3.4 Amendments to existing requirements

**R-2.7 AC1** — append: *"The header's home link may render the brand logo
in place of a text wordmark; where it does, R-9.3 AC2 governs its
accessible name, so this criterion's 'links to Home' remains satisfiable by
name and not merely by position."*

**R-4.1 AC3** — append: *"'Image tags are present' is satisfied by presence
alone; R-9.7 AC3 additionally constrains the value to a 1200×630 raster
image, because the value in force until this amendment (`/favicon.svg`) is
an SVG that the major social platforms do not render, producing no image at
all in practice. Closes register row P7."*

**R-5.1** — add:

- **AC5 (new)** — Given the brand palette is applied, When any
  text/background pairing on the site is compared against R-9.5's table,
  Then it is one of the pairings recorded there as passing. R-5.1 AC3's
  abstract rule is unchanged; this criterion names the concrete pairings
  that satisfy it for this palette.
- **AC6 (new)** — Given text rendered over the hero image or any
  photographic background, When contrast is measured at 320px, 768px and
  1920px viewport widths, Then it passes at every width (R-9.5 AC3).
  Automated contrast engines compute against a solid computed background
  colour and cannot evaluate text over an image; this criterion is
  explicitly the gap axe does not cover, not a restatement of AC1.

**R-5.2** — add:

- **AC3 (new)** — Given the home page on a simulated mobile connection,
  When audited, Then Cumulative Layout Shift is under **0.1**. Not
  previously stated because nothing on the page could shift — the site had
  no images and no web fonts. Both arrive with this amendment, and they are
  the two canonical CLS sources.
- **AC4 (new)** — Given this amendment is deployed, When R-5.2 AC1 is next
  executed, Then it is compared against the pre-brand baseline per R-9.8
  AC6, with any regression reported rather than absorbed.
- Note to AC2 (no change to its 50 KB threshold): R-9.8 AC7 additionally
  requires the site's **own** JavaScript to remain 0 bytes. AC2's budget
  would tolerate a brand that shipped 49 KB of script; this program's
  actual position is that it ships none, and that position should be stated
  rather than inferred from the margin.

### 3.5 Amendment to §4 — Test data and preconditions

Correct one stale row and add five:

| Item | Value | Source |
|------|-------|--------|
| ~~Company legal name and address — `1123 Test St Chicago, IL1`~~ | **Superseded 2026-09-17:** `haroonie.ai LLC`, 2501 Chatham Rd, Suite N, Springfield, IL 62704, USA. The struck value was owner-entered *test data*, never real (see `status/placeholder-content.md`). Corrected here because cross-checking the brand sheet's business card against it surfaced that REQ-001 §4 still carried the test value after the real one had landed | Owner, 2026-09-17 (E6 §5.2) |
| Brand palette | `#0A2A87` Deep Navy (Primary); `#155BEF` Royal Blue (Brand); `#2E83FF` Bright Blue (Accent); `#66B4FF` Light Blue (Highlight); `#F5F8FF` Light Gray (Background) | Owner-supplied brand sheet, 2026-09-17 |
| Computed contrast ratios for that palette | See §3.2 — eleven pairings, computed this session by the WCAG 2.x relative-luminance formula | REQ-001-A3 §3.2, 2026-09-17 |
| Typeface | Manrope — Regular 400 (body), Bold 700 (headings), ExtraBold 800 (logo). Self-hosted `woff2`, Latin subset | Owner-supplied brand sheet, 2026-09-17; delivery method per §2.3 |
| Pre-brand performance baseline (for R-9.8 AC6) | Production home page: Lighthouse Performance **100**, LCP **~0.96–1.2s**, site's own JS **0 bytes**, plus ~938 bytes Cloudflare-injected | `status/PERF-001-wave6-audit.md` (2026-09-14), as corrected by REQ-001-A2 §3.3 |
| Pre-brand CSP, for R-9.2 AC3's byte-identical comparison | The policy `src/lib/csp.ts` builds as of commit `882d73a` — `font-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:`, no external origin in any directive | `src/lib/csp.ts`, read 2026-09-17 |

---

## 4. Conflicts between the supplied material and already-approved facts

The brand sheet is a design artefact, produced without reference to the
copy and legal decisions this program settled on 2026-09-17. Four of its
elements conflict with approved facts. **None is adopted.** Each is
recorded here with its default, because the failure mode is not adopting
them deliberately — it is adopting them by osmosis, because they were in a
picture the owner sent.

### 4.1 Business-card contact details — three separate conflicts

| Card shows | Approved fact | Verdict |
|---|---|---|
| `hello@haroonie.ai` | `dev@haroonie.ai` — owner decision 2026-09-17, verbatim *"Modify to dev@haroonie.ai"* (`status/E6-copy-for-review.md` §4.2), live on `/contact/` and asserted by R-2.4 AC1 | **Not adopted.** The approved address governs. Publishing `hello@` would publish an address with no confirmed mailbox behind it and would break R-2.4 AC1's "actionable" clause the moment mail bounced |
| `(312) 555-0100` | No phone number has ever been supplied to this program | **Not adopted, and specifically must not be.** `555-0100`–`555-0199` is the reserved fictional-number range in the North American Numbering Plan — it exists precisely so that mockups can show a number that reaches nobody. Publishing it would be inventing a contact fact, which REQ-001 §1.3 prohibits outright. A real number may be published only if the owner supplies one (**E18**) |
| `Chicago, IL` | `Springfield, IL` — `haroonie.ai LLC`, 2501 Chatham Rd, Suite N, Springfield, IL 62704, owner-supplied 2026-09-17 and already live in Privacy and Terms (register rows P13, P14) | **Not adopted.** Publishing a second, different city alongside the registered address in the legal pages would put two contradictory locations on one site. §1.3 forbids inventing the fact; internal consistency forbids carrying both |

**Default applied:** the site publishes the approved email and the
registered address, and no phone number at all. The business card is
treated as what it is — an unproduced print artefact showing sample data —
not as a source of contact facts. **E18** asks the owner to confirm or
correct this.

### 4.2 The mockup's "Projects" navigation item

The website-header mockup shows five nav items: Services, About,
**Projects**, Contact, plus a "Get Started" button. `Projects` is not one
of the six approved routes (REQ-001 §1.1), and REQ-001 §1.2 explicitly
places *"client names, logos, testimonials or case studies"* **out of MVP
scope** — which is what a Projects page would necessarily contain.

**Default applied: not adopted.** Adding it would require a seventh route,
new page content, and a direct reversal of an approved out-of-scope
decision — and, given §1.3, it could not be populated without real client
work the owner has not supplied. Adopting it is a scope change, raised as
**E19**, not a styling decision.

### 4.3 The mockup's "Get Started" call to action

The approved home CTA is `Get in touch` (`src/content/home/index.md`,
`ctaLabel`), landed under E6 and asserted by R-2.1 AC2. The mockup shows
`Get Started` in both the header and the hero.

Two distinct changes are bundled in that mockup, and they should not be
decided together:

1. **Relabelling the CTA** from "Get in touch" to "Get Started" — a copy
   change to an owner-approved value, requiring the owner's word under
   §1.1's sign-off gate.
2. **Adding a second CTA in the header** — a structural change. R-2.1 AC2
   requires **exactly one** primary CTA on the home page. A header button
   plus a hero button is two, and would fail that criterion as written.

**Default applied: neither is adopted.** The CTA keeps its approved label
and its single-instance placement; the brand restyles it (R-9.5 AC2 governs
its colour) without renaming or duplicating it. Raised as **E19** together
with 4.2, since both are read off the same mockup.

### 4.4 Taglines and marketing copy in the supplied images

The images contain text that is not approved page copy: `IDEAS → SOLUTIONS
→ IMPACT` (the tagline lockup), `TECHNOLOGY FOR A BRIGHTER TOMORROW` (the
sheet's footer bar), `A BRIGHTER TOMORROW TOGETHER` (the hero banner), and
a hero subheading — *"Technology, data, and automation for what's next."* —
that differs from the owner-approved subheading now live, *"Technology,
data, automation, and AI solutions designed around your business."*

**Defaults applied, distinguishing two cases:**

- `IDEAS → SOLUTIONS → IMPACT` is **permitted, but only as part of the logo
  artwork itself**, where it appears in every supplied variant and is
  typographically inseparable from the mark. It is owner-supplied and
  travels with the logo. It is **not** adopted as free-standing page copy,
  a section heading, or a hero strapline.
- `TECHNOLOGY FOR A BRIGHTER TOMORROW`, `A BRIGHTER TOMORROW TOGETHER`, and
  the mockup's alternative hero subheading are **not adopted at all**. They
  are marketing copy appearing only in presentation chrome, they have not
  been through E6's sign-off, and the last one would silently overwrite a
  line the owner approved today.
- The hero banner's headline (*"From Ideas to Real-World Impact"*) and its
  subheading (*"Technology, data, automation, and AI solutions designed
  around your business."*) **already match the approved copy**, modulo the
  terminal full stop on the heading. Approved copy governs the punctuation;
  no change either way.

This is recorded as ambiguity **U29** rather than an escalation, because
the default is safe and blocks nothing: the site keeps the copy the owner
approved. It becomes a decision only if the owner wants any of the
unadopted lines published.

---

## 5. Themes — analysed, not assumed

The sheet supplies a "logo on dark" variant. That is the whole of the
evidence for a dark theme; the sheet contains no dark-theme page design, no
dark surface tokens, and no dark-mode contrast guidance. The variant's
stated purpose on the sheet is *"For dark backgrounds"* — which the app
icon, the social avatars, the business card's reverse, the sheet's own
footer bar, and (per R-9.7) the Open Graph image all are, none of them a
website theme.

**Recommendation: light-only for MVP (R-9.9). Dark theme deferred, not
rejected.**

**What a dark theme would cost, stated so the deferral is a judgement and
not an evasion:**

| Cost | Detail |
|---|---|
| Contrast surface doubles | Every pairing in §3.2 must be re-derived for dark surfaces. Some invert cleanly (`#66B4FF` on `#0A2A87` is 5.63:1), some do not (`#155BEF` on `#0A2A87` is 2.23:1 — unusable, so the *brand* blue cannot be a link colour on the *brand* navy). A dark theme is not a token swap; it needs its own decisions |
| Test surface doubles | `tests/accessibility.spec.ts` scans six routes; a second scheme means twelve scans, across three engines. Same for `responsive.spec.ts` and any contrast checks. This is real CI time added to every build, permanently |
| The logo needs runtime switching | Two SVG variants selected by `prefers-color-scheme`, in the header, on every page — the first place a media-query-dependent asset enters the build |
| A new class of defect | "Looks right in light, broken in dark" is invisible to anyone developing in one scheme. It is caught only by deliberately testing both, every time |
| Go-live is close | The register is within two rows of empty (`status/E6-copy-for-review.md` §7). A dark theme is the kind of work that expands to fill whatever time precedes launch |

**What deferring costs:** essentially nothing functional. Visitors with a
dark system preference see a light site — as they do on most commercial
sites today — and R-9.9 AC1 makes that a deliberate, tested behaviour
rather than an accident. Nothing in R-9.1's token architecture forecloses
adding a dark theme later; a token layer is in fact the precondition for
adding one cheaply, so the recommended MVP work makes a future dark theme
easier, not harder.

**One correction that is not deferrable** and is included in R-9.9 AC2
regardless: `BaseLayout.astro` today declares `color-scheme: light dark`
while hard-coding a white background. That claim is false in the current
build, before any brand work. It should read `light` until the day a dark
theme actually exists.

Recorded as **E22** — a decision request, not a blocker. If the owner says
nothing, the light-only default stands and is safe.

---

## 6. Ambiguities and assumptions (continuing REQ-001 §5 — U20 onward)

| # | Ambiguity | Safest default applied |
|---|-----------|------------------------|
| U20 | Should Manrope be self-hosted or loaded from Google Fonts? No owner guidance exists. | **Self-hosted** (§2.3). It needs no CSP change at all, is faster, and sends nothing about a visitor to a third party. Google Fonts would widen `style-src` and `font-src` contrary to U16's `script-src`-only rule, and would add a third-party recipient to a GDPR-framed privacy policy (A4). If the owner prefers Google Fonts, that is **E21**, approved on its own terms. |
| U21 | Which Manrope weights, formats and character subsets ship? The sheet names three weights but says nothing about delivery. | Regular 400, Bold 700, ExtraBold 800 — exactly the three the sheet names, nothing more. `woff2` only (universally supported by every browser this program tests). Latin subset only; the site is English-only per A7. |
| U22 | Font-loading strategy, and its layout-shift consequence — no guidance exists, and this program has never shipped a web font. | `font-display: swap` with a metrics-matched fallback stack, so text is never invisible and the swap does not reflow the page. Correctness is asserted by measurement, not by the choice: R-5.2 AC3's CLS < 0.1 is the actual gate, and if `swap` cannot hold it, the strategy changes rather than the threshold. |
| U23 | The palette supplies no neutral or grey text ramp — five blues and an off-white, nothing for body copy or borders. | Retain the existing neutrals already shipping in `BaseLayout.astro` (`#14171a` ink at ~18:1 on white, `#5b6470` muted at ~6.0:1, `#e2e5ea` border) as the neutral ramp, and use `#0A2A87` Deep Navy for headings. Both approved-adjacent facts hold: the palette is applied where it was specified, and body text keeps a neutral that comfortably passes AA. Inventing a new grey ramp when a conforming one already ships would be change for its own sake. |
| U24 | The palette supplies no semantic status colours, but R-3.1 AC2 requires an inline validation message on the contact form. | Derive one error colour meeting 4.5:1 on the form's background, and never signal validation state by colour alone — the message text, and a programmatic association with the field, carry the meaning (which is what R-3.1 AC2 actually asserts). Recorded rather than left for whoever implements Wave 5 to improvise. |
| U25 | Should body copy be Deep Navy `#0A2A87` (12.40:1) or a neutral near-black? Both pass contrast. | Neutral near-black for body copy; Deep Navy for headings and the logo. Long passages of saturated colour are harder to read than a neutral at the same measured ratio, and contrast conformance is a floor, not the whole of legibility. Cosmetic and cheap to reverse; stated so it is a decision rather than a drift. |
| U26 | How may `#2E83FF` Bright Blue and `#66B4FF` Light Blue be used, given both fail AA for body text on light backgrounds (§3.2)? | `#2E83FF`: large text (≥24px, or ≥18.7px bold), non-text UI, and decorative fills only — exactly as the hero banner uses it. `#66B4FF`: non-text decoration only on light surfaces; permitted for text only on `#0A2A87` (5.63:1). Encoded as R-9.5 AC1/AC2 so it is enforced, not remembered. |
| U27 | Does the site gain a dark theme, given the "logo on dark" variant? | **No, for MVP** (§5, R-9.9). The dark logo variant serves the Open Graph image, app and social icons, and any dark section band — none of which is a site theme. R-9.1's token layer keeps a future dark theme cheap to add. Raised as **E22** for the owner to overrule if they want one. |
| U28 | Does the header logo replace the text wordmark, or sit beside it? | Replace, using the horizontal lockup (mark + wordmark), which is what the mockup shows and what the sheet calls the primary logo. R-9.3 AC2 keeps the accessible name `haroonie.ai`, so nothing that depends on the wordmark's text — R-2.7 AC1, the a11y scan, the smoke suite — changes behaviour. |
| U29 | May the taglines and hero copy in the supplied images be published? | Only `IDEAS → SOLUTIONS → IMPACT`, and only as part of the logo artwork it is drawn into (§4.4). The other three lines are unapproved marketing copy and are not adopted. Approved E6 copy governs every page string. |
| U30 | Should the hero use the supplied photographic banner, or the abstract brand pattern? | Use the owner's banner, within R-9.8's format, dimension and byte budget, and treat it as decorative (`alt=""`) since the `<h1>` beside it carries the meaning. Two things recorded rather than decided unilaterally: the photograph depicts the **Chicago** skyline while the registered entity address is **Springfield, IL** (a decorative image is not a factual claim, so §1.3 is not engaged — but it is worth the owner's eye, given §4.1's city conflict); and if the image cannot meet R-9.8 AC4's 200 KB budget without visible degradation, the brand pattern is the fallback, because the budget is a requirement and the photograph is a preference. |
| U31 | How do icons ship — inline SVG, a sprite, or an icon library? | Inline SVG or a same-origin SVG sprite, authored from the supplied assets. Never an icon font (a11y and FOIT problems) and never a runtime library (R-9.8 AC7 keeps the site's own JS at 0 bytes). Which of inline-vs-sprite is an Engineer decision, not an owner one. |
| U32 | Where do brand tokens live, and in what form? | One CSS custom-property definition, imported once by `BaseLayout.astro`, as the single source R-9.1 requires. Form and file path are Engineer decisions; the single-source property is the requirement. |
| U33 | Do brand assets go through `astro:assets` or straight into `public/`? | `astro:assets` for every raster the pages render (it gives content hashing, responsive `srcset` and intrinsic dimensions — the machinery R-9.8 AC1/AC2 needs, already available since `sharp` ships). `public/` only for files needing a stable, externally-referenced URL: the favicon set, the apple-touch-icon, and the Open Graph image, which crawlers and previously-shared links resolve by fixed path. |

---

## 7. Escalations requiring human action (continuing `status/STATUS.md` — E17 onward)

These continue `status/STATUS.md`'s program-wide escalation ledger, whose
highest assigned number to date is **E16** (REQ-001-A2). Numbering follows
the owner's 2026-09-15 instruction to use STATUS.md's scheme, not REQ-001
§6's own separate, already-resolved local E7/E8 pair.

| # | Item | Blocks |
|---|------|--------|
| **E17** (new) | **Production brand source assets must be supplied — the actual files, not renders.** The two images are PNGs; a production SVG cannot be extracted from a rasterised mockup (§0.3). Needed, in rough priority order: **(a)** horizontal logo lockup, SVG, full-colour and on-dark; **(b)** logo mark alone, SVG; **(c)** favicon set — SVG mark, `.ico` carrying 16/32/48, 180×180 apple-touch-icon; **(d)** the Open Graph image, 1200×630 PNG or JPEG (closes **P7**); **(e)** the three service icons as SVG; **(f)** the hero banner at its full source resolution (≥2400px wide) plus its licence (see E20); **(g)** the Manrope `woff2` files with their licence file; **(h)** *optional* — app/social icon rasters (512, 192), monochrome and stacked logo variants, the brand pattern as an SVG tile. Items (a)–(d) are the minimum viable set: the site can be branded without (e)–(h) but not without those four. | R-9.3, R-9.4, R-9.7, R-9.8, and the closure of register row **P7**. Does **not** block R-9.1, R-9.2, R-9.5 or R-9.9 — tokens, typography, colour rules and the theme/`color-scheme` correction are all implementable from the palette and typeface alone, which are already supplied |
| **E18** (new) | **Confirm the three business-card contact details are not to be published** (§4.1): `hello@haroonie.ai` versus the approved `dev@haroonie.ai`; `(312) 555-0100`, which lies in the NANP's reserved fictional range and cannot be published under §1.3 at all; and `Chicago, IL` versus the registered `Springfield, IL`. If the owner wants a real phone number on the site, it must be supplied — none has ever been given to this program. | Nothing — the default (publish the approved values, publish no phone number) is safe and already live. Recorded so the divergence is a decision on record rather than something a later reader assumes was overlooked |
| **E19** (new) | **Decide on the two scope items in the header mockup** (§4.2, §4.3): a **"Projects"** nav item, which would be a seventh route and would need client work REQ-001 §1.2 places out of MVP scope and §1.3 forbids inventing; and **"Get Started"**, which bundles a relabel of the owner-approved `Get in touch` CTA with the addition of a second header CTA that would break R-2.1 AC2's "exactly one primary CTA". | Nothing today — the default keeps the six approved routes and the approved CTA. Becomes a material requirement change if the owner wants either |
| **E20** (new) | **Brand asset provenance and licensing** (R-9.6). Before any binary asset is published on a public commercial site, this program needs, per asset: who created it, under what licence, and whether that licence permits commercial use. The hero photograph is the sharp end — a stock or third-party image used outside its licence is a legal exposure, and unlike a code defect it is not cheap to unwind after publication. This program cannot determine provenance by looking at a PNG; only the owner can say where these came from. | R-9.6, and the publication of any asset whose provenance is unresolved. Assets with confirmed provenance may ship without waiting for the rest |
| **E21** (new — conditional) | **If the owner prefers Google Fonts over self-hosting** (§2.2), that widens `style-src` with `https://fonts.googleapis.com` and `font-src` with `https://fonts.gstatic.com` — two directives beyond the `script-src`-only scope **U16** recorded when E14 was approved, plus a third-party recipient a GDPR-framed Privacy Policy (A4) would need to disclose. That is a security/architecture decision of its own, approved on its own terms, not something a styling approval carries with it. | Nothing today — the amendment specifies self-hosting, which needs no CSP change. Only relevant if the owner overrides §2.3 |
| **E22** (new — decision request) | **Does the site gain a dark theme?** (§5). The sheet's "logo on dark" variant raises the question without answering it. This document recommends light-only for MVP and states the cost of the alternative: contrast surface doubles, CI scan surface doubles, the logo becomes a media-query-dependent asset, and a new invisible-in-one-scheme defect class appears. Adopting a dark theme would be a material requirement change (new ACs, not a restyle). | Nothing — R-9.9's light-only default is safe, tested, and leaves a future dark theme cheap to add on top of R-9.1's token layer |

Consistent with REQ-001 §6's standing position: agents proceed with all
work not dependent on the above, and do not acquire, license, or create
brand assets on the owner's behalf.

---

## 8. Scope — explicitly in, explicitly out

**In scope for this amendment:**

- Applying the supplied palette, typeface and logo to the six existing
  routes and the 404 page.
- A single-source brand token layer (R-9.1).
- Self-hosted Manrope with no CSP change (R-9.2).
- Header logo, service icons, favicon set, app icons, and a real 1200×630
  Open Graph image — the last of which closes register row **P7**
  (R-9.3, R-9.4, R-9.7).
- Contrast rules derived from the palette's actual values, extending the
  existing axe coverage rather than duplicating it (R-9.5, R-5.1 AC5/AC6).
- Hero imagery inside an explicit performance budget, with a stated
  comparison against the pre-brand baseline (R-9.8, R-5.2 AC3/AC4).
- Asset provenance and licensing as a shipping precondition (R-9.6).
- A light-only theme policy, and the correction of the current false
  `color-scheme: light dark` declaration (R-9.9).

**Explicitly out of scope:**

- **Any new page or route.** The six approved routes and the 404 page are
  the whole site. "Projects" is refused in §4.2.
- **Any change to approved page copy.** Every string on every page stays
  exactly as the owner approved it under E6. The CTA is not relabelled;
  the hero subheading is not swapped for the mockup's; no tagline becomes
  page copy (§4.4).
- **A dark theme** (§5, E22).
- **A brand-values section.** The sheet's five value icons are marked
  optional on the sheet itself and have no page to live on (R-9.4 scope
  note).
- **Any CSP change** (§2.3, R-9.2 AC3). If a font decision appears to
  require one, that is E21, not a detail.
- **Any client-side JavaScript.** No theme toggle, no font loader, no icon
  library, no animation runtime (R-9.8 AC7).
- **Print collateral.** The business card is not a website deliverable, and
  the details on it are refused as web content in §4.1.
- **Lifting `robots.txt`'s `Disallow: /`.** That remains its own explicit
  owner decision, unchanged by this amendment — though closing P7 removes
  one of the two rows standing between the register and empty.
- **Implementation of any of the above.** This document specifies; it
  writes no CSS, no component, no test and no asset.

---

## 9. Traceability (R-8.1)

| AC | Verified by |
|---|---|
| R-9.1 AC1, AC3 | Playwright, reading computed styles before and after a single token edit and rebuild |
| R-9.1 AC2 | Repository/build-artifact check, same class as R-1.4's secret scan |
| R-9.2 AC1, AC2, AC6 | Playwright — computed `font-family`, request interception for third-party origins, `<head>` inspection |
| R-9.2 AC3 | Direct comparison of the deployed CSP header against the §3.5 recorded pre-brand value; naturally belongs with the existing production header checks (R-7.8 AC2) |
| R-9.2 AC4 | Build-artifact inspection of the shipped font files |
| R-9.2 AC5, R-5.2 AC3 | Lighthouse (CLS), via the existing `tests/lighthouse.spec.ts` audit |
| R-9.3 AC1–AC3, AC5, AC6 | Playwright — accessible-name computation, viewport rendering at 320/1920, focus-state inspection |
| R-9.3 AC4, R-9.7 AC1, AC2 | Request/response inspection of the asset URLs and their content types |
| R-9.4 AC1, AC2, AC4 | Playwright accessibility-tree inspection; the existing axe scan covers the generic case |
| R-9.4 AC3, R-9.8 AC7 | Transferred-JS measurement against the production hostname, extending R-7.8 AC3's existing check |
| R-9.5 AC1, AC2, AC4, AC5, AC6 | The existing `tests/accessibility.spec.ts` axe scan (`color-contrast` is a serious-impact rule already inside it), plus targeted computed-style assertions for the specific pairings |
| R-9.5 AC3 / R-5.1 AC6 | Explicitly **not** axe — automated engines cannot evaluate text over an image. A recorded manual verification at the three named widths (R-8.1's manual path), or a pixel-sampling check if one proves reliable |
| R-9.6 AC1–AC3 | Recorded manual verification — an asset register held beside `status/placeholder-content.md` |
| R-9.7 AC3 | Playwright reading `og:image`/`twitter:image` and fetching the target to confirm type and 1200×630 dimensions. Closes **P7** |
| R-9.7 AC4, AC5 | Recorded manual verification — legibility at thumbnail and 16×16 is a human judgement |
| R-9.7 AC6, R-9.8 AC4 | Transferred-byte measurement |
| R-9.8 AC1–AC3, AC5 | Playwright — rendered HTML inspection (`srcset`, intrinsic dimensions, `loading`, `fetchpriority`, `alt`) |
| R-9.8 AC6 / R-5.2 AC4 | The existing Lighthouse audit re-run against the production hostname and compared to `status/PERF-001-wave6-audit.md`; same mechanism and same pattern as R-7.8 AC4 |
| R-9.9 AC1, AC2, AC4 | Playwright with `emulateMedia({ colorScheme })` across light, dark and no-preference, plus root `color-scheme` inspection |
| R-9.9 AC3 | Recorded manual verification of where each logo variant is used |

Every AC above is either observable in the rendered UI or verifiable
against a build artefact or a live response. The five that rest on human
judgement (R-9.6 AC1–AC3, R-9.7 AC4/AC5, R-9.9 AC3) are marked as recorded
manual verifications under R-8.1's existing provision, in the same way
R-7.7's DNS criteria are — not left as automated checks that cannot in fact
be automated.

---

## 10. Summary for the owner

**What you get.** Your brand applied to the live site: Manrope throughout,
your five blues used where each one actually works, your logo in the header
in place of plain text, your mark as the favicon, and a proper 1200×630
share image — which also closes one of the last two open items standing
between the content register and empty.

**The two things worth your attention.**

*Fonts and the CSP.* The brand needs Manrope; the site's security policy
allows no external origins. **Self-hosting the font avoids the problem
entirely** — the policy is not touched, the site gets faster than the
alternative, and nothing about a visitor reaches Google. The alternative,
Google Fonts, would widen two parts of the policy you locked down last week
and would put a third party into a GDPR-framed privacy policy. The
recommendation is self-hosting, and it costs three files.

*Four things in the mockups are not being adopted, deliberately.* The
business card's `hello@haroonie.ai`, `(312) 555-0100` and `Chicago, IL`
each contradict something you decided today — and that phone number is in
the range reserved for fiction, so it could not be published regardless.
The mockup's **Projects** nav item would be a seventh page needing client
work you have said is out of scope. **"Get Started"** would rename the CTA
you approved and add a second one, which breaks a rule requiring exactly
one. None is adopted; each is on the record as **E18** and **E19** if you
want any of them.

**What is needed from you.**

1. **E17 — the real asset files.** Pictures of a logo are not a logo. The
   minimum is: the horizontal logo as SVG, the mark alone as SVG, the
   favicon set, and a 1200×630 share image. Everything else can follow.
2. **E20 — where these came from, and their licences.** Especially the
   hero photograph. Publishing an image without the right to use it is the
   one mistake here that is expensive to undo.
3. **E18 / E19** — confirm the refusals above, or overrule them.
4. **E22 — dark mode: yes or no?** The recommendation is no, for now. Doing
   it doubles the contrast and testing surface and adds a class of bug that
   is invisible unless you deliberately look for it. Saying nothing leaves
   the site light-only, which is safe and tested either way.
5. **E21** — only if you want Google Fonts after reading §2.

**What this does not touch.** No new pages. No copy changes. No CSP change.
No JavaScript. No change to what any page does or says — only to how it
looks.
