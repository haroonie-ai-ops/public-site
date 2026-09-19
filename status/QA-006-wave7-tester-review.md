# QA-006 — Independent Tester Review: Wave 7 (R-8.2), and an audit of the R-8.1 traceability matrix

**Raised:** 2026-09-18
**Reviewer:** Tester, independently of the Engineer (CLAUDE.md § Roles)
**Scope:** R-8.2 AC1 (failure classification), plus an independent audit of
`status/R8-TRACEABILITY-MATRIX.md`, which claims 135 acceptance criteria
mapped with **0 gaps**.
**Overall verdict:** **NOT FIT FOR ACCEPTANCE AS PRESENTED.** The product is
in materially good shape. The *traceability claim about it* is not. The
"0 gaps" headline does not survive audit.
**Classification summary:** 1 PRODUCT_DEFECT · 9 TEST_DEFECT · 4
DOCUMENTATION/PROCESS · 1 ENVIRONMENT (diagnosed) · 0 FLAKY_TEST ·
0 AUTHENTICATION · 0 TEST_DATA

---

## Why this review exists and what it did differently

R-8.2 AC1 requires that when the Tester reports, each failure is classified
as product failure, automation defect, flaky behaviour, environmental
failure or test-data problem. That is discharged below: every finding
carries a classification, severity, evidence and a recommended action.

But the owner's instruction was pointed: the Engineer built nearly all of
Wave 7 *and* built the document that certifies it. The matrix's own preamble
concedes the right limitation — *"it records where verification lives, not
how good it is"* — and then a summary table converts that into **GAP: 0**,
which is the number a reader carries away.

So this review did not re-read the matrix. **It read REQ-001's acceptance
criteria, then read the code, then asked whether the named test asserts the
named criterion.** Where a row credited a test, I opened the test. Where a
row credited a document, I opened the document. Where a row credited
production, I queried production.

**The finding that matters most: the mis-mapping is systemic, not
incidental.** A large minority of the rows sampled credit evidence that
belongs to a *different acceptance criterion* — frequently the adjacent one.
The matrix's third pass is described as *"every result was reviewed by hand,
because citation-matching is not evidence"*. On the evidence of the rows I
checked, that hand-review did not consistently re-read the AC text it was
mapping to.

I also checked the Engineer's work in both directions. **Four claims I
specifically set out to falsify held up**, and one severe finding produced
by my own delegated audit was wrong and is recorded as rejected (§7).

---

## Method

- Authoritative AC text taken from `requirements/REQ-001-mvp-public-website.md`
  only. The matrix's paraphrase of an AC was never accepted as the AC.
- Full suite executed locally: `npx playwright test` (see §6).
- `npx playwright test --list` to confirm the pre-merge gate's real contents.
- Live production probes against `https://www.haroonie.ai/` and
  `https://haroonie.ai/` via `curl`.
- External DNS resolution via `nslookup` against `8.8.8.8` — the check E12
  approved and Wave 4 did not perform (§4.10).
- GitHub REST for ruleset, check-run and workflow-log facts.
- Source inspection of every test file credited by a sampled row.

**No application or test code was modified.** Per the assignment and
CLAUDE.md, findings are reported, not fixed.

---

## 1. The headline claim, audited

| Matrix says | Audit finds |
|---|---|
| 135 rows, arithmetic self-consistent | **Confirmed.** 135 rows; tallies 83/41/8/3 match the summary exactly. |
| "A row marked AUTOMATED means a named test asserts the criterion" | **Not reliably true.** Rows credit tests that do not contain the assertion (§2.1–2.3), and rows credit *build output* and *source files*, which are not tests at all. |
| "The generator asserts that the mapping covers exactly the extracted set, so this document cannot silently drift" | **Unsubstantiated.** No generator exists in the repository — no script, no `package.json` entry, no `scripts/` directory. The matrix is a hand-maintained Markdown table. It can drift, and the mis-mappings in §2 are that drift. |
| **GAP: 0** | **Not sustainable.** At least six criteria have no assertion anywhere (§2.1–2.2), one is unmet in production (§3.1), one is unmet as written (§3.3), and one is an unverified limitation counted as MANUAL (§4.12). |

**The gap-closure narrative does not add up either.** The prose says *"Four
were fixed with new tests"* and then lists R-5.1 AC2 and R-9.3 AC5, plus
R-5.2 AC4 / R-7.8 AC4 / R-9.8 AC6 *"— one gap wearing three numbers"*.
Counted as acceptance criteria that is **five**; counted as gaps it is
**three**. It is not four on either basis. (Five is the number that makes the
total nine: 5 + 1 + 2 + 1.) Separately, **R-4.5 AC1 is counted among the nine
closed gaps** although it was never failing — the amendment only clarified
*why* it passes. Small things, but they are the same species as §4.1: figures
restated rather than recomputed.

**Contradiction with the approved requirement.** `REQ-001` § R-8.1's own Note
(2026-09-18) still reads: *"126 map to a named test, a dated manual
verification, or enforcing CI configuration; 3 are blocked on E4; **9 are
gaps**."* The matrix now claims zero. The approved requirements document and
the certifying document disagree about the program's own state.
**Classification: DOCUMENTATION/PROCESS. Severity: Medium.**
**Recommended action:** whichever number survives this review, make REQ-001
and the matrix agree, in one edit, with the date.

---

## 2. Findings — TEST_DEFECT

### 2.1 Finding 1 — No CLS assertion exists anywhere in the suite; three rows credit one
**Classification: TEST_DEFECT · Severity: High**

- **Scenario:** The brand wave shipped a web font. R-5.2 AC3 was *added by
  REQ-001-A3 for exactly that reason* — *"Not previously stated because
  nothing on the page could shift — the site had no images and no web fonts.
  Both arrive with the brand, and they are the two canonical CLS sources."*
- **Expected:** a test asserting Cumulative Layout Shift < 0.1.
- **Actual:** none exists. `grep -rni "cls|cumulative-layout|layout-shift|layout shift" tests/`
  returns **zero matches across the entire suite**. `tests/lighthouse.spec.ts`
  contains exactly one test, asserting Performance >= 95 (via `playAudit`
  thresholds) and LCP < 2500ms. There is no CLS audit read, and no CLS
  assertion.
- **Evidence:** `D:\dev\public-site\tests\lighthouse.spec.ts` in full; the
  grep above.
- **Rows affected:** R-5.2 AC3 (*"lighthouse.spec.ts — CLS under 0.1"*),
  R-9.8 AC3 (*"lighthouse.spec.ts — CLS under 0.1"*), R-9.2 AC5
  (*"lighthouse.spec.ts CLS budget — font-display swap, no layout shift"*).
  All three marked **AUTOMATED**.
- **Recommended action:** read `lhr.audits['cumulative-layout-shift'].numericValue`
  in `lighthouse.spec.ts` and assert `< 0.1`, exactly as LCP is already
  handled two lines above. Until then these three rows are GAPs. This is a
  ~4-line fix and the single highest-value remediation in this review.

### 2.2 Finding 2 — Six contrast criteria credited to `brand-tokens.spec.ts`, which contains none of them
**Classification: TEST_DEFECT · Severity: High**

- **Expected:** assertions that body text meets 4.5:1; that `#2E83FF` /
  `#66B4FF` are never body-text foreground; that button labels meet 4.5:1
  against their own fill; and that contrast over the hero/gradient is
  measured **against the actual pixels behind each glyph** at 320px, 768px
  and 1920px.
- **Actual:** `tests/brand-tokens.spec.ts` contains eleven tests. They cover
  R-9.1 AC1/AC2/AC3, R-9.2 AC1, R-9.5 AC4 (form-field borders and the focus
  ring, both at 3:1), R-9.5 AC5, and R-9.9 AC1/AC2. **No 4.5:1 assertion
  exists in the file — or anywhere in the suite:** `grep -rn "4\.5" tests/`
  returns nothing. **No test uses 768px:** the only viewport widths in the
  suite are `[320, 1920]` in `cross-browser.spec.ts` and `responsive.spec.ts`,
  and both measure horizontal overflow, not contrast.
- **Evidence:** enumeration of every `test(` title in
  `D:\dev\public-site\tests\brand-tokens.spec.ts`; the two greps above.
- **Rows affected, all marked AUTOMATED:**
  - R-5.1 AC3 — *"computed contrast against the R-9.5 table"* — absent
  - R-5.1 AC5 — *"every pairing checked against R-9.5"* — absent
  - R-5.1 AC6 — *"contrast at 320/768/1920 widths"* — absent
  - R-9.5 AC1 — *"computed contrast for every pairing"* — absent
  - R-9.5 AC2 — *"bright/light blue carry no text"* — absent
  - R-9.5 AC3 — *"contrast at three viewport widths"* — absent
- **Mitigating, and stated fairly:** `accessibility.spec.ts` runs axe on all
  six routes and axe's `color-contrast` rule is *serious* impact, so ordinary
  text-on-solid-background contrast **is** in fact gated. That covers much of
  R-5.1 AC3's practical risk. It does **not** cover R-9.5 AC1's specific
  palette prohibition, AC2's button-fill case, or AC3/AC6 at all — and
  R-9.5's own rationale says so explicitly: *"it covers the two cases axe
  cannot compute at all: text over imagery (AC3), and contrast at viewport
  widths other than the one scanned (AC3)."* Those two cases are precisely
  the ones with no test.
- **Also mitigating, and important to the Engineer's credit:** the analysis
  these ACs demand **was actually done** — it is recorded in
  `src/pages/index.astro`'s frontmatter, which states that R-9.5 AC3 is
  *"satisfied here by construction instead of by measurement"* because both
  gradient stops are known flat brand surfaces, gives the worst-case backdrop
  (`#f5f8ff`) and the three resulting ratios (11.66:1, 6.54:1, 5.23:1), and
  notes for AC2 that the CTA's white label on `--accent` is 5.56:1 where the
  same button on `--accent-decor` would be 3.62:1 and fail. **That reasoning
  is sound and I do not dispute the conclusions.**
- **So the real defect is narrower, and it is a regression gap.** The
  conclusions hold today and nothing guards them tomorrow. Change
  `--surface-subtle`, or wire the CTA to `--accent-decor`, and no test fails
  — the very failure mode `keyboard-focus.spec.ts` was written to close
  (*"the site had a focus ring defined in BaseLayout and NOTHING asserted it.
  No test would have noticed if it were deleted."*). The same principle was
  applied to the focus ring and not to the palette. A row may not be marked
  AUTOMATED on the strength of a source comment.
- **Recommended action:** either implement the per-pairing and
  three-width checks (`tests/support/contrast.ts` already exports
  `ratioBetween`, `flatten` and `contrastRatio` — the machinery is built and
  used by `keyboard-focus.spec.ts`), or re-mark these six rows GAP and
  re-credit R-5.1 AC3 to `accessibility.spec.ts`, which actually performs it.

### 2.3 Finding 3 — The Lighthouse "baseline comparison" gap closure is a `console.log`, not an assertion, and runs against the wrong host
**Classification: TEST_DEFECT · Severity: Medium-High**

The matrix presents this as one of the four gaps *"fixed with new tests"*:
*"R-5.2 AC4 / R-7.8 AC4 / R-9.8 AC6 — one gap wearing three numbers — gained
a baseline comparison printed on every Lighthouse run, so it cannot be
silently absorbed again."* Three problems.

1. **It asserts nothing.** The implementation is a `console.log` with an
   `eslint-disable-next-line no-console` above it. The comment following it
   states the position plainly: *"The pass/fail bound stays R-5.2 AC1's
   (>=95, <2500ms), deliberately unchanged."* So if Performance fell to 96
   and LCP rose to 2400ms — an unambiguous regression against a baseline of
   100 / ~1200ms — **the test passes** and prints the regression into the
   stdout of a green run. The matrix's own legend says AUTOMATED means *"a
   named test asserts it"*. Nothing is asserted. The AC's words are *"any
   regression is reported explicitly rather than absorbed as 'still
   passing'"*, and a line of log inside a passing test is a close likeness of
   the failure mode the AC was written to prevent.
2. **Wrong host.** R-9.8 AC6 requires the audit *"executed **against the
   production hostname**"*; R-7.8 AC4 sits in the requirement series defined
   by the production hostname. `lighthouse.spec.ts` runs against
   `previewBaseURL` — the local built static output — as its own header
   comment says. **No post-brand Lighthouse audit against production exists.**
   PERF-001's production measurement is *pre*-brand, which is what makes it
   the baseline, not the comparison.
3. **The comparison is flattered by its own baseline.** The code uses
   `lcpMsUpperBound: 1200` against a recorded pre-brand range of
   *"~0.96–1.2s"*, i.e. the loosest end. The matrix then reports *"LCP
   908/910/908ms … roughly **290ms BETTER** despite adding a web font and
   images."* Against the range's other end the improvement is ~50ms, and the
   two figures come from different environments (production pre-brand vs
   local post-brand), so the delta is not a like-for-like measurement at all.
   *"and images"* is also inaccurate — no image was added to the home page
   (§3.4).

- **Evidence:** `D:\dev\public-site\tests\lighthouse.spec.ts`, lines for
  `BASELINE`, `console.log`, and the closing comment; `playwright.config.ts`
  `lighthouse` project.
- **Recommended action:** state the rows honestly as a *reported* comparison
  rather than an asserted one, and either add a regression assertion with a
  deliberately wide tolerance, or run the audit once against production
  post-brand and record it. Withdraw the "290ms BETTER" claim or restate it
  against the correct baseline end and the correct host.

### 2.4 Finding 4 — `keyboard-focus.spec.ts` is credited with more than it asserts
**Classification: TEST_DEFECT · Severity: Medium**

The spec is genuinely good work — it drives real `Tab` presses, its
`:not([disabled])` clause is correctly reasoned, and its wrap-detection
comment documents a real bug it fixed. Three overstatements nonetheless.

1. **The indicator check samples the first 6 tab stops only.** R-5.1 AC2
   requires *every* interactive element to show a visible focus indicator.
   The reachability test walks the whole tab order; the *indicator* test
   stops at `SAMPLE = 6`. On every route the first six stops are the skip
   link, the logo and the four nav links — i.e. **the shared header, and
   nothing else**. Footer legal links and the Contact form's inputs are never
   checked for an indicator on any route. The matrix's wording — *"walks the
   real tab order on every route and asserts a visible indicator"* — reads as
   though the walk and the assertion are the same pass. They are not.
   The in-code justification (*"the ring is defined once globally, so a
   handful across different components proves it applies"*) is an assumption
   about the CSS, not a property the test establishes.
2. **"Visible" is satisfiable without a focus indicator.** The check is
   `hasOutline || hasShadow`, where `hasShadow` is any `box-shadow !== 'none'`.
   It never compares the focused state to the unfocused one. An element
   carrying a decorative `box-shadow` and `outline: none` on focus would
   **pass** while having no focus indicator at all.
3. **R-9.3 AC5's second half is a proxy, not a measurement.** AC5 requires
   3:1 *"against both the header background and the logo's own adjacent
   pixels"*. The header half is genuinely measured, including compositing a
   transparent header over the body colour — good. The logo half is
   substituted by `outline-offset > 0`. To the Engineer's credit the matrix
   row discloses this. It remains weaker than the criterion.

- **Minor soundness note:** elements are identified by `tagName:name`
  truncated to 40 chars, and `unreachable` is computed with
  `reached.includes(e)`. Two distinct elements sharing an identifier would
  mask one being unreachable.
- **Recommended action:** raise `SAMPLE` to the full tab order (the run is
  fast), and compare focused vs unfocused computed style rather than testing
  for a non-`none` `box-shadow`. Do not weaken the matrix row's wording as
  the alternative — the test should meet the claim.

### 2.5 Finding 5 — R-1.4 AC1: gitleaks does not scan full history
**Classification: TEST_DEFECT · Severity: Medium-High**

- **Expected:** AC1 reads *"Given the repository **at any commit**, When
  scanned, Then no credential material is present."* The matrix claims
  *"gitleaks, **full history**, gates both deploy jobs"*.
- **Actual:** the gating half is true and verified — `secret-scan` exists,
  and both `deploy-preview` and `deploy-production` carry
  `needs: [validate, secret-scan]`. The *scope* half is not.
  `gitleaks-action` at the pinned SHA scans only the event's commit range on
  `push` and `pull_request`; full-repository scanning happens only under
  `workflow_dispatch` or `schedule`, and this workflow is triggered by
  neither. For a squash-merge push to `main` — this repository's actual merge
  style — the range collapses to a **single commit**. `fetch-depth: 0` is
  necessary for the range to resolve but is not itself a full-history scan.
- **Evidence:** `.github/workflows/ci-cd.yml` `on:` triggers, the
  `secret-scan` job, and the pinned action's `src/gitleaks.js` `--log-opts`
  construction. The workflow's own in-file comment is more accurate than the
  matrix row.
- **Mitigating:** a one-off manual scan of the 91 pre-public commits is
  recorded, and the ruleset now requires `Secret scan (R-1.4)` as a merge
  check — which the matrix *understates*.
- **Recommended action:** add a `schedule:` trigger so a genuine full-history
  scan runs periodically, and correct the row's "full history" wording.
- **Could not verify:** that GitHub platform `secret_scanning` and push
  protection are enabled. See §5.

---

## 3. Findings — PRODUCT_DEFECT and requirement conformance

### 3.1 Finding 6 — R-9.7 AC1 fails in production, and is recorded as AUTOMATED
**Classification: PRODUCT_DEFECT · Severity: Medium**

- **Scenario:** R-9.7 AC1, verbatim: *"Given `/favicon.svg`, When requested,
  Then it returns the haroonie.ai logo mark — **not** the Astro starter
  favicon currently shipped (§0.1)."*
- **Expected:** `/favicon.svg` returns the haroonie.ai mark.
- **Actual:** it returns the unmodified Astro starter favicon.

```
$ curl -s -o /tmp/pf.svg -w "HTTP %{http_code} type=%{content_type} bytes=%{size_download}\n" https://www.haroonie.ai/favicon.svg
HTTP 200 type=image/svg+xml bytes=749
$ diff public/favicon.svg /tmp/pf.svg   # → IDENTICAL
```

  `public/favicon.svg` is 749 bytes, last modified in commit `62633a5`
  ("shared layout shell and route stubs") and **never touched since the
  original scaffold** — the only file in `public/` not updated by the brand
  wave.
- **What happened:** the head was re-pointed to
  `/brand/haroonie-logo-mark.svg` rather than the file being replaced.
  `src/components/SeoHead.astro` acknowledges it: *"This replaced
  `/favicon.svg`, which was the unmodified Astro…"*. So the AC is met in
  spirit and failed to the letter, and the Astro project's logo is still
  served from a commercial site's well-known favicon path.
- **Matrix says:** AUTOMATED — *"seo.spec.ts / build output — favicon set
  referenced from the head"*. That tests the head, which is not what AC1 is
  about.
- **Recommended action:** delete `public/favicon.svg`, or replace its
  contents with the brand mark. One-line fix; the AC then passes as written.

### 3.2 Finding 7 — R-9.9 AC4: the replacement mark lost the behaviour the AC said must not be lost
**Classification: PRODUCT_DEFECT (minor) · Severity: Low-Medium**

- **Expected:** AC4 — *"Given `/favicon.svg`, When the browser is in dark
  mode, Then the mark remains legible against dark browser chrome. The
  current Astro-default file already achieves this with an internal
  `prefers-color-scheme` rule; **the replacement must not lose that
  behaviour.**"*
- **Actual:** the replacement — `/brand/haroonie-logo-mark.svg` — contains
  **no `prefers-color-scheme` rule** (zero matches). It is fixed blue
  gradients (`#2E83FF` → `#155BEF`). The only file that still has the rule is
  the Astro starter that was supposed to be replaced.
- **Matrix says:** MANUAL — *"Mark remains legible against dark browser
  chrome."* That is a verbatim restatement of the AC with no evidence, no
  method, no date. Nobody is recorded as having looked.
- **Assessment:** mid-blue on dark chrome is probably acceptable in practice
  — this is not urgent — but the AC named a specific behaviour and asked that
  it survive, and it did not.
- **Recommended action:** either add the dark-mode rule to the mark, or
  record a dated visual check and amend AC4 to say the behaviour was
  deliberately dropped.

### 3.3 Finding 8 — R-9.2 AC4: the matrix cell recites the deviation and marks the row verified
**Classification: PRODUCT_DEFECT / requirement conformance · Severity: Medium**

- **Expected:** AC4 — *"each is `woff2`, each is **subset to the character
  ranges the site actually uses**, and **exactly three weights ship (Regular
  400, Bold 700, ExtraBold 800)** — no weight ships that no page renders."*
  Reinforced by resolved ambiguity **U21**: *"exactly the three the sheet
  names, nothing more… Latin subset only."*
- **Actual:** one file ships — `public/fonts/manrope-variable.woff2`, 24,836
  bytes — declared `font-weight: 200 800` in `BaseLayout.astro`. A single
  variable font spanning a continuous 200–800 axis is not "exactly three
  weights ship".
- **Matrix says:** MANUAL — *"STATUS.md — single variable woff2, 24KB,
  **weights 200-800**"*. The cell states the deviation and certifies the row
  in the same breath.
- **Fairness to the Engineer:** the variable font is very likely the *better*
  engineering outcome — 24KB for the whole axis beats three separate files,
  and STATUS.md's reading (nothing *renders* a fourth weight) is defensible.
  That is an argument for **amending the AC**, which is exactly how this
  program handled R-2.4 AC1's booking clause and R-4.5 AC2. It was not done
  here.
- **Also unverified:** the *"subset to the character ranges the site actually
  uses"* half has no record anywhere.
- **Recommended action:** raise an owner amendment accepting variable-font
  delivery and restating AC4, and record the subsetting position. Do not
  leave an approved AC contradicted by its own evidence cell.

### 3.4 Finding 9 — R-9.8 AC1–AC5 govern a hero image that does not exist, and are credited to unrelated performance evidence
**Classification: DOCUMENTATION/PROCESS · Severity: Medium**

R-9.8 AC1–AC5 are entirely about *"the home page's hero image"* — modern
format with fallback, responsive `srcset` at 320/768/1920, explicit
intrinsic dimensions, `fetchpriority="high"` with every other image lazy,
under 200 KB on mobile, and `alt` handling.

**There is no hero image.** `src/pages/index.astro`'s hero is a CSS gradient
section containing text; the only `<img>` in the entire site is the header
logo. No `srcset`, no `fetchpriority`, no `loading=` anywhere.
`public/brand/PROVENANCE.md` records why: *"the photographic hero that
originally raised the question was replaced by the owner with an
illustration before anything shipped."*

That is a perfectly good outcome. The defect is that **the five ACs were
never struck or amended**, and the matrix instead credits each against
evidence about something else entirely:

| AC | Requires | Matrix credits |
|---|---|---|
| R-9.8 AC1 | AVIF/WebP + `srcset` at three breakpoints | *"lighthouse.spec.ts — Performance >= 95"* |
| R-9.8 AC2 | explicit intrinsic width/height on the hero | *"lighthouse.spec.ts — LCP within budget"* |
| R-9.8 AC3 | `fetchpriority="high"`, others lazy | *"lighthouse.spec.ts — CLS under 0.1"* |
| R-9.8 AC4 | selected hero variant < 200 KB on mobile | *"cross-browser.spec.ts — JS transfer budget"* |
| R-9.8 AC5 | hero `alt=""` or descriptive, never a filename | *"Build output — stylesheet inlined, no render-blocking external CSS"* |

- **Recommended action:** strike or mark N/A, with the owner's hero decision
  cited — the same treatment R-4.5 AC2 correctly received. Counting five
  inapplicable criteria as verified is what turns an honest scope change into
  an inflated compliance number.

---

## 4. Findings — mis-mapped and under-evidenced rows

### 4.1 Finding 10 — Systemic off-by-one and cross-AC mis-crediting
**Classification: DOCUMENTATION/PROCESS · Severity: High (to the matrix's credibility)**

Beyond §2 and §3, the following rows credit evidence belonging to a
different criterion. Several of the underlying criteria *are* satisfied —
the defect is the certification, not always the product.

| AC | What it actually requires | What the matrix credits | Criterion actually met? |
|---|---|---|---|
| R-9.2 AC2 | no request to any external origin; none to `fonts.googleapis.com`/`gstatic.com` | *"Build output — font served from /fonts"*, marked AUTOMATED | Yes in practice (`font-src 'self'`), but **no test** — zero matches for `googleapis`/`gstatic` in `tests/` |
| R-9.2 AC6 | the LCP element's weight is preloaded, and no other font is | *"manrope-OFL.txt ships alongside the font"* (that is R-9.6 AC2) | **Yes** — `BaseLayout.astro` preloads the one font file |
| R-9.3 AC1 | brand logo visible in header and is the home link | *"smoke.spec.ts — header home link present"* | `smoke.spec.ts` has no logo assertion at all |
| R-9.3 AC2 | accessible name is `haroonie.ai`, from real text not `aria-label` | *"smoke.spec.ts"* | no such assertion exists |
| R-9.3 AC3 | logo undistorted at 320/1920, header not overflowed, no nav link pushed out | *"brand-tokens.spec.ts — mark carries explicit dimensions"* | no such test in that file |
| R-9.3 AC4 | logo asset is vector at every rendered size | *"BaseLayout renders …"*, marked **AUTOMATED** | source inspection, not a test |
| R-9.4 AC2 | icons **not** accompanied by visible text have a purposeful accessible name | *"service-icons.spec.ts — no duplicate announcement"* (that is AC1) | vacuous — every icon has adjacent text; say so, don't credit AC1's test |
| R-9.5 AC6 | the axe suite reports zero serious/critical, `color-contrast` included | *"palette values written exactly once"* | **Yes**, by `accessibility.spec.ts` — wrong test credited |
| R-9.6 AC2 | font licence present **and terms confirmed** | AC1's brand-asset licensing prose | yes, via `manrope-OFL.txt` |
| R-9.6 AC3 | assets of unestablished provenance are **not shipped**, raised as E20 | AC2's licence file | E20 exists and was closed — cite that |
| R-9.7 AC2 | head declares SVG + `.ico` 16/32/48 + 180×180, **each URL 200 with declared type** | *"Build output — apple-touch-icon, 16/32/48 PNG, multi-resolution .ico"* | partly; no 200/content-type assertion |
| R-9.7 AC3 | `og:image` resolves to a **raster, exactly 1200×630, own origin** | *"seo.spec.ts — og:image is a 1200x630 raster with width/height/type/alt"* | **`seo.spec.ts` asserts only that the tag is non-empty.** I verified the file independently: genuine JPEG, 1200×630. `twitter:image` is not tested at all, though R-4.1 AC3's row claims "OG/Twitter" |
| R-9.7 AC4 | OG image legible **at social thumbnail size** | *"`.ico` is a real ICO (magic `00 00 01 00`)"* | unrelated; a visual judgement credited to magic bytes |
| R-9.7 AC5 | favicon mark **recognisable at 16×16** | *"Verified live — all icon assets 200 with correct content types"* | unrelated; and "Verified live" appears nowhere outside the matrix |
| R-9.7 AC6 | OG image transferred size **< 300 KB** | *"og:image 200, image/jpeg, 1200x630"* | **Yes** — I measured 224,107 bytes. The number appears nowhere in the record |
| R-9.9 AC3 | on-dark logo used **only** on genuinely dark surfaces | *"used on OG card, app icons"* | vacuously true — `haroonie-logo-horizontal-dark.svg` is referenced nowhere in `src/`; the stated rationale is factually wrong |
| R-2.1 AC1 | single primary **heading** above the fold at two viewports | text duplicated from AC2 (*"single primary CTA…"*) | yes, the test exists; the row describes the wrong AC |
| R-2.2 AC2 | a CTA linking to Contact is present | *"entries come from the content collection"* | yes, test exists; row mis-describes |
| R-1.1 AC1 | history exists with **`main` as default branch** | *"QA-001 — scaffold builds and serves"* | yes now; QA-001 actually recorded this as a **PRODUCT_DEFECT** (`master`), later remediated |
| R-1.2 AC1 / AC2 | AC1 = clean-clone build; AC2 = Node file + lockfile committed | the two rows are **swapped** | both met; labels transposed |
| R-7.7 AC3 | post-change enumeration = original six byte-identical **plus only the new records** | *"proxied=true on the www record"* | see §4.9 |
| R-7.7 AC5 | attachment **verified to name `haroonie-ai-public-site`** by inspecting the project's custom-domains list | *"zero records removed, zero modified"* | unrelated; see §4.9 |
| R-7.3 AC1 / AC2 | HTTP **301** from apex, path preserved | *"WAVE4-dns-evidence.md — apex records untouched"* | see §4.11 |

**Recommended action:** a full re-verification of all 135 rows against
REQ-001, not a patch of the ones named here. The sampling rate that produced
this table was high enough that the remaining rows cannot be assumed clean.

### 4.9 Finding 11 — Wave 4's post-change enumeration covers only the `www` stage
**Classification: DOCUMENTATION/PROCESS · Severity: Medium**

R-7.7 AC3 requires a post-change enumeration showing the original six
byte-identical *plus only the new records R-7.2/R-7.3 require*.
`status/WAVE4-post-www-dns-snapshot.json` contains the six originals plus the
`www` CNAME — and **no apex record**. The apex write, the
`always_use_https` change and the redirect ruleset all post-date it. So the
completed change set was never enumerated. Neither JSON carries a timestamp,
while the matrix's legend defines MANUAL as *"a dated, recorded
verification"*.

R-7.7 AC5 (verify the Pages custom-domain attachment names
`haroonie-ai-public-site`, *"not by assuming the correct project was
selected"*) has no recorded inspection at all;
`status/E13-zone-token-write-grants.md` records that the attachment was a
**dashboard** action. The site serving correctly from `www` is strong
circumstantial evidence, but it is the inference AC5 explicitly forbids.

**Recommended action:** capture a current full-zone enumeration with a
timestamp, and one `GET /pages/projects/haroonie-ai-public-site/domains`.
Both are read-only and take a minute.

### 4.10 Finding 12 — E12's approved method was half-executed, then cited as fully satisfied
**Classification: DOCUMENTATION/PROCESS · Severity: Medium (now closed on the facts)**

- **Expected:** REQ-001 records E12's owner decision verbatim: mail
  continuity is proven by *"byte-identical before/after record comparison via
  the Cloudflare API **plus an external `dig`**; no test email is ever sent."*
- **Actual:** only the API half was performed.
  `status/WAVE4-dns-evidence.md` states *"mail continuity verified at exactly
  the level **E12** approved: DNS-record-level comparison only"* — which is
  not the level E12 approved — and then concedes, honestly, *"These are
  captures taken by this program against the Cloudflare API. They are not an
  independent third-party observation."* No `dig`/`nslookup` of the mail
  records exists anywhere in the repository.
- **I performed the missing check.** `nslookup` against `8.8.8.8`:

```
MX    haroonie.ai → haroonie-ai.mail.protection.outlook.com (pref 0)
TXT   "MS=ms54040815"
TXT   "v=spf1 include:spf.protection.outlook.com ~all"
CNAME autodiscover           → autodiscover.outlook.com
CNAME enterpriseenrollment   → enterpriseenrollment-s.manage.microsoft.com
CNAME enterpriseregistration → enterpriseregistration.windows.net
```

  All six resolve externally, identical to the AC1 baseline. **There is no
  product risk here** — R-7.7 AC4 and R-7.3 AC3 are now satisfied on the
  facts. The finding is that the record claimed a method it had not run.
- **Recommended action:** paste the above into `WAVE4-dns-evidence.md` with
  today's date and correct the "exactly the level E12 approved" sentence.

### 4.11 Finding 13 — The apex 301 is credited to a file containing no HTTP observation
**Classification: DOCUMENTATION/PROCESS · Severity: Low (product verified good)**

R-7.3 AC1/AC2 are HTTP-behaviour criteria (301 from apex; path preserved).
`WAVE4-dns-evidence.md` contains zero HTTP observations, and no test in the
suite requests the apex host. **I verified it live:**

```
https://haroonie.ai/          → 301 → https://www.haroonie.ai/
https://haroonie.ai/services/ → 301 → https://www.haroonie.ai/services/
```

Both ACs are **met**. They were simply never evidenced.
**Recommended action:** add two assertions to `production-smoke.spec.ts` —
cheap, and it converts a paper claim into a gate.

### 4.12 Finding 14 — R-7.5 AC1e is counted as MANUAL although nothing was verified
**Classification: DOCUMENTATION/PROCESS · Severity: Medium**

The owner asked whether this is honest or "a gap wearing a friendlier label".
**Both, in different places.**

*Honest:* `tests/csp-nonce-failsafe.spec.ts` is a model of disclosure — it
documents the blast-radius reason a project-level env var cannot be set,
names what remains unproven (*"does the real Cloudflare Pages Functions
runtime actually reach and return that fallback"*), and skips loudly rather
than reporting a pass it never performed. `csp-module.spec.ts` genuinely
tests the fallback's pure logic. The matrix prose also says outright: *"One
is an accepted limitation, deliberately not called a pass."* That is good
practice and I want it on the record as such.

*Not honest:* the row's **verdict is MANUAL**, and the legend defines MANUAL
as *"A dated, recorded verification exists"*. None does. The summary table
therefore shows **MANUAL 41 / GAP 0**, and the one criterion nobody verified
is inside the 41. Owner acceptance of a risk is legitimate; it does not
convert an unverified criterion into a verified one.

**Recommended action:** add a fifth verdict — `ACCEPTED-LIMITATION: 1` — and
make the headline read *"0 gaps, plus 3 blocked and 1 accepted limitation."*
That sentence is both true and still good news.

### 4.13 Finding 15 — R-4.4 AC1's production half is currently not satisfied, and the row shows a clean pass
**Classification: DOCUMENTATION/PROCESS · Severity: Low**

AC1: *"Given any `*.pages.dev` preview URL… Then it disallows all crawling,
**while the production host does not**."* Production today:

```
$ curl -s https://www.haroonie.ai/robots.txt
User-agent: *
Disallow: /
```

This is a deliberate owner decision (`SITE_ENV: prelaunch`, pending go-live),
not a defect — and `seo-preview.spec.ts` even has a test named for the
prelaunch gate. But AC1's second clause is not met, and the row records
AUTOMATED with no deviation noted. It will silently become true at go-live,
which is precisely when nobody will re-check it.
**Recommended action:** annotate the row with the prelaunch deviation and its
exit condition.

### 4.14 Finding 16 — R-6.5's roll-forward figure is not reconstructible from its own observations
**Classification: DOCUMENTATION/PROCESS · Severity: Low-Medium**

**First, the owner's direct question — is the upper-bound method sound?
Yes.** The reasoning is *a fortiori*: the measured interval spans *human
action → the next poll that observed the new state*, so it strictly exceeds
the true propagation time. An inclusive figure of ≤67s against a 600s
criterion clears it by roughly 9×. Inflating a measurement and still passing
by an order of magnitude is valid evidence, and `ROLLBACK-PROCEDURE.md`
states the limitation explicitly rather than claiming false precision. **This
is not over-claimed, and R-6.5 AC1 is properly satisfied in the rollback
direction.** Scoping the clock to procedure-execution (not detection) is also
the correct reading of AC1's wording.

The defect is narrower. The roll-forward row reads: *"Roll-forward observed
live | **11:51:14 UTC**, sampling every 3s from **11:51:26** — transition
caught inside a **≤ 48s** window."* The observation is timestamped 12 seconds
**before** sampling began; a 3-second cadence cannot yield a 48-second
window; and no roll-forward *issue* time is recorded, so there is no anchor
from which 48s could be derived. One of those three numbers is wrong and the
row cannot be reconstructed. No raw poll log was retained.

**Recommended action:** withdraw the "≤48s" figure until the timestamps are
reconciled, or re-drill the roll-forward with the poll output retained. Keep
the ≤67s rollback figure — it is sound.

### 4.15 Finding 17 — The asset register omits shipped assets
**Classification: DOCUMENTATION/PROCESS · Severity: Low**

R-9.6 AC1 requires each shipped binary asset to have a recorded **origin,
creator, licence, and commercial-use confirmation** — four fields.
`PROVENANCE.md` records origin and a per-file table, but for the brand assets
states the reverse of a licence confirmation (*"may not be protectable…"*)
and records trademark as *"not examined"*. It also omits `src/icons/*.svg`
(the three service icons — AC1 names "icons" explicitly) and
`public/favicon.svg` (the third-party Astro asset from §3.1).

**Recommended action:** add the three icons and resolve `favicon.svg` by
deleting it (§3.1), which removes the registration question entirely.

---

## 5. What I could not verify, and why

1. **GitHub platform secret scanning and push protection.**
   `GET /repos/haroonie-ai-ops/public-site` returns no `security_and_analysis`
   block unauthenticated; that block requires admin auth. `gh` is not
   installed; no admin token is available; the GitHub MCP server exposes no
   repository-settings, code-scanning or secret-scanning tool. **This half of
   R-1.4 AC1 rests on the Engineer's word.** Not disputed — recorded as
   unverified. **Classification: AUTHENTICATION (scope), not a defect.**
2. **Code-scanning alert data.** `/code-scanning/alerts` and
   `/code-scanning/analyses` both return **HTTP 401 "Requires
   authentication"**.
3. **The production suites were not executed by me.** The audit above used
   targeted `curl`/`nslookup` probes against production instead. Bot Fight
   Mode's challenge behaviour (QA-005 Finding 3) makes non-browser clients an
   unreliable oracle, and I did not want to introduce a false
   ENVIRONMENT failure into this record. The production rows' *mapping* was
   audited; their *execution* was not re-run.
4. **R-9.7 AC4 / AC5 (visual legibility at thumbnail and 16×16).** These are
   human judgements. Nobody has recorded making them, and I have not either.
5. **The "135 acceptance criteria" figure itself could not be independently
   re-derived.** The denominator checks out — REQ-001 does contain **48
   requirements** (R-1.1–1.4, R-2.1–2.8, R-3.1, R-4.1–4.5, R-5.1–5.3,
   R-6.1–6.7, R-7.1–7.8, R-8.1–8.3, R-9.1–9.9), and the matrix's 135 rows and
   83/41/8/3 tallies are internally consistent. But my own extraction pass
   recovered only 111 pairs, because AC and requirement headings are formatted
   several different ways through the document; mine is the cruder instrument
   and I do not dispute the Engineer's figure. **The point is that nobody can
   check it** — the generator the matrix credits with guaranteeing the
   extraction does not exist in the repository (§1), so the count is not
   reproducible by any party, including a future reader. Committing the
   extractor would fix this permanently and is worth doing regardless of the
   rest of this review.

---

## 6. The `npm test` claim — verified, and the delta is genuine
**Classification: none — this one is clean**

The owner asked whether the 415→428 delta is real added coverage or moved and
relaxed assertions. **It is real added coverage.** Executed on this branch,
`origin/main` content, 2026-09-18:

```
$ npx playwright test --reporter=line
Running 441 tests using 2 workers
...
  13 skipped
  428 passed (5.6m)
EXIT=0
```

**428 passed, 13 skipped, 0 failed.** The count holds exactly.

The delta reconciles precisely, and no assertion was weakened to get there:

- **+13 tests, all from `keyboard-focus.spec.ts`.** `--list | grep -c
  keyboard-focus` returns **13** — 2 tests × 6 routes plus the single logo
  test — which is exactly the 415→428 movement. Nothing was renumbered.
- **Every deleted line since the 415 baseline (`e589e8c`) was checked
  individually.** `git diff e589e8c..origin/main -- tests/ playwright*.config.ts`
  removes **8 lines**: four `testIgnore`/`testMatch` patterns replaced by
  broader ones (adding `keyboard-focus`, `production-smoke`, and swapping the
  `production-security` filename for the `production-[a-z-]+` pattern), two
  comment lines, and one line in `lighthouse.spec.ts`. **No assertion was
  deleted or loosened anywhere.**
- **The one changed assertion was strengthened.** `const lcpMs =
  lhr.audits[...].numericValue` became `... ?? Number.NaN` plus an explicit
  `expect(Number.isFinite(lcpMs)).toBe(true)`. A Lighthouse run that failed to
  produce an LCP value previously compared `undefined` silently; it now fails.
  That is the opposite of an R-8.3 concern.
- The 13 skips are legitimate and pre-existing: 12 are
  `cross-browser.spec.ts`'s JS-transfer test correctly skipping non-chromium
  engines (*"JS-weight is engine-independent"*), plus one in `smoke.spec.ts`.

**Incidentally, this run is itself the evidence for Finding 3 (§2.3).** The
suite printed:

```
performance record is 100 and desired threshold was 95
R-9.8 AC6 baseline comparison - Performance 100 vs 100 (+0); LCP 908ms vs <=1200ms (-292ms).
```

A green run, a log line, and the `-292ms` measured against the 1200ms *upper*
end of the recorded `~0.96–1.2s` baseline — exactly as §2.3 describes. Had
that figure been a regression instead, the run would have looked identical.

---

## 7. Claims I set out to falsify, and could not — the Engineer is clear on these

Independence cuts both ways. These were checked adversarially and held.

1. **The R-6.5 upper-bound method (§4.14).** Sound, correctly scoped, and
   honestly caveated. The owner's suspicion of over-claiming is not borne out
   for the rollback figure.
2. **R-7.7 AC2, create-only — and a severe finding I rejected.** A delegated
   audit reported a "critical contradiction": that `E13` (dated 2026-09-15)
   names the **apex** CNAME as the DNS write-grant proof, contradicting the
   matrix's *"first write was www, never the apex"*. **I checked this myself
   and it is wrong.** `WAVE4-post-www-dns-snapshot.json` contains the six
   originals — byte-identical in name, type, content and `proxied` — plus the
   `www` CNAME (`proxied: true`, → `haroonie-ai-public-site.pages.dev`) and
   **no apex record at all**. That positively evidences `www`-first ordering
   rather than contradicting it, and E13's table records *which grants were
   proven*, not the chronology of Wave 4's first write. The create-only rule
   is also directly evidenced by the same diff. **R-7.7 AC2 stands.** Recorded
   here because a review that only reports confirmations is not a review.
3. **R-8.3 AC1 — the deleted `test.fixme`.** The justification holds. The
   owner's instruction is quoted verbatim (*"Cancel e22 and p17."*), the
   requirement itself was withdrawn — which is the one thing that
   legitimately removes an assertion — and the active guard was **kept and
   strengthened**: `contact.spec.ts` still asserts *"no booking link is
   rendered, dead or otherwise"*. That is not weakening. The AC1c relocation
   to the manual suite is likewise a relocation, not a relaxation.
   *One asymmetry:* the **R-4.5 AC2 strike** records "owner decision" but,
   unlike R-2.4 AC1, carries **no verbatim owner quote**. R-8.3 AC1 requires
   justification *"approved by the owner"*. Worth closing with a quote.
4. **R-4.5 AC2's strike itself — legitimate.** R-4.5's purpose is *"Analytics
   is cookieless, so no consent banner is required"*; AC2 ("recorded in the
   analytics dashboard") was unimplementable with no analytics product
   installed, and the amendment reasons correctly that adding one is a scope
   decision touching the CSP, the Privacy Policy and A4. This did **not**
   dodge a real requirement. AC1 remains in force and the amendment is candid
   that it passes *"because the site collects nothing at all"*.
5. **The three E4-blocked ACs (R-3.1 AC1/AC2/AC3) — correctly blocked.** The
   form is deliberately unwired and `contact.spec.ts` actively asserts that
   (no `action`, submit disabled) rather than leaving it ambiguous. Nothing
   else makes them unverifiable. E4 blocks Wave 5 only, as stated.
6. **R-7.8 AC6 — the production-spec quarantine works.** `--list` reports 441
   tests across 17 files with **zero** production specs; the `testIgnore`
   regex covers `production-*.spec.ts` and `*.manual.spec.ts` by pattern
   rather than filename list, which is the right fix.
7. **R-6.1 AC2 — verified live and *understated*.** Ruleset 23484592,
   `enforcement: active`, now requires **two** contexts ("Install, lint,
   build, Playwright" and "Secret scan (R-1.4)") with
   `strict_required_status_checks_policy: true`. The matrix says "a required
   status check", singular.
8. **R-6.2 AC1, R-6.3 AC1/AC2, R-6.4 AC2, R-7.8 AC5, R-6.6 AC1/AC2, R-6.7
   AC1** all hold on inspection. Two narrow holes worth recording, not
   failing: no rollback recommendation is written when a run is **cancelled**
   (`cancel-in-progress: true`), or when `deploy-production` itself fails
   (`post-deploy-verify` is then skipped).

---

## 8. Known-open item, now diagnosed: the red `github-advanced-security` check
**Classification: ENVIRONMENT · Severity: Informational**

The Engineer recorded this as red on `main` and undiagnosed. Both halves can
now be corrected.

**It is not on `main`.** Main HEAD `8eaf968` carries exactly one check suite
(`github-actions`, conclusion **success**, 5 runs). No
`github-advanced-security` check exists on `main` at all. It is red on **PR
#28's head commit `237c436`**, which was squash-merged into `8eaf968`.

**What it is:** workflow run `35352714938`, *"Code scanning AI findings on PR
#28"*, path `dynamic/agents/github-advanced-security`, event `dynamic` — a
dynamic workflow injected by GitHub, not anything in `.github/workflows/`.
It has no relationship to the repository's gitleaks job.

**Root cause**, from the job log:

```
Creating copilot-sdk session with model: claude-opus-5[ReasoningEffort=medium]
Error creating PR review request: SessionModelError: Execution failed:
  CAPIError: 400 The requested model is not supported.
##[error]Process completed with exit code 1.
```

The agent aborted in ~34 seconds **while creating its session, before
scanning anything**. It is a GitHub-side model-availability failure in
GitHub's own tooling, it analysed nothing about this repository, and it is
**not a required status check** — so it gates nothing.

I am not calling it benign as a judgement; I am reporting that the failure
occurred before any analysis ran, which is what the log shows.
**Recommended action:** record it as external and closed. No code change.

---

## 9. Verdict

**Wave 7 is not fit for Acceptance as presented.**

To be precise about what is and is not wrong, because the distinction
matters:

**The product is in good shape.** Across every independent probe I ran —
production headers, the apex redirect, external DNS resolution of all six
mail records, the OG image's real dimensions and byte size, the `.ico`'s
magic bytes, the CI ruleset — the site does what the requirements ask, with
two exceptions (§3.1, §3.2) that are both small and one-line fixes. Wave 7's
*engineering* is sound.

**The certification of it is not.** `R8-TRACEABILITY-MATRIX.md` is the
load-bearing claim in this program right now, and it does not hold at the
strength it is stated. Specifically:

- **At least six acceptance criteria have no assertion anywhere** while
  marked AUTOMATED — the CLS budget (§2.1) and five of the six contrast
  criteria (§2.2). Two of those were *added by REQ-001-A3 specifically
  because the brand wave introduced the risk they guard*. They shipped
  unguarded.
- **One of the four "gaps fixed with new tests" is a `console.log`** (§2.3),
  measured against the wrong host and the loosest end of its own baseline.
- **Five criteria about a hero image that does not exist** are counted as
  verified against unrelated evidence (§3.4).
- **The mis-mapping is systemic** (§4.1) — roughly twenty rows across the
  sample credit a neighbouring AC's evidence. The sampling rate was high
  enough that the unsampled rows cannot be presumed clean.
- **The matrix's own drift-protection claim is unsubstantiated** — the
  "generator" it credits does not exist in the repository (§1).
- **REQ-001 and the matrix contradict each other** on the program's own gap
  count (§1).

None of this is bad faith. The pattern is consistent and recognisable: the
matrix was assembled by reading *what a test was for* rather than *what it
asserts*, and the AC text was not re-read at the point of mapping. That is
exactly the error an independent pass exists to catch, and it is exactly the
error the Engineer was not well placed to see in their own work.

**R-8.2 AC1 is satisfied by this document.** Every finding above carries a
classification from CLAUDE.md's taxonomy, with severity, evidence and a
recommended action. No assertion was weakened anywhere in producing it; where
a test is too weak for its criterion I have said so and left the test alone,
per the assignment.

### Path to Acceptance

Blocking, in priority order:

1. **Add the CLS assertion** (§2.1). ~4 lines in `lighthouse.spec.ts`.
2. **Resolve the six contrast rows** (§2.2) — implement, or re-mark GAP and
   re-credit R-5.1 AC3 to `accessibility.spec.ts`.
3. **Restate the baseline-comparison rows honestly** (§2.3) as *reported*,
   not asserted, and fix the host and baseline-end claims.
4. **Strike or mark N/A R-9.8 AC1–AC5** (§3.4), citing the owner's hero
   decision.
5. **Re-verify all 135 rows against REQ-001** (§4.1) — the sampled error rate
   does not permit spot-fixing.
6. **Reconcile the gap count** between REQ-001 § R-8.1 and the matrix (§1),
   and add an `ACCEPTED-LIMITATION` verdict for R-7.5 AC1e (§4.12).

Non-blocking but cheap and worth doing in the same pass: delete
`public/favicon.svg` (§3.1); correct the "full history" wording and add a
`schedule:` trigger (§2.5); paste the external `dig` results into the Wave 4
evidence (§4.10); add two apex-redirect assertions (§4.11); withdraw the
"≤48s" roll-forward figure (§4.14).

**On the count itself:** the honest headline is not "135 ACs, 0 gaps". It is
closer to *"135 criteria; the product meets substantially all of them; the
verification record for roughly twenty needs correcting, and about eight have
no real check behind them yet."* That is a good position for a program this
young. It is a better sentence than the one currently in the document,
because it is true.
