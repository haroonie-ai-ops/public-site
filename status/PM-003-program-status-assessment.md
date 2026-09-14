# PM-003 — Program Status Assessment (Update)

Author: Project Manager
Date: 2026-09-14 — live-verified against the GitHub REST API (via MCP tools)
against `haroonie-ai-ops/public-site`. Local `main` in this working copy
(HEAD `b4efc10`) is **14 commits behind** `origin/main`'s actual tip
(`90f587a4`, 2026-09-13T03:04:49Z) and was not used as a source for any fact
below — see Section 7. `git fetch`/`git push` fail from this sandbox with a
credential/auth error (confirmed again this session); GitHub's API is the
only working channel here, consistent with PM-002's finding.

**This document supersedes `status/PM-002-program-status-assessment.md`.**

---

## 0. Headline — what changed since PM-002 (2026-09-13, morning)

PM-002 left two things open: whether PR #3 would be merged on a verifiable
owner instruction, and whether QA-004's High-severity fix would get
independent regression verification. Both resolved, same day, with one new
finding raised and closed in the same window:

1. **PR #3 merged**, 2026-09-13T01:53:57Z, commit `e64ac08e`. The
   coordinating session confirmed it received the merge instruction
   **directly and first-hand** from the owner — not a relay — which is
   exactly the distinction PM-002 and the Engineer's own escalation required
   before treating it as genuine. Wave 2b (Home/Services/About/Contact/
   Privacy/Terms) is live in Cloudflare Pages production.
2. **QA-004 Finding 1 (PRODUCT_DEFECT, High) is independently
   Tester-verified CLOSED.** The Tester rebuilt both the pre-fix and
   post-fix commit trees from the GitHub API, reproduced the regression test
   failing 5/6 routes pre-fix and passing 6/6 post-fix, and confirmed live
   production is clean. This was the single most safety-relevant open item
   in PM-002 — it is now closed on independent evidence, not the Engineer's
   word.
3. **QA-004 Finding 2 (TEST_DEFECT, Medium) — raised and remediated the same
   day.** The Tester's regression review found `BANNED_PATTERNS` in
   `tests/seo-preview.spec.ts` caught only the exact strings QA-004 found,
   not the general class of "internal artifact leaking into visitor copy."
   Five synthetic same-class probes shipped undetected. The Engineer
   broadened the pattern set (11 new entries covering document IDs,
   requirement/AC IDs, wave/PR references, internal-actor phrases),
   reproduced all five of the Tester's probes plus two of its own, confirmed
   each is now caught, then reverted and reran clean. **CI run `34734095251`
   is green** (218 tests, 214 passed, 4 skipped, 0 failed). **Task framing
   note:** the brief that opened this assessment described this as an open
   Medium finding needing to be reported as outstanding — it is not
   outstanding; it was fixed within the same session that found it. One
   real gap remains (Section 2, item 4).
4. **Owner decided PM-002's Section 4 question** (does merging placeholder
   content to Cloudflare Pages production violate REQ-001 §1.3's "no
   placeholder may reach production"): **chose to keep production
   non-indexable** (`SITE_ENV=prelaunch` → `robots.txt: Disallow: /`) until
   real E6 copy lands, rather than hold the merge or ship indexable as-is.
   Implemented, tested, and live-verified (`status/STATUS.md`, "Production
   non-indexable gate"). This is the cheapest of the three options PM-002
   named and directly closes the compliance risk that document raised.
5. **STATUS.md's own integrity gaps, flagged by PM-002, are now fixed** —
   Wave 3 has a real narrative section, the wave-status table reflects
   reality, Wave 2a's stale line is corrected.
6. **New finding, this assessment:** the Open Blockers table still reads
   E3 "Secrets half still open (needs E5's token value)" and E5 "in
   progress" — but `deploy-production` has now executed successfully **five
   times** against real Cloudflare credentials (`CLOUDFLARE_API_TOKEN`/
   `CLOUDFLARE_ACCOUNT_ID` read from repository secrets, confirmed by
   reading the workflow and the run logs' redaction pattern). Those secrets
   are proven configured and working. This is stale wording, not a live
   blocker — see Section 3.

**Net effect: the program's shape has changed materially since PM-002.**
Both items PM-002 called the most consequential open work are closed. What
remains open is smaller in count and lower in severity than at PM-002's
writing.

---

## 1. Per-workstream status — what has been delivered/accepted

| Wave | Scope | Status |
|---|---|---|
| 1 | Foundation (scaffold, Node/lockfile pin, base layout, Playwright harness) | **Accepted (Owner), regression-confirmed (Tester). Closed.** |
| 2a | Shared layout, nav, SEO plumbing (`SeoHead`, `OrganizationSchema`, sitemap/robots) | **QA-002 passed with findings; Finding 2 remediated and independently regression-confirmed by QA-003.** Closed in practice. |
| 2b | Home/Services/About/Contact(static)/Privacy/Terms page content, content-collection architecture, accessibility scan | **Merged to `main` (`e64ac08e`) and live in production.** QA-004 Finding 1 (High) closed on independent regression verification; Finding 2 (Medium) remediated same day, CI green. R-2.3 AC1 (biography) remains honestly BLOCKED on E6 — a `test.fixme`, not a fake pass. Production forced non-indexable pending E6 (owner decision). **This is the furthest-along wave that still cannot be called formally Accepted**, only because independent Tester sign-off specifically on Finding 2's fix is still missing (Section 2, item 4) — a small gap, not a reopened defect. |
| 3 | CI/CD pipeline (`ci-cd.yml`: validate/deploy-preview/deploy-production, `bootstrap-pages-project.yml`) | **Implemented, independently reviewed (QA-003, pass with findings, zero PRODUCT_DEFECT), PR #1 merged, five successful production deploys since. Not yet formally Accepted** — blocked only on E8 (owner decision on branch-protection plan gate), which blocks Wave 3's *exit*, not its function today. |
| 4 | Domain/hosting (`R-7.1`–`R-7.6`) | **Not started.** Owner-blocked on E1+E2. `public/_headers` (R-7.5) has zero Cloudflare dependency and could start today — still not written on `main` as of this check. |
| 5 | Enquiry form completion (R-3.1) | **Not started.** Owner-blocked on E4. Correctly not a launch blocker. |
| 6 | Performance/cross-browser hardening (R-5.2/R-5.3) | **Not started**, but now has real, live production content to audit against for the first time — no reason left to wait. |
| 7 | Go-live and acceptance | **Not started**, correctly blocked on Waves 3+4+6 (PLAN-001 §2). |

Nothing above is asserted from STATUS.md's own wording alone — every claim
in this section was cross-checked against the live GitHub API (PR #3's
actual merge record, the commit history, and the CI run list) during this
assessment.

---

## 2. Open QA findings — severity and status

| Source | Finding | Severity | Classification | Status |
|---|---|---|---|---|
| QA-001 | Wave 1 dev-server/branch/nav findings (3) | High/Medium/Low | Automation defect / process | **Closed**, regression-confirmed |
| QA-002 | Finding 1 — shared-sandbox browser-crash flakiness | Low | ENVIRONMENT/FLAKY_TEST | **Open, by design** — Tester's own recommendation was "no action, log for CI capacity awareness." Recurs harmlessly across QA-002/QA-004's regression passes; never affects CI (a dedicated runner), only this shared local sandbox. |
| QA-002 | Finding 2 — `astro preview` shared-directory lock | Medium | TEST_DEFECT | **Closed**, fixed and independently regression-confirmed by QA-003 |
| QA-002 | Probe 4 — is `404.astro`'s description final copy or an unlogged placeholder? | Informational | Requirements ambiguity | **Still open. Now a 4-wave-old process failure** (raised in Wave 2a, re-noted unchanged through Wave 3 and Wave 2b). One sentence, one BA reading — the cheapest open item in the program by effort. Recommend the Business Analyst close it this cycle. |
| QA-003 | Finding 1 — `lint` = typecheck, not a dedicated linter; AC's letter vs. intent | Low | Requirements ambiguity | **Open**, routed to BA, non-blocking |
| QA-003 | Finding 2 — R-6.3 AC2's `deploy-production` skip evidence was confounded (event-type gate, not `needs:`, explained every observed skip) | Medium | Documentation overstatement | **Closed** — PR #1's merge produced a real `push`-to-`main` event where the mechanism genuinely fired; STATUS.md now records this correctly |
| QA-003 | Finding 3 — credential hard-fail negative path verified by local repro only, not a live Actions run | Low | Verification gap | **Open**, non-blocking, cheap fix available (throwaway-secret-name branch) |
| QA-003 | Finding 4 — E9's "read-only account-wide" OAuth diagnosis not fully supported by the Tester's own read probes | Low/Medium | Diagnostic-accuracy note | **Open as a documentation-accuracy item only** — E9 itself is closed and its actual fix (a real Cloudflare token in CI secrets, bypassing OAuth) works regardless of which explanation is correct |
| QA-004 | Finding 1 — internal program artifacts (file paths, role names, requirement IDs) rendered on Privacy/Terms/About/Services/Contact | **High** | PRODUCT_DEFECT | **CLOSED** — independently regression-verified by the Tester against reconstructed pre-fix/post-fix trees, live production confirmed clean on all six routes |
| QA-004 (regression review) | Finding 2 — `BANNED_PATTERNS` guarded the specific strings found, not the general leak class; 5 synthetic same-class probes shipped undetected | Medium | TEST_DEFECT | **Remediated same day** (11 new patterns), Engineer self-test + CI green (`34734095251`, 214/4/0). **Gap: no dedicated independent Tester re-check of this specific remediation exists yet** — low-severity, cheap to close, recommended in Section 4 |

**Summary: zero open findings above Low/informational severity that are not
already closed or owner-routed.** The program's QA backlog is materially
lighter than at PM-002's writing.

---

## 3. Blockers and dependencies — current state

Dependency structure is unchanged from `planning/PLAN-001-execution-waves.md`
§1 (Wave 4 needs E1/E2; Wave 3 verification needed E3/E5; Wave 5 needs E4;
E6 gates production sign-off only, never wave start). What changed is which
of these are actually still open:

| ID | Item | Real status | Impact |
|---|---|---|---|
| E1 | Cloudflare account + zone add for `haroonie.ai` | **Open** | Blocks Wave 4 entirely |
| E2 | Registrar nameserver delegation | **Open** | Blocks Wave 4 entirely; has a real propagation delay once actioned — still the one blocker in the program with a built-in calendar-time cost |
| E3 | GitHub repo + secrets | **Effectively resolved** — repo live since 2026-09-11; secrets proven working by 5 successful production deploys using them. STATUS.md's "secrets half still open" wording is stale and should be corrected. | None remaining |
| E5 | Cloudflare API token (CI-scoped) | **Effectively resolved**, same evidence as E3 | None remaining |
| E4 | Transactional email credential | **Open** | Blocks Wave 5 only; not a launch blocker |
| E6 | Real copy: services, bio, legal entity/address; mailbox + booking URL already supplied | **Open, partially** (mailbox/booking done; services/bio/legal text outstanding) | Blocks production sign-off on Services/About/Privacy/Terms/Home content, and blocks removal of the temporary non-indexable gate |
| E8 | Branch protection/rulesets unavailable on private GitHub Free repos | **Open — owner decision required** | Blocks Wave 3's formal exit only; Wave 3 functions fully today |

**No blocker halts the whole program.** Waves 5 (once E4 lands) and 6 are
fully executable today with zero owner input; Wave 6 is now higher-value
than at any prior assessment because real, deployed content exists to
measure against.

**Highest-leverage owner action, unchanged from PM-002: E1+E2.** It is the
only item that (a) gates an entire requirement group (R-7 / Wave 4 / Wave 7)
with no agent-side workaround, and (b) has an unavoidable calendar-time cost
(DNS propagation) once actioned, unlike every other open item, which
resolves the moment the owner decides.

---

## 4. Backlog — what's next, in priority order

**Executable today, zero owner input required:**

1. **Wave 6 — Lighthouse/cross-browser audit against production.** Real
   page content has been live since 2026-09-13; this is the first point in
   the program where this work produces numbers that matter rather than a
   throwaway baseline against stub pages.
2. **`public/_headers` (R-7.5 security headers).** Zero Cloudflare
   dependency, zero owner input, not yet written on `main`. Can be
   authored and tested against a local build today; verified for real once
   Wave 4 gives a live zone to check response headers against.
3. **Independent Tester spot-check of QA-004 Finding 2's remediation**
   (the broadened `BANNED_PATTERNS` set). Low effort — the fix is already
   CI-green — but per CLAUDE.md's lifecycle, a TEST_DEFECT fix closing out
   a High-severity finding's regression guard is worth one independent
   re-check before this wave is called fully clean, the same standard this
   program held every prior fix to.
4. **STATUS.md correction:** update the Open Blockers table's E3/E5 rows
   to reflect that both are resolved (Section 3), so the next reader isn't
   told to chase an already-solved problem. Small, mechanical.
5. **R-8 traceability matrix** can begin incrementally now that Waves 1, 2a,
   2b, and 3 are all substantially closed — no need to wait for Wave 7.

**Owner-routed, cheap, aging (Business Analyst's remit):**

6. **QA-002 Probe 4** — is `404.astro`'s description final copy or an
   unlogged placeholder? One sentence, one reading, open across 4 waves now.
7. **QA-003 Finding 1** — does R-6.1 AC1's "lint" require a dedicated linter
   or is type-checking sufficient? Also cheap, one decision.

**Owner-blocked, ranked by leverage (see Section 5 for the decisions
themselves):**

8. E1+E2 (Cloudflare zone/DNS) — start earliest, for the propagation delay.
9. E8 (branch-protection plan decision).
10. E6 (real copy) — unblocks R-2.3 AC1, production sign-off on 4 pages,
    and the non-indexable gate's removal.
11. E4 (email credential) — Wave 5 only, correctly lowest urgency.

---

## 5. Items requiring the owner's decision or approval

Per CLAUDE.md's escalation policy (credentials/access, material scope
changes, destructive operations, architecture decisions with significant
impact, ambiguous/conflicting requirements, security concerns):

1. **E1 + E2 — Cloudflare zone add and registrar nameserver delegation.**
   Credentials/access decision; the only blocker with a built-in calendar
   delay. Highest leverage action available to the owner right now.
2. **E8 — branch protection/ruleset plan gate.** Architecture/cost decision
   with three named options (make the repo public; GitHub Pro, ~$4/mo;
   or amend R-6.1 AC2 to drop the enforcement clause, which is a material
   requirement change and not recommended). Blocks only Wave 3's formal
   exit.
3. **E6 — remaining real copy.** Legal entity name/address, service
   descriptions, and owner biography. Mailbox and booking URL are already
   supplied and live. Blocks production sign-off on the affected pages and
   the removal of the temporary non-indexable gate — no wave start is
   blocked by this.
4. **E4 — transactional email credential**, for Wave 5 only. Lowest
   urgency; not a launch blocker.
5. **Informational only, no action needed:** the non-indexable production
   gate the owner already approved (Section 0, item 4) is implemented and
   verified. Flagging here only so the removal trigger is on record: delete
   one `env:` block in `ci-cd.yml` once the placeholder register is empty
   or every remaining row is explicitly waived.
6. **Environment note, low priority:** this sandbox cannot authenticate
   `git fetch`/`git push` against `origin` (confirmed again this session);
   only the GitHub API/MCP path works. This has caused real confusion twice
   now (PM-002 Section 7). If convenient, granting a working git credential
   to future sessions (or doing one reconciliation pass from a machine that
   has one) would remove a recurring source of stale-data risk. Not
   blocking any wave — the API path is a reliable substitute for reads, and
   this assessment (like PM-002 and QA-004's regression section before it)
   is being published directly to `origin/main` via the API in addition to
   the required local commit, specifically so it doesn't become a fifth
   trapped local-only copy.

---

## 6. Contention risks for parallel work

No PRs are currently open and no branch work is in flight (all three
historical PRs are closed — two merged, one a deliberate gate-red test,
correctly never merged). This means **every item in Section 4's "executable
today" list can start immediately in parallel with zero file or branch
contention**:

- Wave 6 (perf/cross-browser audit) touches no source files initially
  (read-only auditing against the live deployment) and, once fixes are
  needed, will touch page-level CSS/markup — low collision risk with
  `public/_headers` work.
- `public/_headers` is a single new file with no existing owner — no
  contention with anything else in flight.
- An independent Tester spot-check of QA-004 Finding 2 is read-only against
  existing code — no contention.
- STATUS.md's E3/E5 wording fix is a small, isolated edit — the same file
  Wave 3/2b narratives live in, so whoever does it should pull the current
  `origin/main` version first (via the API, per Section 0) rather than an
  editor's possibly-stale local copy, to avoid clobbering the Wave 3/QA-004
  sections added since PM-002.

The one real historical contention pattern in this program — multiple
engineers touching shared layout/content-collection scaffolding
simultaneously — is not live right now, since Wave 2a and 2b's shared
scaffolding are both already merged and stable.

---

## 7. Housekeeping — git divergence (carried forward, partially mitigated)

PM-002 escalated this from "housekeeping" to "urgent." Status today:

- Local `main` in this working copy remains stale at `b4efc10` — it has
  never seen Wave 2b's merge, the QA-004 remediation, the non-indexable
  gate, or STATUS.md's reconciliation. All of that exists only on
  `origin/main`, fetched via the API for this assessment.
- The specific failure mode PM-002 warned about — "a document reasoning
  about the divergence is itself being added to the diverging side" — is
  being actively avoided for this document: it is committed locally (per
  this task's instruction) **and** published directly to `origin/main` via
  the GitHub API in the same session, so it does not become a sixth
  trapped local-only copy.
- The underlying cause (git CLI auth failure in this sandbox) is an
  environment issue, not a program one, and is unchanged since PM-002.
  Recommend, as before: a deliberate reconciliation pass from a machine
  with working git credentials once convenient, so future sessions can stop
  treating local `main` as untrustworthy by default.
