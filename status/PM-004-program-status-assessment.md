# PM-004 — Program Status Assessment (Update)

Author: Project Manager
Date: 2026-09-16 — live-verified against the GitHub REST API (via MCP
tools) against `haroonie-ai-ops/public-site`. Local `main` in this working
copy (HEAD `fbc01a8`) remains significantly behind `origin/main`'s actual
tip (`a0307b16`, 2026-09-15T20:29:48Z) and was **not** used as a source for
any fact about the deployed system's real state below — see Section 6.
`git fetch`/`git push` fail from this sandbox with a credential prompt
(confirmed again this session, consistent with every prior PM assessment);
the GitHub API is the only working channel here.

**This document supersedes `status/PM-003-program-status-assessment.md`**
for anything it addresses; PM-003's own findings (Section 2 below) are
otherwise unchanged and not restated in full.

**Scope of this update:** a new requirements amendment
(`requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md`, DRAFT)
has arrived since PM-003. This document sequences it, records its
escalations, and reconciles this repository's planning/status artefacts
against `origin/main`'s real current state — it does not re-litigate
PM-003's other findings, none of which this amendment touches.

---

## 0. Headline

1. **QA-005 found a real production regression in already-shipped work.**
   R-7.5 (security headers, PR #4) and Wave 6 (perf/cross-browser, PR #5)
   both merged clean and green on 2026-09-15. The same day, QA-005 found
   R-7.5 AC2 and R-5.3 AC1 **failing against `https://www.haroonie.ai/`** in
   all three engines, on all six routes — Cloudflare's Bot Fight Mode /
   JavaScript Detections injects an inline bootstrap script the static CSP
   correctly blocks. Neither PR's test suites ever exercised the real
   proxied hostname (QA-005 Finding 2, also High) — build output and
   `pages.dev` were the only targets that existed, so five green CI runs
   and a full Wave 6 audit never had a chance to see it.
2. **The owner chose the fix direction, first-hand:** *"proceed with option
   B then hand off to @project-manager"* — a Cloudflare Pages Function
   minting a per-request CSP nonce (rejecting `'unsafe-inline'` and
   disabling Bot Fight Mode, both weakenings QA-005 explicitly ruled out).
   The Business Analyst drafted the amendment implementing that direction.
   **The direction is chosen; the amendment's specific ACs, disclosed
   trust-dependency, and fail-safe/drift rules are not yet approved.**
3. **This is a revision to already-shipped scope, not new greenfield
   work.** R-7.5 was previously tracked as Wave 4 work; Wave 4's DNS/TLS/
   redirect/header scope is in fact done (merged 2026-09-15, along with
   REQ-001-A1's fold into REQ-001 proper and E11/E12/E13's resolution — see
   Section 6). REQ-001-A2 patches R-7.5 and adds R-7.8; it does not restart
   Wave 4. Tracked as **Wave 4-R1** in `planning/PLAN-001-execution-waves.md`
   §7 (new section, this session).
4. **Three new escalations recorded, E14–E16**, continuing
   `status/STATUS.md`'s own E-series from E13 — not REQ-001 §6's separate,
   already-resolved local E7/E8 pair. E14 (architecture approval) and E15
   (trust-dependency acknowledgment) block all of Wave 4-R1's
   implementation. E16 is conditional and not yet triggered.
5. **Nothing else in the program is blocked by this.** Per CLAUDE.md's
   instruction to keep unrelated work moving, Section 4 below lists exactly
   what remains fully executable while E14/E15 stand open.

---

## 1. What REQ-001-A2 actually asks for, and what it does not

Full detail: `requirements/REQ-001-A2-csp-nonce-pages-function-amendment.md`
(read in full for this assessment). Summarized here only to the depth a
sequencing decision needs — the amendment's own §0/§2/§8 are the
authoritative statement of its content and reasoning, and this document
does not restate or re-derive its acceptance criteria.

- **New architecture element:** a Cloudflare Pages Function
  (`functions/_middleware.ts` or equivalent) generating a per-response CSP
  nonce. First server-side, request-time code this site has ever run —
  correctly flagged by the amendment as a CLAUDE.md-reserved architecture
  decision (E14), not a routine implementation choice.
- **CSP's authoritative source moves** from the static `public/_headers`
  file to that Function's output, for `Content-Security-Policy` and (per
  the amendment's drift guard, §4 U15) `X-Content-Type-Options` and
  `Referrer-Policy` too, to avoid two sources of truth.
- **Six new ACs on R-7.5** (AC1a–AC1f): per-response/unguessable nonce
  (128-bit CSPRNG), no `'unsafe-inline'` ever, `/cdn-cgi/challenge-platform/`
  under `'self'`, a defined fail-safe (degrade strictness, never
  availability, never zero-CSP) if the Function errors, and a
  single-header guard against double-emission.
- **New requirement R-7.8**: a production-hostname smoke suite (CSP
  violations, console errors, security headers, JS transfer size),
  closing QA-005 Finding 2 and R-7.5 AC1's pre-existing deploy-time
  coverage gap.
- **R-5.2 AC2's recorded evidence corrected** (not its threshold): ~938
  bytes measured on the production hostname, still inside the 50KB
  budget.
- **A disclosed trust-dependency (E15):** the amendment's own honest
  conclusion, after examining two threat models separately, is that this
  is not a weakening of the CSP's defense against attacker-injected
  script (arguably stronger, and no test assertion is loosened — R-8.3
  AC1's gate is not triggered), but it does create a new, narrow reliance
  on Cloudflare's own restraint about what it injects under the site's
  nonce. The owner is asked to accept this knowingly.

**What it is not:** it does not touch page content, the enquiry mailbox,
DNS, or any credential scope beyond a conditional check (E16). It does not
expand MVP scope — no new page or feature.

---

## 2. Sequencing decision — Wave 4-R1, not a new wave

**Why a revision, not a new wave number:** PLAN-001 originally scoped
R-7.5 inside Wave 4 (domain/hosting) with "zero Cloudflare dependency."
That framing is now historical — Wave 4's actual scope (R-7.1–R-7.4, R-7.6,
and R-7.5 as a static file) is merged and, per origin/main, largely closed
in practice. QA-005 Finding 1 is a defect discovered in that already-
shipped work, not a gap in unstarted scope. Treating this as "Wave 4
continues" or "new Wave 8" would either understate that Wave 4's original
scope is done, or overstate this as unrelated greenfield work it is not.
"Wave 4-R1" (a revision, tracked against Wave 4/Wave 6's existing ACs) is
the accurate label — full reasoning, dependency graph, execution grouping,
contention risks and exit criteria are now recorded in
`planning/PLAN-001-execution-waves.md` §7 (added this session) rather than
duplicated here.

**Dependency summary** (full graph in PLAN-001 §7.2):
- **Depends on** Wave 3 (CI/CD — the Function ships through the same
  deploy path, and R-7.8's suite is a post-deployment CI job) and Wave 4's
  existing Pages project/zone (already live).
- **Feeds into** Wave 6 (R-7.8 AC4 requires the Lighthouse budget to be
  re-verified post-Function, not assumed unaffected — PERF-001's baseline
  is not reopened, it gets a second, comparative pass).
- **No dependency** on Wave 5 (enquiry form/E4) or E6 (copy) — this
  amendment is scoped entirely to response headers and CI.
- **Hard-gated** on E14 + E15 (owner). Nothing in Wave 4-R1's three
  execution groups (Group A: the Function + `_headers` cleanup; Group B:
  R-7.8's suite + the fail-safe test; Group C: the Lighthouse
  re-verification) may start before both are resolved.

**Contention risks** (full detail PLAN-001 §7.4): `public/_headers` (must
be edited as one coordinated change with the Function, not two racing
edits — this is the direct reason U15 recommends deleting the overlapping
lines rather than leaving both live); `ci-cd.yml`'s post-deployment job
(shared with R-6.4's existing smoke suite, must stay additive per AC6). No
mailbox, credential, or content-collection contention anywhere in this
amendment.

---

## 3. Escalations — E14, E15, E16 (recorded in `status/STATUS.md`)

Continuing `status/STATUS.md`'s own escalation series from its highest
prior number, **E13** (`status/E13-zone-token-write-grants.md`), per the
amendment's own §5 instruction. **Not** the same series as REQ-001 §6's
separate, already-resolved local E7/E8 pair — that collision between the
two numbering schemes is pre-existing (flagged by PR #6's merge commit on
`origin/main`, not introduced here) and is noted again in `status/
STATUS.md` so a future reader does not conflate them.

| # | Item | Blocks | Status |
|---|---|---|---|
| E14 | Owner must approve the architecture change: a Cloudflare Pages Function as this site's first server-side, request-time execution component, moving R-7.5's CSP off `public/_headers` onto its output. | All of Wave 4-R1 (R-7.5 AC1a–AC1f, R-7.8) | **Open** |
| E15 | Owner must accept, as a disclosed consequence of E14, the trust-dependency in amendment §2: a nonce-based CSP delegates to Cloudflare's edge which inline script is authorized on every response, for as long as JS Detections/Bot Fight Mode is enabled, and this program cannot inspect or constrain that content pre-execution. Not a weakening of the CSP's defense against attacker-injected script — a new, narrow reliance. | Nothing today (direction already chosen); recorded for disclosure | **Open** |
| E16 | Conditional: if deploying the Function requires a Cloudflare permission grant beyond CI's existing scoped token (R-6.6), that is a credentials/access escalation under CLAUDE.md — stop for owner action, do not widen the token's scope unilaterally. | Nothing yet; only the Function's deploy step if triggered | **Not yet triggered** |

Full write-up: `status/STATUS.md`, "E14–E16 — REQ-001-A2" section (added
this session).

---

## 4. What remains fully executable while E14/E15 stand open

Per CLAUDE.md's instruction to continue other work rather than halt the
program when one workstream is blocked:

- **Wave 5** (enquiry form) — blocked only on E4, untouched by this
  amendment.
- **E6** (remaining real copy: services, bio, legal entity/address) —
  blocks production sign-off on specific pages, unrelated to CSP.
- **QA-002 Probe 4** and **QA-003 Finding 1** — cheap, aging Business
  Analyst decisions (404 description copy-vs-placeholder; "lint" AC
  wording), carried forward from PM-003, still open, still unrelated.
- **E1/E10/E11's remaining threads** (Cloudflare access-scope
  verification) — orthogonal to the CSP mechanism; not reopened or
  affected by this amendment.
- **Any Wave 7 preparation** not dependent on R-7.5/R-7.8 (e.g., R-8
  traceability-matrix work for already-closed waves).

**The one thing that does not proceed:** implementation of REQ-001-A2's
own ACs (the Function, `public/_headers` changes, R-7.8's suite). That is
precisely, and only, what E14/E15 gate. Production continues to show the
known, already-diagnosed CSP console error (QA-005 Finding 1) in the
interim — a disclosed, unchanged condition, not a new or worsening
incident, and not a regression in availability or in security below
today's baseline.

---

## 5. What could be prepared without crossing into implementation — and what could not

The task framing asked this explicitly: nothing here authorizes an
Engineer to start Group A/B/C work (PLAN-001 §7.3) before E14/E15 clear —
that would be implementing an unapproved architecture change and unapproved
ACs, both owner-reserved under CLAUDE.md. What is legitimately preparable
without crossing that line is documentation/sequencing work of the kind
this assessment and PLAN-001 §7 already are: dependency and contention
analysis, exit-criteria definition, and status-ledger updates. Drafting the
Function code itself, editing `public/_headers`, or writing R-7.8's
Playwright suite ahead of approval would not be "preparation" — it would be
implementation of specifically the thing pending approval, and is not
recommended or authorized by this document.

---

## 6. Reconciliation note — this repository's local/origin divergence

Consistent with every prior PM assessment's finding (PM-002 §7, PM-003 §7):
this working copy's local `main` (`fbc01a8`) is materially behind
`origin/main`'s real tip (`a0307b16`). Verified this session via the GitHub
API rather than local git:

- `origin/main` already has R-7.1–R-7.4/R-7.6 (Wave 4 DNS/TLS/redirect),
  R-7.5 as a static `_headers` file (PR #4), the Wave 6 perf/cross-browser
  audit (PR #5), and REQ-001-A1 folded into REQ-001 proper with E11/E12/E13
  resolved (PR #6) — all merged 2026-09-15, all absent from this local
  checkout.
- `origin/main` is now a **protected branch** (a required-status-check
  ruleset, per E8's resolution) — direct pushes, including from this
  session's API access, are not a substitute for a reviewed PR going
  forward, unlike earlier PM assessments' direct-to-`origin/main` API
  publishes, which predate that protection taking effect.
- Locally-drafted amendments (`requirements/REQ-001-A1-...md` and
  `requirements/REQ-001-A2-...md`), `status/QA-005-...md`, and
  `status/E13-...md` exist only in this local checkout and are not yet
  visible on GitHub. REQ-001-A1's local draft is superseded by the
  already-approved, already-folded version on `origin/main` — no action
  needed on it. REQ-001-A2, QA-005, and E13 are the amendment this
  assessment sequences and are not yet visible for owner review on GitHub.
- `status/STATUS.md` and `planning/PLAN-001-execution-waves.md` in this
  local checkout have been reconciled to `origin/main`'s current content
  plus this session's new additions (E14–E16, PLAN-001 §7), specifically so
  this update does not silently discard the six 2026-09-15 corrections
  already on `origin/main` (git-auth root cause, E1/E10/E11, the Wave 2b
  404 accessibility gap, the local-history duplication finding) the way an
  edit against the stale local copy would have.
- **Recommendation, carried forward from PM-002/PM-003, now with an added
  branch-protection wrinkle:** a session with working git credentials (or
  the owner) should open a documentation PR carrying REQ-001-A2, QA-005,
  E13, and this session's STATUS.md/PLAN-001 updates to `origin/main`, so
  the amendment is actually visible for the owner's E14/E15 decision rather
  than trapped in a local checkout. This Project Manager role does not
  merge to `main` unilaterally — every prior merge in this program's
  history required a first-hand owner instruction, and this update is no
  exception.

---

## 7. Recommended next actions, in priority order

1. **Owner: decide E14 and E15** (`requirements/REQ-001-A2-...md` §0, §8).
   This is the only decision blocking a known, disclosed production defect
   (QA-005 Finding 1) from being fixed.
2. **Get REQ-001-A2, QA-005, and E13 onto `origin/main`** (a PR, given
   branch protection) so the owner's decision in (1) has something visible
   on GitHub to act on, not just a local file.
3. Everything in Section 4 continues in parallel — none of it is gated by
   (1) or (2).
4. Once E14/E15 clear: implement in the order PLAN-001 §7.3 lays out
   (Group A, then B, then C) — an Engineer task, not this document's.
