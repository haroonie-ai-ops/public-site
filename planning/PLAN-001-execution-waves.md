# PLAN-001 — Execution Waves for REQ-001

Status: DRAFT
Source: REQ-001-mvp-public-website.md (Approved 2026-09-10)
Author: Project Manager
Date: 2026-09-10

This plan sequences REQ-001 into execution waves. Waves are grouped so that
everything inside a wave can run in parallel without contending for the same
files or shared state; ordering between waves reflects a real technical
dependency, not a preference.

---

## 1. Dependency graph (requirement groups)

```
R-1 (foundation)
  |
  +--> R-2 (pages/content) --+--> R-4 (SEO/analytics)
  |                          +--> R-5.1 (accessibility, per-page)
  |                          +--> R-3.1 static half (R-2.4 AC1)
  |
  +--> R-6 (CI/CD) <---- requires E3, E5 (owner) and a build to gate (R-1.2)
  |         |
R-7 (domain/hosting) <---- requires E1, E2 (owner)
  |         |
  +----+----+
       |
  R-6.4 / R-6.5 (post-deploy smoke, rollback) -- needs BOTH pipeline and live domain
       |
R-3.1 full form -- independently blocked on E4 (owner), not on the above
       |
R-5.2 / R-5.3 (perf budget, cross-browser) -- most reliable against a real
       preview/production deployment, so sequenced after R-6+R-7 land, though
       partial local checks can run earlier
       |
R-8 (traceability, independent review) -- continuous, finalized last
```

Reasoning for each edge:
- R-2 needs R-1's scaffold and dev server to exist before a page can be built
  or tested.
- R-4's meta tags, sitemap and JSON-LD are properties of pages, so they need
  R-2's page set to attach to.
- R-6 needs something to build (R-1.2) and, to be a meaningful gate, needs
  tests to run (R-2's Playwright specs). It also needs owner-provided
  credentials (E3, E5) that no agent can create.
- R-7 has no code dependency at all — it is Cloudflare/DNS configuration —
  but is gated entirely on owner actions (E1, E2).
- R-6.3's AC1 ("`www.haroonie.ai` serves the merged content") cannot be
  verified until R-7 exists, so full CI/CD acceptance and R-7 converge before
  R-6.4/R-6.5 can be demonstrated end-to-end.
- R-3.1 (the working form) is deliberately decoupled from everything else —
  REQ-001 already marks it blocked on E4 and explicitly not a launch
  blocker, so it must never hold up any other wave.
- R-8 is not a phase, it is a running ledger updated as every other wave
  closes; "final" only in the sense that acceptance sign-off happens last.

---

## 2. Waves

### Wave 0 — Owner actions (parallel to everything; not on the critical path
until noted)

Not executable by agents. Tracked here so their absence is visible, not
because they block Wave 1.

| ID | Action | First wave that actually needs it |
|----|--------|-----------------------------------|
| E1 | Cloudflare account + add `haroonie.ai` zone | Wave 4 |
| E2 | Registrar nameserver delegation to Cloudflare | Wave 4 |
| E3 | GitHub repo (remote) under `haroonie-ai-ops` + secrets configured | Wave 3 |
| E5 | Scoped Cloudflare API token — Account → Cloudflare Pages: Edit, CI deploy only | Wave 3 |
| E6 | Copy: services, bio, legal entity/address, enquiry mailbox, booking URL | Wave 2 (structure proceeds without it; production content gate) |
| E4 | Transactional email credential | Wave 5 only |

**Owner decisions recorded 2026-09-11 (access/credentials — owner-approved
per CLAUDE.md):**

- **E3 resource owner:** the remote repository lives under the
  `haroonie-ai-ops` GitHub account. The fine-grained PAT authenticates as
  that account and is scoped to that single repository.
- **E5 scope correction.** The original entry above read "Pages edit only".
  That is correct for CI — R-6.2 and R-6.3 need nothing beyond Account →
  Cloudflare Pages: Edit — but was **insufficient for Wave 4**: R-7.2 needs a
  DNS record, R-7.3 a redirect rule (permission name "Dynamic Redirect", not
  "Single Redirect"), and R-7.4 zone TLS settings, none of which that
  permission grants. Resolved **without** a second token: Wave 4 zone
  configuration is performed through Cloudflare's hosted remote MCP server
  (`https://mcp.cloudflare.com/mcp`, OAuth, interactive owner consent) rather
  than a stored credential. E5 therefore remains a single CI-only token, and
  no long-lived DNS-capable secret exists anywhere in this program. R-7.5's
  security headers need no Cloudflare permission at all — they ship from
  `public/_headers` in the repository.

  **Correction, 2026-09-14 — this plan is not viable; superseded by E10, not
  deleted.** The paragraph above was written assuming the hosted OAuth MCP
  session would have the access Wave 4 needs. It does not: independently
  verified (twice, in two separate sessions, identical result both times),
  `GET /zones` through that same session returns `success: true` with an
  **empty result** for an account that public DNS proves has at least one
  Cloudflare-delegated domain — consistent with this program's separate
  finding (E9) that the grant is product-scoped (Pages/account endpoints
  readable; several other products, including this one, are not), not
  account-wide. If the session cannot even *read* zone resources, it cannot
  perform the *writes* (R-7.2 DNS records, R-7.3's redirect rule, R-7.4 TLS
  settings) this paragraph assumed it would. Full reasoning, the
  independent verification, and three owner options (a scoped token — the
  exact thing this correction was written to avoid; `wrangler login`; or
  manual dashboard configuration) are recorded as **E10** in
  `status/STATUS.md` — not duplicated here to avoid two copies drifting
  apart. E5 itself is unaffected and still correct as a CI-only token; only
  this paragraph's Wave 4 plan is superseded.

- **E2 CLOSED, 2026-09-14 — proven, not assumed.** Direct public DNS lookup
  (`nslookup -type=NS haroonie.ai 8.8.8.8`, independently reproduced twice)
  returns `alex.ns.cloudflare.com` and `zoe.ns.cloudflare.com` — Cloudflare's
  own nameservers, delegated. This satisfies R-7.1 AC1's "Cloudflare
  nameservers are returned" half against real evidence. **Registrar fact,
  owner-supplied and consistent with the above: Cloudflare is also the
  domain registrar for `haroonie.ai`.** This is a material simplification
  of this row's original framing ("registrar nameserver delegation to
  Cloudflare"), which implicitly assumed a separate third-party registrar
  performing a delegation step to a different DNS host. That vendor
  boundary does not exist here — registration and DNS hosting are the same
  vendor, so there is no separate registrar-side action anyone needs to
  take or verify.
- **E1 remains INFERRED, not confirmed, 2026-09-14.** The delegation above
  strongly implies a zone exists (Cloudflare only issues a specific
  nameserver pair once a zone is added), but `GET /zones` — both filtered
  and unfiltered — returns an empty, ambiguous result under this program's
  current API access (see the E5 correction above and E10 in
  `status/STATUS.md`). Do not treat E1 as closed on the delegation alone;
  it needs either a credential that can read zone resources or the owner
  confirming status directly in the dashboard. Confirmed directly, and
  unaffected by the above: no DNS records exist yet — `www.haroonie.ai` is
  `NXDOMAIN` and the apex has no `A` record, so R-7.2/R-7.3 remain fully
  untouched work, exactly as already scoped to Wave 4 below.

**Action for owner, low effort, unblocks the most work fastest:** E3 and E5
together unlock all of Wave 3; E1+E2 together unlock all of Wave 4. E6 does
not block any code from being written, only from being marked
production-ready.

---

### Wave 1 — Foundation
**Depends on:** nothing beyond REQ-001 approval. **Blocks:** everything else.

Scope: Astro project scaffold, pinned Node version + lockfile, base layout
shell (header/footer/nav per R-2.7, with placeholder nav targets), 404 page
skeleton (R-2.6), empty Playwright project wired to run against the local
dev server, `.gitignore`/secret hygiene (R-1.4), first commit.

Single engineer; nothing here is parallelizable against itself because it
*is* the shared scaffold everything else builds on.

**Exit criteria:**
- `npm install && npm run build` exits 0 from a clean clone
- `npm run dev` serves a 200 on every route stub
- Playwright launches against localhost and a smoke spec passes
- Node version file and lockfile are committed
- No secret or credential is present in the diff

---

### Wave 2 — Pages, content and SEO plumbing
**Depends on:** Wave 1. **Contains parallelizable sub-waves.**

**2a (sequential, one engineer, must land first):** shared layout, nav
active-state logic, footer, base `<head>` meta component, JSON-LD component,
sitemap/robots integration (R-4.1–R-4.4). These are the files every page
below imports — touching them concurrently from multiple branches is the
single highest merge-contention risk in this project.

**2b (parallel once 2a merges, one engineer per item — safe to run
simultaneously, no shared files beyond what 2a already fixed):**
- Home (R-2.1)
- Services (R-2.2)
- About (R-2.3)
- Contact — static portion only: R-2.4 AC1 (email + booking link), R-2.4 AC2
  markup (form fields render; wiring is Wave 5)
- Privacy + Terms (R-2.5)

All content in 2b uses clearly marked placeholder copy per REQ-001 §1.3
wherever E6 has not landed. Each page's Playwright spec is authored by the
same engineer alongside the page (R-2's ACs plus R-5.1 accessibility scan
integrated per page, not deferred to a later wave).

**Contention risk called out explicitly:** if E6 (real copy) arrives mid-wave,
route it to whichever page is currently least-merged to avoid rebasing
finished work.

**Exit criteria:**
- All pages in R-2 render, are linked from nav, pass their Playwright specs
  locally, and pass an automated accessibility scan with zero serious/critical
  violations
- Every page has unique title/description/canonical/OG tags and validates
  against R-4.1
- Sitemap and robots.txt serve correctly in the local build preview
- Placeholder content is inventoried in one place (see §4) so it cannot be
  missed at go-live

---

### Wave 3 — CI/CD pipeline
**Depends on:** Wave 1 (build command), Wave 2 in progress (needs at least
one real Playwright spec to prove the gate actually gates). **Owner-blocked
on:** E3, E5.

Scope: GitHub Actions workflow for R-6.1 (PR validation: install, build,
lint, Playwright), R-6.2 (preview deploy per PR, tagged non-indexable per
R-4.4), R-6.3 (production deploy on merge to `main`), R-6.6 (token as a
repository secret, never logged), R-6.7 (pinned/locked reproducible build).

Workflow YAML can be drafted and unit-reasoned about before E3/E5 land, but
**cannot be verified running** until the repo has a GitHub remote and a
Cloudflare API token exists as a secret. Do not report R-6.1–R-6.3 complete
on the strength of a local dry run alone.

**Exit criteria:**
- A real PR against the real GitHub remote shows the workflow executing,
  failing on a deliberately broken test, and blocking merge
- A real PR produces a working, non-indexable preview URL
- A real merge to `main` produces a real Cloudflare Pages production
  deployment (verification completes in Wave 7 once R-7 is also live, but the
  pipeline mechanics are proven here)

---

### Wave 4 — Domain and hosting configuration
**Depends on:** nothing from Wave 1–3 technically, but has no code to test
against until Wave 3 exists. **Owner-blocked on:** E1 (inferred resolved
from delegation, not independently confirmed — see the Wave 0 corrections
above) and **E10** (new, 2026-09-14: the access path this section originally
assumed — Cloudflare's hosted OAuth MCP server — does not appear to reach
zone resources; see the E5 correction above and `status/STATUS.md`).
**E2 is closed** (nameserver delegation proven 2026-09-14) and no longer
blocks this wave.

Scope: R-7.1 (zone active on Cloudflare nameservers), R-7.2 (`www` canonical
+ TLS), R-7.3 (apex → `www` 301, path-preserving), R-7.4 (HTTPS upgrade +
HSTS), R-7.5 (security headers), R-7.6 (trailing-slash canonicalization).
Also: create the Cloudflare Pages project itself — this is shared
infrastructure between Wave 3 and Wave 4, do it once, here, first.

**R-7.1 AC1 reference value, confirmed 2026-09-14 by direct public DNS
lookup:** `haroonie.ai`'s delegated nameservers are `alex.ns.cloudflare.com`
and `zoe.ns.cloudflare.com`. Verify against these exact values, not a
generic "*.ns.cloudflare.com" pattern.

**Exit criteria:**
- `https://www.haroonie.ai/` resolves to a Cloudflare Pages deployment with a
  valid cert
- Apex 301s to `www`, preserving path
- HTTP upgrades to HTTPS; HSTS present
- Security headers present on every response; zero CSP console violations
  across R-2's pages

**Status, 2026-09-16 (see §7): R-7.1–R-7.4, R-7.6 and R-7.5 (as a static
`public/_headers` file, PR #4) merged 2026-09-15. R-7.5 AC2 subsequently
found FAILING against the real production hostname (QA-005) — see §7 for
the revision this drives. This exit-criteria list describes the wave as
originally scoped; §7 is the current word on R-7.5's status.**

---

### Wave 5 — Enquiry form completion
**Depends on:** Wave 2 (Contact page skeleton). **Owner-blocked on:** E4.
**Explicitly not a launch blocker per REQ-001 R-3.1.**

Scope: full R-3.1 — client + server validation, spam protection, delivery to
owner mailbox, success/failure states.

Runs whenever E4 arrives, independent of every other wave's status. If E4 is
still outstanding when Wave 7 (go-live) is ready, launch proceeds without it
per REQ-001 and this becomes a fast-follow.

**Exit criteria:** R-3.1 AC1–AC3 pass against a live send to a test mailbox
address (not a real prospect address).

---

### Wave 6 — Performance and cross-browser hardening
**Depends on:** Wave 2 fully merged; most accurate once Wave 3+4 give a real
deployed URL to audit, though local Lighthouse checks can start earlier as a
leading indicator.

Scope: R-5.2 (Lighthouse ≥95, LCP <2.5s, <50KB JS), R-5.3 (Chromium/Firefox/
WebKit pass with no console errors).

**Exit criteria:** budgets met on the deployed preview URL, and again on
production during Wave 7's smoke pass.

**Status, 2026-09-16 (see §7): merged 2026-09-15 (PR #5) — Lighthouse
Performance 100/six pages, LCP 856-1204ms, `status/PERF-001-wave6-audit.md`.
QA-005 (2026-09-16) subsequently found R-5.3 AC1 (no console errors) failing
on the real production hostname for the same CSP-injection reason as R-7.5
AC2, and R-5.2 AC2's recorded "0 bytes JS" evidence stale for that hostname
(~938 bytes measured, still inside budget). See §7 — this wave's numbers
require a second pass once REQ-001-A2 ships, not a reopening of this wave.**

---

### Wave 7 — Go-live and acceptance
**Depends on:** Wave 3 + Wave 4 both closed (pipeline proven and domain
live). Wave 5 optional per above. Wave 6 closed.

Scope: R-6.4 (post-deploy smoke suite against production), R-6.5 (rollback
drill — actually restore a prior deployment and confirm it serves), R-8
(traceability matrix complete, Tester independent review executed,
regression suite green), final placeholder-content audit against §4 below,
Acceptance, Delivery.

**Exit criteria:** matches REQ-001 §8's completion definition in full — no
critical blocker remains, tests pass, tester sign-off recorded, status
updated to Delivered.

---

## 3. Parallel-safe summary

| Can run together right now | Cannot — same files/state |
|---|---|
| Wave 1 tasks are inherently sequential (one scaffold) | Wave 2a must fully merge before any Wave 2b page branches, else every 2b branch rebases against a moving layout |
| Wave 2b's five pages, once 2a is merged | Two engineers on layout/nav/head component simultaneously |
| Wave 3 (pipeline) and Wave 4 (domain) — no shared files, different owner-escalation dependencies | Wave 3 and Wave 4 both touch the Cloudflare Pages *project* itself once — create it in Wave 4 and reference it in Wave 3, don't let both try to create it |
| Wave 5 (form) against any other wave | Wave 5 and Wave 2b's Contact page, if literally concurrent — sequence Wave 5 to start after Wave 2b's Contact page merges |
| Wave 6 local checks against Wave 2 output | Wave 6 production numbers before Wave 4 is live |

---

## 4. Placeholder-content register (owned jointly with Business Analyst)

Every piece of placeholder copy introduced in Wave 2 must be logged in
`status/placeholder-content.md` with page, field, and the real value it is
waiting on (E6). This register is checked at Wave 7 exit; REQ-001 §1.3
prohibits any entry surviving to production.

---

## 5. Blockers and impact radius

| Blocker | Impact radius | What proceeds regardless |
|---|---|---|
| E1 unconfirmed / E10 (updated 2026-09-14; E2 closed) | Wave 4 cannot start; Wave 7 cannot close | Waves 1, 2, 3, 5, 6 all proceed fully |
| E3/E5 not actioned | Wave 3 cannot be *verified* (drafting still possible); Wave 7 cannot close | Waves 1, 2, 4, 5, 6 all proceed fully |
| E4 not actioned | Wave 5 cannot start | Every other wave, including go-live, proceeds — R-3.1 is non-blocking by design |
| E6 incomplete | Affected pages carry logged placeholders, blocking only those pages' production sign-off | Scaffolding, tests, CI, domain, and unaffected pages all proceed |

**Row updated 2026-09-14, not silently replaced:** this row originally read
"E1/E2 not actioned." E2 (nameserver delegation) is now proven closed by
direct public DNS lookup — see the Wave 0 corrections and Wave 4 section
above. E1 (zone existence) remains unconfirmed, not closed, on the same
evidence. A new escalation, E10, replaces what was going to be the access
mechanism for actually configuring the zone once E1/E2 cleared — so Wave
4's practical blocker moved from "delegation not done" to "confirmed
delegation, unconfirmed zone, and no working access path to configure it
regardless." Full detail: `status/STATUS.md` (E1/E2, E10).

**Row added 2026-09-16 — see §7 for full detail:**

| Blocker | Impact radius | What proceeds regardless |
|---|---|---|
| E14/E15 (REQ-001-A2 architecture approval / trust-dependency acceptance) — owner, not yet resolved | Blocks Wave 4-R1 (§7) — the CSP-nonce fix for QA-005 Finding 1 — only | Every other wave: 1, 2, 3, 5 (E4-gated), and Wave 6/7 work not dependent on the CSP mechanism |

No single outstanding item halts the program. Per CLAUDE.md failure policy,
any wave that hits three unsuccessful repair cycles is logged as a blocker
in `status/` with evidence and a recommended action, and unrelated waves
continue.

---

## 6. Recommended sequencing for the owner

If you want the fastest path to something live at `www.haroonie.ai`, the
two owner actions with the highest leverage are **E3+E5** (unlocks Wave 3)
and **E1+E2** (unlocks Wave 4) — both can be done today in parallel with
each other and with Wave 1/2 engineering work already starting. E6 (copy)
is the next-highest leverage item since it gates production sign-off on
three pages, but does not block any wave from starting.

**Updated 2026-09-14, not silently replaced:** E2 is now done — proven by
direct DNS lookup, not just actioned. E1 is very likely also done (the
delegation above is strong indirect evidence a zone exists) but is not
independently confirmed under this program's current Cloudflare access,
and should not be treated as closed on inference alone. The bigger
practical gap for Wave 4 is now **E10**: even once E1 is confirmed, this
program has no working access path to actually perform Wave 4's DNS/
redirect/TLS configuration — the plan this document originally recorded
(the hosted OAuth MCP server) does not reach zone resources. The owner's
highest-leverage action for Wave 4 today is deciding E10's three options
(scoped token / `wrangler login` / manual dashboard work), not E1/E2,
which are effectively settled or near-settled. Full detail:
`status/STATUS.md` (E1/E2, E10).

**Updated 2026-09-16, not silently replaced:** E1, E2, E10 are all
superseded by events — Wave 4's DNS/TLS/redirect work is live (R-7.1–R-7.4,
R-7.6), REQ-001-A1 folded into REQ-001 with E11/E12/E13 resolved, and
`public/_headers` (R-7.5) shipped (PR #4). The highest-leverage owner
action right now is **E14+E15** (§7): approving REQ-001-A2's architecture
change and acknowledging its disclosed trust-dependency is what unblocks
the one currently-known production defect (QA-005 Finding 1) from being
fixed. Nothing else in the plan is gated by this decision.

---

## 7. Amendment — REQ-001-A2 (CSP nonce via Cloudflare Pages Function)

Status: **DRAFT amendment, not yet owner-approved** (E14/E15 open,
`requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md`). Nothing
in this section authorizes implementation; it records where this work
sequences once approved, so sequencing is not re-derived from scratch
mid-approval or, worse, skipped.

### 7.1 What this is, in plan terms

QA-005 Finding 1 found R-7.5 AC2 and R-5.3 AC1 failing against production.
That is a **defect discovered in already-shipped work** (R-7.5 static
headers, PR #4; Wave 6 perf/cross-browser audit, PR #5 — both merged
2026-09-15), not unstarted greenfield scope. REQ-001-A2 is therefore a
**revision to Wave 4 and Wave 6's already-delivered ACs**, not a new
numbered wave. It is tracked here as **Wave 4-R1** to keep it distinct from
Wave 4's original (closed-in-practice) scope, while making clear it is a
patch, not a fresh wave with independent entry criteria.

### 7.2 Dependency graph addition

```
Wave 3 (CI/CD, merged) ---\
                            +--> Wave 4-R1 (REQ-001-A2: CSP nonce Function) --> Wave 6 re-verification (R-7.8 AC4)
Wave 4 (R-7.5 static headers, merged) --/
        ^
        |
   E14 + E15 (owner) -- hard gate, nothing below executes without both
```

Reasoning:
- **Wave 4 (merged)** created the Cloudflare Pages project and the zone the
  Function must attach to, and is the thing being revised (R-7.5's
  authoritative CSP source moves off `public/_headers`).
- **Wave 3 (merged CI/CD)** is a real dependency, not a coincidence: the
  Function ships through the same GitHub Actions → Cloudflare Pages deploy
  path (R-6.3) Wave 3 built, and R-7.8's new suite is gated as a
  post-deployment CI job the same way R-6.4's existing smoke suite is
  (amendment §3.2 AC5).
- **Wave 6 (merged perf/cross-browser audit)** is a downstream dependent,
  not an upstream one: R-7.8 AC4 requires R-5.2 AC1's Lighthouse budget to
  be *re-verified*, not assumed unaffected, once the Function is live — so
  Wave 6's numbers get a second pass after Wave 4-R1, they are not a
  precondition for it to start.
- **E14 (architecture approval) and E15 (trust-dependency acknowledgment)**
  gate the entire wave. Per CLAUDE.md, "architecture changes with
  significant impact" and disclosed trust-dependencies are owner-reserved,
  not routine implementation decisions.
- **E16 (conditional)** does not gate the wave's start — it is only live if
  a Cloudflare permission gap surfaces during deployment (amendment §4
  U19).
- **No dependency on Wave 5** (enquiry form / E4) or **E6** (copy) — this
  amendment touches only response headers and script authorization, never
  page content or the mailbox.

### 7.3 Execution grouping once approved (not started)

If/when E14 and E15 are resolved, this decomposes into three groups. None
may start before approval; they are recorded now so implementation does not
stall re-deriving sequencing after the fact.

**Group A (sequential, one engineer — must land first):**
`functions/_middleware.ts` (or equivalent) generating the per-response
nonce; deletion of the overlapping `Content-Security-Policy` /
`X-Content-Type-Options` / `Referrer-Policy` lines from `public/_headers`
per amendment §4 U15 (kept as one change, not two, because AC1f's
single-header guarantee is only meaningful once both halves move
together). This is the one piece everything else needs.

**Group B (parallel, once Group A merges — different files, safe
together):**
- R-7.8's new production-hostname Playwright suite (new spec file; touches
  `ci-cd.yml`'s post-deployment job only additively, per AC6 — does not
  modify the existing pre-merge suites).
- R-7.5 AC1e's fail-safe test (forcing a Function error in a
  non-production deployment) — a distinct test target from AC1a–d/AC1f, no
  file overlap with R-7.8's spec.

**Group C (after Group A+B pass in a real deployment):** R-7.8 AC4's
Lighthouse re-verification against the post-Function production hostname,
compared to the PERF-001 baseline. Sequenced last because it needs the
Function actually live and stable, not synthetic.

### 7.4 Contention risks

- **`public/_headers`** — the one file both the original Wave 4 R-7.5 work
  and this amendment's Group A touch. No other workstream should edit it
  concurrently; U15's resolution (delete the overlapping lines, don't leave
  two sources) is why this must land as a single coordinated change, not
  two independent edits racing each other.
- **`ci-cd.yml`'s post-deployment job** — shared with R-6.4's existing
  smoke suite. R-7.8 AC6 requires the new suite be additive; whoever
  implements Group B should pull the current file state immediately before
  editing, not a cached copy, given this program's demonstrated pattern of
  stale-branch edits colliding (see PR #4/#5's own merge-order notes).
- **No mailbox, no auth-artifact contention** — this amendment touches
  CSP/response headers and CI only; it shares no state with Wave 5
  (enquiry form) or any credential used elsewhere.
- **No content-collection contention** — no page markup changes.

### 7.5 Exit criteria for Wave 4-R1 (once approved and implemented)

- R-7.5 AC1a–AC1f pass against a real deployed Pages environment (nonce
  per-response and unguessable, no `'unsafe-inline'` ever including on the
  fail-safe path, `/cdn-cgi/challenge-platform/` under `'self'`, exactly
  one CSP header, defined fail-safe verified by deliberately forcing a
  Function error).
- R-7.5 AC2 passes against the real production hostname specifically
  (R-7.8 AC1), not `pages.dev` or local build output.
- R-7.8 AC1–AC6 all pass in CI as a post-deployment gate.
- R-5.2 AC1's Lighthouse budget is re-verified against the post-Function
  production hostname and compared to the PERF-001 baseline, with any
  regression reported, not silently absorbed.
- R-5.2 AC2's recorded evidence reflects the production-hostname figure
  (~938 bytes, still inside the 50KB budget), per amendment §3.3.
- No new blocker (E16) triggered by a Cloudflare permission gap; if
  triggered, it is escalated, not resolved by broadening a token's scope
  unilaterally.

### 7.6 Blockers and what proceeds regardless

| Blocker | Impact radius | What proceeds regardless |
|---|---|---|
| E14 not yet approved (architecture change: Pages Function as new request-time code) | Blocks all of Wave 4-R1 (Groups A/B/C) | Every other wave already in flight — Wave 5 (E4-gated), E6 copy work, QA-002 Probe 4 / QA-003 Finding 1 (BA items), any unrelated Wave 7 prep |
| E15 not yet acknowledged (disclosed trust-dependency on Cloudflare's injection scope) | Nothing blocked today per the amendment's own text (owner already chose Option B's direction) — recorded so it is not discovered later, not because anything waits on it | Everything |
| E16 (conditional — Cloudflare permission gap) | Not yet triggered; would block only the Function's actual deployment step if it fires | Everything else in Wave 4-R1 not yet at the deploy step |
| QA-005 Finding 1 itself, unresolved until E14/E15 clear | Production continues to show the known, disclosed CSP console error (R-7.5 AC2/R-5.3 AC1) — a known, already-diagnosed condition, not a new incident, and does not regress availability, security below today's baseline, or any other requirement | Everything not dependent on the CSP mechanism |

No wave elsewhere in this plan is affected by REQ-001-A2 being blocked. Per
CLAUDE.md's failure/blocker policy, this document does not recommend
halting any other workstream because this one is owner-gated.
