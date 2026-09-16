# REQ-001-A2 — Amendment: CSP Nonce via Cloudflare Pages Function (Option B)

**Status: APPROVED — 2026-09-16.** The owner approved this amendment
directly, in-session, in two decisions recorded verbatim in merge commit
`5a8f4990` (PR #7): *"Approve e14"* (E14 — adopting a Cloudflare Pages
Function as this site's first server-side, request-time component, and
moving R-7.5's CSP header off `public/_headers` onto that Function's
per-request output), followed immediately by *"Approve E15 then merge or
#7"* (E15 — knowingly accepting the disclosed trust-dependency in §2: the
CSP's guarantee changes from "nothing inline executes" to "nothing inline
executes except what Cloudflare stamps," and this program cannot audit
what runs under that nonce before it executes). Both are first-hand owner
approval, not a relay, and were given as two distinct decisions rather than
one — which is why this document separated them in §0.

Its content — the R-7.5 AC1a–AC1f amendments, the new R-7.8, the R-5.2 AC2
evidence correction, U13–U19, and E14/E15/E16's escalation records — is now
incorporated into `requirements/REQ-001-mvp-public-website.md` itself,
which is the operative specification from this point forward. This
amendment file now stands as the historical record of *why* the change was
made — the gap assessment (§1), the honest interrogation of whether a
nonce weakens the policy (§2), and the Cloudflare documentation evidence
(§0.1, §0.3) — rather than as an operative requirements document in its
own right. Where this file and REQ-001 disagree on wording, REQ-001
governs.

Amends: `requirements/REQ-001-mvp-public-website.md` (R-7.5, R-5.2 AC2)
Cross-references: `status/QA-005-production-hostname-test-gap.md`,
`requirements/REQ-001-A1-dns-coexistence-amendment.md` (structure and
conventions followed here), `planning/PLAN-001-execution-waves.md` Wave 4
(R-7.5) and Wave 6 (R-5.2/R-5.3)
Author: Business Analyst
Date: 2026-09-16
Trigger: QA-005 Finding 1 (PRODUCT_DEFECT, High) — R-7.5 AC2 and R-5.3 AC1
fail against `https://www.haroonie.ai/` in all three engines, on all six
routes, because Cloudflare's Bot Fight Mode / JavaScript Detections injects
an inline bootstrap script that the current static `script-src 'self'` CSP
correctly, and unhelpfully, blocks.

This document does not implement anything, does not modify Cloudflare
configuration, and does not use any Cloudflare credential. It is analysis
and a proposed specification change only.

---

## 0. What the owner is being asked to approve

Five things, and only these five:

1. **Adoption of a new architecture element**: a Cloudflare Pages Function
   (`functions/_middleware.ts` or equivalent) that executes on every request
   to generate a per-response CSP nonce. This site has been purely static
   since Wave 1; this introduces server-side, request-time code execution
   for the first time. CLAUDE.md reserves "architecture changes with
   significant impact" to the owner — this qualifies (§0.2).
2. **A change to where R-7.5's CSP header is authoritatively defined**: from
   the static `public/_headers` file to that Function's output, for the
   `Content-Security-Policy` header specifically (and, per §3.1's drift
   guard, likely also `X-Content-Type-Options` and `Referrer-Policy`, to
   keep one single source of truth rather than two that can silently
   diverge).
3. **New and amended acceptance criteria on R-7.5** (§3.1) covering the
   nonce mechanism itself, and a new requirement, **R-7.8** (§3.2), closing
   QA-005 Finding 2 by requiring automated verification against the real
   production hostname.
4. **A correction to R-5.2 AC2's recorded evidence** (§3.3) — not a change
   to its threshold.
5. **A disclosed trust-dependency** (§2, E15): this document's honest
   conclusion that a correctly-implemented nonce is not weaker than today's
   policy against generic script-injection attacks, but that it does create
   a new, narrow dependency on Cloudflare's own injection scope that did not
   exist before. The owner is asked to accept that dependency explicitly,
   not to discover it later.

Nothing here expands MVP scope. No new page, no new feature, no change to
what the site does for a visitor. This constrains and specifies *how*
R-7.5's already-approved requirement is met.

### 0.1 Facts this amendment is built on

From `status/QA-005-production-hostname-test-gap.md` (raised this session):

- R-7.5 AC2 and R-5.3 AC1 **FAIL** against `https://www.haroonie.ai/`: 18 CSP
  violations (3 engines × 6 routes), `script-src-elem` blocked inline, on
  every route, in every engine.
- The CSP is behaving exactly as written. The defect is the injection, not
  the policy.
- The site has **no executable inline script of its own** — its only
  `<script>` element is non-executing `application/ld+json` structured data
  (`public/_headers`'s own derivation note, R-7.5). A nonce is needed solely
  to authorize Cloudflare's injected script; no existing markup needs one.
- R-5.2 AC2's recorded "0 bytes of JS" is stale for the production hostname:
  `www.haroonie.ai/services/` measures ~938 bytes of injected script,
  `haroonie-ai-public-site.pages.dev/services/` measures 0. Still inside the
  50 KB budget.
- Adding `'unsafe-inline'` was considered and explicitly rejected by QA-005
  as assertion-weakening; hashing was considered and rejected because the
  injected content embeds a per-request Ray ID, so no stable hash exists.
- `browser_check` was toggled off, found not to be the mechanism, and
  restored to `on`. The actual control is Bot Fight Mode / JavaScript
  Detections, which is automatically enabled and cannot be disabled on this
  plan, and which `CLOUDFLARE_ZONE_TOKEN` cannot reach (`/bot_management` →
  403).
- No suite in this program (`tests/cross-browser.spec.ts`,
  `tests/lighthouse.spec.ts`, `tests/security-headers.spec.ts`) ever
  requests the real production hostname through the Cloudflare proxy — all
  target build output or the `pages.dev` origin. This is why Finding 1 was
  invisible through five green CI runs and a full Wave 6 audit (QA-005
  Finding 2).

From Cloudflare's documentation, fetched and confirmed this session
(2026-09-16, via `cloudflare-docs` documentation search — see §0.3 on what
this evidentiary weight does and does not establish):

- `developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/`
  and `developers.cloudflare.com/bots/get-started/bot-fight-mode/` (near-
  identical text on both pages): *"If your CSP uses a `nonce` for script
  tags, Cloudflare will add these nonces to the scripts it injects by
  parsing your CSP response header."* … *"Ensure that anything under
  `/cdn-cgi/challenge-platform/` is allowed. Your CSP should allow scripts
  served from your origin domain (`script-src self`)."* … *"JavaScript
  Detections is not supported with `nonce` set via `<meta>` tags"* — the
  nonce must be delivered via the response header, which is exactly what a
  static `public/_headers` file cannot do per-request and a Function can.
- *"For Bot Fight Mode customers, JavaScript Detections is automatically
  enabled and cannot be disabled."* — confirms simply turning the feature
  off is not an available option on this plan, independent of anything
  `CLOUDFLARE_ZONE_TOKEN` can or cannot reach.
- Two further facts, not in the task's original brief, found during this
  session's documentation check and incorporated below rather than
  omitted: **(a)** *"Enabling JavaScript Detections will strip ETags from
  HTML responses where JSD is injected"* — an existing side effect of Bot
  Fight Mode already live today, independent of Option B; flagged in §6 so
  it isn't mistaken for a new regression when Wave 6 re-verifies. **(b)**
  *"If the origin response includes a `Cache-Control: no-transform`
  directive, Cloudflare does not inject the JavaScript Detections
  script"* — a real alternative that would make R-7.5 AC2 pass without any
  nonce mechanism at all, by disabling this bot-detection signal
  site-wide. **Not proposed**: it is a security regression in the opposite
  direction from what this amendment is for, and is out of scope for
  "Option B" as assigned. Recorded here only so it is a documented,
  considered-and-rejected alternative, not a missed one.

### 0.2 Why this is a material change, not routine implementation detail

Every requirement in REQ-001 to date has been satisfied by static output:
Markdown content, a static `_headers` file, a static build artifact
deployed as-is. This is the first point in the program where a request
executes server-side code before a response leaves Cloudflare's edge. That
is a category change in what "the site" is, not a bigger version of what it
already was — CLAUDE.md's reservation of "architecture changes with
significant impact" to the owner exists for exactly this kind of step, and
this qualifies regardless of how small the Function's actual logic turns
out to be (§6 risk 1 covers why "small logic" does not mean "no
consequence").

### 0.3 Evidentiary weight of the Cloudflare-behavior dependency

This program has an established standard for how much weight an unverified
external claim carries before requirements are drafted against it (REQ-001-
A1 §0.3, applied there to a single-session DNS query). Applied here to a
documentation claim instead: this session fetched and confirmed the quoted
text directly from Cloudflare's current published documentation, which is
stronger sourcing than an unsourced claim relayed second-hand. It is **not**
the same as this program having reproduced the behavior on its own zone,
under its own Bot Fight Mode configuration, with its own Function. The
documentation describes Cloudflare's general product behavior; it is not
proof this exact implementation will behave identically the first time it
is deployed. That reproduction is exactly what R-7.5 AC1a–AC1d and R-7.8
AC1 require before this amendment's ACs can be marked passing — this
amendment specifies the proof required, it does not substitute the
documentation citation for that proof.

---

## 1. Gap assessment

| REQ-001 location | Written assuming | Now known | Consequence |
|---|---|---|---|
| R-7.5 AC1 (`public/_headers`, static) | A single CSP value, computed once at build time by inspecting build output, is sufficient for every production response | Cloudflare's edge injects a script into every proxied response that a static, nonce-less policy cannot authorize without weakening `script-src` | AC1's three headers need a per-request generator (a Pages Function) for at least the CSP; a static file cannot mint a nonce |
| R-7.5 AC2 | "No CSP violation in the console" is verifiable against build output or the `pages.dev` origin | Only the real proxied hostname exercises the condition AC2 is actually about (QA-005 Finding 2) | New R-7.8 required; also closes R-7.5 AC1's own standing deploy-time gap, which has never had automated coverage against a live response at all |
| R-5.2 AC2 | 0 bytes of JS transferred, as measured against `pages.dev` | ~938 bytes on `www.haroonie.ai`, still inside budget | Numeric pass unaffected; recorded evidence is wrong for the hostname visitors use and must be corrected (§3.3), and re-measured once Option B ships (§4 U-series) |
| R-8.3 (assertion strength) | Any CSP loosening is presumptively a weakening the owner must approve as a compromise | A correctly-implemented per-response nonce is not weaker than today's `'self'`-only policy against generic attacker-injected script (§2); the meaningful change is a new, narrow trust dependency on Cloudflare's injection scope, not a lowered test assertion | R-8.3 AC1's "reduces assertion strength" gate is not triggered by this change (no test's assertion changes at all — see §2), but the trust-dependency point is disclosed to the owner anyway (E15), not assumed away because the flattering reading is available |

---

## 2. Does a nonce weaken R-7.5, and does it trigger R-8.3? — interrogated honestly

**The narrow question R-8.3 asks:** does this change reduce the strength of
any test's assertion. **Answer: no.** R-7.5 AC2's text — "no page produces a
CSP violation in the console" — does not change at all. Today it is written
strictly and *fails*. Option B is the one candidate fix among those QA-005
considered (`'unsafe-inline'`, disabling Bot Fight Mode, hashing, a nonce)
that makes AC2 pass by changing production's actual behavior to conform to
the already-strict assertion, rather than by loosening the assertion to
tolerate production's current behavior. `'unsafe-inline'` was rejected for
exactly the opposite reason: it would have made AC2 pass by removing the
principal protection AC2 exists to verify. Nothing here does that.

**The broader question worth asking even though R-8.3 doesn't require it:**
is the *policy itself*, independent of any test, weaker after this change?
Two threat models, answered separately rather than collapsed into one
verdict:

1. **Against an attacker trying to inject an arbitrary script via this
   site's own content or a future bug (stored/reflected XSS).** A
   correctly-implemented nonce — cryptographically random, unique per
   response, never also paired with `'unsafe-inline'` (AC1b) — is not
   weaker than the current `'self'`-only policy, and by the security
   community's own general guidance a nonce/hash-based `script-src` is
   considered *equal or stronger* than a bare allowlist, because an
   attacker who manages to inject a `<script>` tag still cannot execute it
   without also learning that response's unpredictable nonce. This is the
   textbook justification for nonce-based CSP; it is not specific to this
   site. **Verdict: not weaker, arguably stronger, for this threat.**
2. **Against the possibility that Cloudflare's edge injects something
   other than JavaScript Detections' bootstrap under the authority of this
   site's own nonce, at some point in the future, without this program's
   knowledge or consent.** Today, the static policy authorizes *no* inline
   script from anyone, ever — the block on Cloudflare's own injection is a
   side effect of a blanket rule, not a deliberate carve-out. After this
   change, the mechanism that authorizes Cloudflare's JS Detections script
   is the same mechanism that would authorize *any* inline script Cloudflare's
   edge chooses to inject and stamp with that response's nonce, and this
   program has no way to inspect or constrain that content before it
   executes in a visitor's browser — it is injected transparently, outside
   the built output this program controls. This is a **new** dependency;
   nothing today plays this role. **Verdict: this is a genuine, if narrow,
   trust-widening — not a weakening of the policy's defense against
   arbitrary attackers, but a new reliance on Cloudflare's own restraint
   and correctness that this program did not previously need.**

**Conclusion, stated plainly rather than picking the more flattering half:**
this change does not weaken any test's assertion (R-8.3 AC1's gate is not
triggered) and does not weaken the CSP's defense against the threat it was
principally written for (attacker-injected script). It does introduce a new
trust dependency on Cloudflare's edge that this document discloses rather
than omits (E15). The owner is asked to accept that dependency knowingly,
as a distinct decision from "approve the architecture change," because a
reader who only saw "not weaker, arguably stronger" would not have been
told the whole truth.

---

## 3. Proposed amendment text

Everything in this section was proposed new/changed text for
`requirements/REQ-001-mvp-public-website.md`, at the time this was drafted
and not yet approved. **Update, 2026-09-16: it has since been approved
(E14, E15) and incorporated into REQ-001 itself** — see that document's
header note, R-5.2 AC2, R-5.3 AC1, R-7.5, the new R-7.8, §4 (Test data),
§5 (U13–U19) and §6 (E14–E16). The text below is left as originally
drafted, as the record of what was proposed; REQ-001 is now the operative,
and occasionally slightly reworded, version.

### 3.1 Amendment to R-7.5 (add AC1a–AC1f; clarify AC1/AC2)

**R-7.5** Baseline security response headers are served.

- **AC1** — *(text unchanged)* Given any production page response, When
  headers are inspected, Then `X-Content-Type-Options: nosniff`, a
  `Referrer-Policy`, and a `Content-Security-Policy` are present.
  **Clarifying note (REQ-001-A2):** as of Option B, these headers'
  authoritative source is the Pages Function (`functions/_middleware.ts` or
  equivalent), not `public/_headers`. See AC1f and §4 U15 on why both
  cannot safely remain authoritative for the same header at once.
- **AC1a (new)** — Given two separate requests to the same production URL,
  When each response's `Content-Security-Policy` header is inspected, Then
  the `nonce-` token's value in `script-src` differs between the two
  responses, proving per-response generation rather than a cached or fixed
  value.
- **AC1b (new)** — Given the `Content-Security-Policy` header's `script-src`
  directive, When inspected, Then it contains `'self'` and exactly one
  `nonce-<value>` token, and never contains `'unsafe-inline'` — including on
  the fail-safe path (AC1e) — since a browser that does not honor the nonce
  would otherwise silently fall back to authorizing all inline script.
- **AC1c (new)** — Given a sample of at least 20 consecutive production
  responses, When their nonce values are compared, Then no two repeat, and
  each decodes to at least 128 bits (16 bytes) of randomness from a
  cryptographically secure source (e.g. Web Crypto `crypto.getRandomValues`)
  — not `Math.random()`, a counter, a timestamp, or any value already
  visible elsewhere in the response (e.g. the Ray ID).
- **AC1d (new)** — Given a request to any path under
  `/cdn-cgi/challenge-platform/`, When the CSP is inspected, Then that path
  resolves under `'self'` (same-origin) — the specific allowance
  Cloudflare's documentation states this feature requires (§0.1).
- **AC1e (new)** — Given the Pages Function fails to execute for any reason
  (unhandled exception, runtime error, timeout), When the response is
  nonetheless served, Then it still carries a `Content-Security-Policy` at
  least as strict as the pre-Option-B static policy (`script-src 'self'`,
  no `'unsafe-inline'`, no nonce), and the response is not a 500/error page
  solely because of this fallback. A Function fault must degrade CSP
  strictness back to today's already-tolerated behavior (JS Detections'
  console error reappears) rather than degrading availability (R-7.2 AC1)
  or shipping with no CSP at all.
- **AC1f (new)** — Given any production page response, When its raw
  headers are inspected, Then exactly one `Content-Security-Policy` header
  is present — never zero (the Function silently not running and nothing
  else supplying it), never two (the Function and a stale `public/_headers`
  entry both firing on the same response).
- **AC2** — *(text unchanged)* Given the CSP, When the site is browsed,
  Then no page produces a CSP violation in the console. **Clarifying note
  (REQ-001-A2):** per QA-005 Finding 2, this AC is only meaningfully
  verified against the real production hostname `https://www.haroonie.ai/`,
  where Cloudflare's injection actually occurs. See R-7.8.
- Verified by: AC1a–AC1d and AC1f are testable against any deployed Pages
  environment that runs the Function (preview or production alike, since
  the Function itself — not the zone-level proxy — generates the nonce);
  AC1e is testable by deliberately forcing a Function error in a
  non-production deployment and inspecting the fallback response; AC2 is
  testable **only** against the real production hostname (R-7.8), since
  JavaScript Detections' injection is a zone-level, Bot-Fight-Mode-gated
  behavior absent from `*.pages.dev`.

### 3.2 New requirement — R-7.8 (insert after R-7.7)

**R-7.8 — Automated verification of security headers and script execution
runs against the real production hostname, not build output or the
`pages.dev` origin.** Closes QA-005 Finding 2, and closes R-7.5 AC1's
standing deploy-time gap (no automated coverage against a live response
existed before this requirement).

- **AC1** — Given a completed production deployment (R-6.4), When the
  post-deployment smoke suite runs, Then it additionally requests
  `https://www.haroonie.ai/` — not `*.pages.dev`, not local build output —
  across Chromium, Firefox and WebKit, and asserts zero CSP violations and
  zero console errors on each of the six R-2 routes.
- **AC2** — Given the same production smoke run, When response headers are
  inspected, Then `X-Content-Type-Options`, `Referrer-Policy` and
  `Content-Security-Policy` (R-7.5 AC1) are verified present on the live
  response itself, not inferred from `_headers` file content or local
  build output.
- **AC3** — Given the same production smoke run, When total transferred
  JavaScript is measured per page, Then the figure is recorded against the
  production hostname specifically (R-5.2 AC2), superseding any figure
  recorded only against `*.pages.dev` or local output.
- **AC4** — Given Option B is deployed to production, When R-5.2 AC1's
  existing Lighthouse Performance / LCP audit is next executed, Then it is
  re-run against the post-Function production hostname and compared to the
  most recent pre-Function baseline, with any regression reported rather
  than silently absorbed as "still passing" without a stated comparison
  (§6 risk 1).
- **AC5** — Given this suite exists, When it fails, Then the failure is
  surfaced as a CI failure and a rollback recommendation is recorded, per
  R-6.4 AC2's existing pattern — not merely logged.
- **AC6** — Given this new production-hostname suite exists alongside the
  pre-existing build-output suites (`cross-browser.spec.ts`,
  `lighthouse.spec.ts`, `security-headers.spec.ts`), When both run, Then
  the build-output suites are retained unchanged as fast pre-merge gates —
  they were never wrong, only insufficient alone (QA-005) — and the new
  suite is additive, not a replacement.
- Verified by: a new Playwright spec (naming is an Engineer decision)
  executed as part of the post-deployment job in `ci-cd.yml`, gated the
  same way R-6.4's existing smoke suite is gated.

### 3.3 Correction to R-5.2 AC2's recorded evidence (not a change to AC2 itself)

AC2's text and 50 KB threshold are unchanged. The previously recorded
measurement ("0 bytes of JS") was accurate for
`haroonie-ai-public-site.pages.dev` at the time it was recorded, but is not
the correct figure for the hostname visitors actually use:
`https://www.haroonie.ai/services/` measured ~938 bytes of Cloudflare-
injected script during QA-005's investigation (2026-09-16). **AC2 still
PASSES** — 938 bytes is far inside the 50 KB budget — but the recorded
evidence is corrected to state the production-hostname figure, and R-7.8
AC3 requires all future measurements to target production specifically, so
this kind of silent drift (a true figure at the moment it was recorded,
invalidated later by an unrelated Cloudflare-side configuration change) is
caught going forward rather than discovered incidentally, as it was here.

### 3.4 Amendment to §4 Test data and preconditions (add rows)

| Item | Value | Source |
|------|-------|--------|
| Cloudflare documentation citations (JS Detections + Bot Fight Mode + CSP) | `developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/`; `developers.cloudflare.com/bots/get-started/bot-fight-mode/` | Fetched via Cloudflare documentation search, this session, 2026-09-16 (§0.3 on evidentiary weight) |
| Current CSP baseline (pre-Option-B), for the "only `script-src` changes" rule (§4 U16) | `default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'` | `public/_headers`, R-7.5 (as merged to `main`, PR #4) |
| Measured injected-script size, production hostname | ~938 bytes, `www.haroonie.ai/services/` | QA-005, 2026-09-16 |
| Minimum nonce entropy | 128 bits (16 bytes), CSPRNG-sourced | W3C CSP Level 3 recommendation; a security-engineering default applied per §4 U14, not owner-supplied |

---

## 4. Ambiguities (continuing REQ-001 §5's numbering — U13 onward)

| # | Ambiguity | Safest default applied |
|---|-----------|------------------------|
| U13 | Should the Function's route-matching be global (`functions/_middleware.ts` applying to every request) or scoped only to HTML document routes? | Global. CSP headers on non-document responses (assets, `sitemap.xml`, etc.) are inert in browsers, not harmful; excluding paths adds complexity — and a new class of "did we forget a path" bug — for no protective benefit. R-7.5 AC1's "any production page response" reads most naturally as global anyway. |
| U14 | Nonce generation source and minimum entropy — no owner or prior-document guidance exists on this. | `crypto.getRandomValues()` (Web Crypto, available in the Pages Functions runtime), at least 16 random bytes (128 bits), base64-encoded. Not `crypto.randomUUID()` (fewer effective random bits than a raw 128-bit CSPRNG value, per its version/variant bits), not `Math.random()`, not derived from any value already visible in the response. |
| U15 | Should `public/_headers`'s `Content-Security-Policy`, `X-Content-Type-Options` and `Referrer-Policy` lines be deleted once the Function takes over, or left in place as a "backup"? | Deleted. AC1f requires exactly one CSP header per response; this session could not locate Cloudflare documentation establishing a defined precedence between a Pages Function's headers and a static `_headers` file for the same header name (searched this session, no result — see U17), so "leave both and hope one wins predictably" is not treated as safe. Deleting the overlapping lines removes the ambiguity outright rather than resting a security header on an unconfirmed precedence rule. |
| U16 | Is this amendment's CSP change scoped to `script-src` only, or an invitation to revisit the whole policy? | `script-src` only. Every other directive (`default-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `form-action`, `frame-ancestors`, `base-uri`, `object-src`) carries over unchanged, verbatim, from the current `public/_headers` baseline (§3.4), so this does not become an undisclosed, unreviewed CSP rewrite riding on an architecture-change approval. |
| U17 | What is Cloudflare's actual precedence/interaction rule between a Pages Function's response headers and a static `_headers` file rule for the same header name? | Not established by this session's documentation search (queried; no result). Safest default: do not rely on an assumed precedence at all. AC1f's "exactly one header, empirically verified against a live deployed response" is the requirement, regardless of which mechanism a reader might expect to "win" — any deviation is a build/deploy defect to fix, not a surprising-but-acceptable outcome to explain away. |
| U18 | Which direction should the Function fail in if it errors — degrade strictness, degrade availability, or ship with no CSP? | Degrade strictness (AC1e): fall back to the pre-Option-B static policy value. Never zero CSP, never a 500 solely because of this fallback. |
| U19 | Does deploying a Pages Function require any Cloudflare permission beyond CI's existing scoped token (R-6.6, Pages: Edit)? | Assume no new grant is required — Functions ship as part of the same Pages deployment artifact, through the same GitHub Actions → Cloudflare Pages path (R-6.3) already in use — but this is unverified by this program specifically for Functions. If a deployment attempt is rejected for a permissions reason, that is E16 (§5), not a problem to work around by unilaterally broadening the token's scope. |

---

## 5. Escalations requiring human action

These continue `status/STATUS.md`'s program-wide escalation numbering — the
same scheme REQ-001 §6 uses when it refers to "E8", "E11", "E12", "E13" (not
REQ-001 §6's own separate, already-resolved local E7/E8 pair from its
2026-09-10 drafting). The shared ledger's highest assigned number to date is
E13 (`status/E13-zone-token-write-grants.md`); this amendment adds E14–E16.

| # | Item | Blocks |
|---|------|--------|
| E14 (new) | Owner must approve the architecture change itself: adopting a Cloudflare Pages Function as a new, server-side, request-time execution component of what has been a purely static site through every prior wave, and moving R-7.5's CSP header off `public/_headers` onto that Function's output. This is the core §0 ask. | All of this amendment's new/amended ACs (R-7.5 AC1a–AC1f, R-7.8) and any Engineer/PM work sequenced against them |
| E15 (new) | Owner must accept, as a disclosed consequence of E14 rather than a hidden side effect, the trust-dependency identified in §2: a nonce-based CSP delegates to Cloudflare's edge the decision of which inline script content is authorized on every response, for as long as JavaScript Detections/Bot Fight Mode is enabled on this zone, and this program cannot inspect or constrain that content before it executes in a visitor's browser. §2's conclusion is that this is not a weakening of the CSP's defense against the threat it was principally written for (attacker-injected script), but it is a new reliance this program did not previously have. | Nothing today is blocked pending this specifically (the owner already chose Option B), but the owner should be recorded as having been told explicitly, not left to discover it later |
| E16 (new — conditional) | If, during implementation, deploying a Pages Function is found to require a Cloudflare permission grant beyond CI's existing scoped token (R-6.6), that is a credentials/access escalation under CLAUDE.md and must stop for owner action rather than be resolved by unilaterally broadening the token's scope. Not yet known to be triggered (§4 U19) — recorded here so it is not missed if it arises mid-implementation. | Nothing today; only relevant if a broader grant turns out to be needed |

**Update, 2026-09-16:** E14 and E15 above are **APPROVED** — see this
document's status line at the top, and REQ-001 §6 for the full verbatim
record (merge commit `5a8f4990`). E16 remains conditional and not yet
triggered.

---

## 6. Risks worth naming

1. **Latency — the Function runs on every request.** Nonce generation
   itself is cheap (a handful of random bytes), but Pages Functions
   invocation is not free, and Wave 6's performance budgets (R-5.2 AC1:
   Lighthouse Performance ≥95, LCP <2.5s) were last measured against a
   purely static architecture. R-7.8 AC4 requires this budget to be
   explicitly re-verified against the post-Option-B production hostname,
   not assumed unaffected because "it's just a header."
2. **CSP source-of-truth drift / double-emission.** With two places
   capable of defining the same header (`public/_headers`, static; the
   Function, dynamic), an edit to one without the other becomes a new class
   of defect that could not exist while there was only one source. AC1f is
   the direct testable guard; U15's safest default (delete the overlapping
   static lines) is the recommended way to avoid needing to keep two
   sources in sync by discipline alone.
3. **Dependency on documented, not independently reproduced, Cloudflare
   behavior.** §0.3: this session confirmed the quoted behavior against
   Cloudflare's current documentation, which is stronger sourcing than an
   unsourced claim, but it is not proof of behavior on this program's own
   zone under its own configuration. R-7.5 AC1a–AC1d and R-7.8 AC1 are the
   required reproduction; until they pass on a real deployment, treat the
   mechanism as "documented, not yet proven here."
4. **Behavior if the Function errors or is bypassed.** The one failure mode
   that could make things silently worse than today (shipping with
   literally no CSP, or a 500 in place of every page) rather than merely
   reintroducing today's already-tolerated console error. AC1e (degrade
   strictness, not availability or protection) and AC1f (never zero, never
   two headers) are the named guards.
5. **ETag stripping (found this session, not in the original brief).**
   Cloudflare's documentation states JavaScript Detections strips ETags
   from HTML responses where it injects the script. This is an existing
   side effect of Bot Fight Mode already live today, independent of Option
   B — flagged here only so it is not mistaken for a new regression when
   Wave 6 next audits caching behaviour.

---

## 7. Traceability note (R-8.1)

| AC | Verified by |
|---|---|
| R-7.5 AC1a, AC1b, AC1c, AC1d, AC1f | Playwright, against any deployed Pages environment running the Function (preview or production) — the Function generates the nonce independent of the zone-level proxy. |
| R-7.5 AC1e | Playwright, against a non-production deployment with the Function's error path deliberately forced. |
| R-7.5 AC2 | Playwright, production hostname only (`https://www.haroonie.ai/`) — see R-7.8 AC1. Not satisfiable against `*.pages.dev` or local build output (QA-005 Finding 2). |
| R-7.8 AC1–AC3, AC5, AC6 | New Playwright spec, run as part of the post-deployment CI job (`ci-cd.yml`), gated as R-6.4's smoke suite already is. |
| R-7.8 AC4 | Existing Lighthouse audit (R-5.2 AC1), re-run against the post-Option-B production hostname and compared to the prior baseline; recorded manually or via the same automated mechanism R-5.2 AC1 already uses. |
| R-5.2 AC2 correction (§3.3) | No new test — a corrected recorded figure. Future measurements are covered by R-7.8 AC3. |

---

## 8. Summary for the owner

**What's being adopted:** a Cloudflare Pages Function that mints a
cryptographically random nonce on every response, so Cloudflare's own
JavaScript Detections script — which this zone's Bot Fight Mode injects
automatically and cannot disable — is authorized by that nonce instead of
being blocked. This replaces `public/_headers` as the CSP's authoritative
source. It is the first server-side, request-time code this site has ever
run.

**Is it weaker than what we have today?** Against the threat the CSP
principally exists for — an attacker injecting arbitrary script — no, a
correctly-built nonce is not weaker and arguably stronger, and no test's
assertion is loosened anywhere in this document (§2). It does create one
new, narrow thing this program has never had to trust before: Cloudflare's
own restraint about what it injects under that nonce. That is disclosed
plainly (E15), not glossed over.

**What's being asked of the owner:** approve E14 (the architecture change
itself), acknowledge E15 (the disclosed trust-dependency), and approve the
new/amended ACs in §3 (R-7.5 AC1a–AC1f, the new R-7.8, and the R-5.2 AC2
evidence correction). E16 is conditional and does not block today. Nothing
here touches E1/E2 (DNS, already open and unrelated) or any already-resolved
item in REQ-001 §6.

**Update, 2026-09-16 — all of the above is now approved.** E14 and E15 were
both given first-hand, verbatim, in this session (see the status line at
the top of this document and REQ-001 §6). This document's ACs are folded
into REQ-001 and REQ-001 is now the operative specification; this file
remains as the historical record of why.
