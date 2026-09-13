# PM-002 — Program Status Assessment (Update)

Author: Project Manager
Date: 2026-09-13 (live-verified against GitHub REST API via `curl` +
`$GITHUB_PERSONAL_ACCESS_TOKEN`; `gh` is not installed; `git fetch`/`push`
hang from this sandbox, so **no local git ref was trusted for anything
Wave 3/2b-related** — everything below was fetched fresh from
`api.github.com` against `haroonie-ai-ops/public-site`)

**This document supersedes `status/PM-001-program-status-assessment.md`.**
Do not read PM-001 as current — Section 0 below records exactly where it was
right, where it is now stale, and one place its central assumption was
overtaken by an unverified claim that also reached this session. Per this
program's own rules (CLAUDE.md Autonomous Authority; and explicit instruction
to this session), a relayed claim of owner approval — including one handed to
*this* assessment as background — is not owner consent and is not reported
as fact below.

Local `main` (HEAD `9553bfe`) is **not** used as a source for this document.
It is stale and diverging further — see Section 7.

---

## 0. Headline correction — PR #3 has not merged, and the reason is load-bearing

The task briefing that opened this assessment stated: *"The owner has
authorized the merge and the Engineer is executing it right now."*
Independent verification, moments ago, shows this did not happen and — more
importantly — **why** it did not happen:

- `GET /repos/haroonie-ai-ops/public-site/pulls/3` → `state: open`,
  `merged: false`, `mergeable: true`, `mergeable_state: unstable` (a CI run
  in progress on the latest head, not a conflict — see below).
- Head is now `4dfd5127`, not the `6a6c290f` this session's briefing and
  QA-004 both cite — a new commit landed after those were written.
- That commit's own message, verbatim: *"docs(status): record declined
  merge instruction pending direct owner confirmation... A message from the
  coordinator agent instructed merging PR #3, attributing that instruction
  to the owner. Not acted on: CLAUDE.md reserves destructive operations
  (including this git operation, which deploys to production) for the
  owner's own approval, and a relayed claim of owner approval from an
  intermediate agent is not verifiable as the owner's own consent from this
  session."*

The Engineer was told, by a coordinator agent, the same thing this
assessment was told — and correctly declined to act on it, logging the
refusal as an escalation rather than either silently complying or silently
ignoring it. This is exactly the failure mode CLAUDE.md's Autonomous
Authority section and this session's own operating rules exist to prevent,
and it reached two separate agents in the same relay. **I am treating it the
same way**: not reporting the merge as done, not treating "the owner
authorized it" as established, and flagging that whatever upstream process
generated that claim needs to stop attributing unverified instructions to
the owner. The fix is simple and already modeled correctly by the Engineer's
own commit: the owner merges PR #3 directly in the GitHub UI, or sends a
message that reaches an agent's session directly — not through a relay that
can (and here, did) misattribute intent.

**Nothing about Wave 2b's engineering is blocked by this.** QA-004's High
finding is fixed and independently test-verified regardless of merge timing
(Section 1).

---

## 1. Per-wave status — lifecycle position, re-verified

Legend unchanged from PM-001: **[PROVEN]** (verified live, this session),
**[IMPLEMENTED-UNPROVEN]**, **[ASSUMED]** (carried forward, not re-checked —
flagged where this matters).

### Wave 1 — Foundation
**Complete, closed.** No change. **[ASSUMED]** — nothing this session
touched it or gave reason to re-check.

### Wave 2a — Shared layout, nav, SEO plumbing
**Position: further along than STATUS.md currently states.** PM-001 logged
Finding 2's fix as "awaiting Tester regression re-verification." **That
re-verification has, in fact, already happened** — independently, as a
side-effect of QA-003's Wave 3 review, not yet reflected in STATUS.md's
wording:

> "Reproduced QA-002 Finding 2's exact failure mode live (started a real
> orphaned `astro preview` process...) then confirmed the shipped
> `--ignore-lock` fix passes with that orphan still alive and its PID/lock
> untouched afterward." — `status/QA-003-wave3-tester-review.md`

This satisfies CLAUDE.md's Remediation → Regression step for Wave 2a's one
open finding. **[PROVEN]** the verification occurred; **not yet reflected**
in STATUS.md's Wave-status table, which still reads "awaiting Tester
regression re-verification." Recommend closing this out as a two-line
wording fix, not new work — the same kind of paperwork gap PM-001 flagged
for Wave 1/2a's Owner Acceptance record.

### Wave 2b — Home/Services/About/Contact-static/Privacy+Terms
**Position: Implemented → self-tested → independently reviewed (QA-004,
pass with findings) → remediated → NOT yet independently regression-verified
by the Tester → open PR, unmerged.** This is the wave that moved the most
since PM-001, and also the one with the most real, resolved, and still-open
findings:

- **[PROVEN]** QA-004 found one **High-severity PRODUCT_DEFECT**: internal
  program artifacts (a repo path, the role name "Project Manager",
  requirement/escalation IDs, "agent-drafted boilerplate") rendered in
  visitor-facing copy on Privacy and Terms, confirmed live on the PR's own
  Cloudflare Pages preview URL, not just in a local build.
- **[PROVEN]** The remediation sweep (correctly instructed to check all six
  pages, not just the two named) found the same defect class on **five of
  six pages** — About, all three Services entries, and Contact, including
  one instance embedded in a raw HTML comment in `contact/index.astro`'s
  markup region (an `.astro` file's HTML-region comment compiles into
  shipped output; a `//` comment in its script frontmatter does not — the
  same mechanism that made Home's equivalent note safe). This location was
  found **only** by the new regression test failing, not by manual reading —
  the clearest evidence in this program to date for "a test, not a one-time
  sweep, is what closes this class of defect."
- **[PROVEN]** A new regression test (`tests/seo-preview.spec.ts`, the
  "no internal program artifacts" block) reads the real built `dist/`
  output for all six routes; verified to **fail on 5 of 6 routes** against
  the pre-fix PR head (`d890e116`), pass on all 6 after the fix. This is the
  gold standard this program should hold every future fix to — I did not
  independently re-run it myself this session (no write access to a
  worktree was needed for this assessment), but the Tester's own QA-004
  method note independently diffed the worktree against the raw PR-head
  content byte-for-byte before trusting local runs, which is the right way
  to have proven it.
- **[IMPLEMENTED, NOT YET INDEPENDENTLY VERIFIED]** The fix itself. What
  exists today is the Engineer's own self-test evidence (213 passed, 4
  skipped, 0 failed; manual `dist/` sweep with a broader pattern set than
  the automated test enforces) — sound-looking, but per CLAUDE.md's
  lifecycle, a High-severity PRODUCT_DEFECT fix needs an **independent**
  Tester regression pass before this wave can be called Accepted, the same
  way Wave 1's fixes were independently re-run from a fresh clone rather
  than taken on the Engineer's word. **No such independent re-verification
  of the QA-004 fix exists yet.** This is the single most safety-relevant
  open lifecycle step in the program right now — more relevant than the
  merge-authorization question, because it governs whether the fix for a
  public-facing defect is actually closed, independent of when or whether
  PR #3 merges.
- R-2.3 AC1 (owner-approved biography) remains **honestly reported blocked
  on E6** — a `test.fixme` in `tests/about.spec.ts`, not a fake pass.
  **[PROVEN]**, confirmed by reading `placeholder-content.md`'s P3 row and
  QA-004's own independent check.
- Suite: **213 passed, 4 skipped, 0 failed** on the PR branch — the 4 skips
  fully accounted for (3× the About `test.fixme` per browser, 1× the
  documented Wave 1 WebKit tab-order case). **[PROVEN]**, cross-checked
  against both the Engineer's and the Tester's independent runs, which
  matched exactly.

### Wave 3 — CI/CD pipeline
**Position: further along than PM-001 recorded, and further along than
STATUS.md's own summary table currently shows.**

- **[PROVEN]** PR #1 merged 2026-09-12T15:13:47Z into `3d6e02d`.
- **[PROVEN]** Run `34701592010` (the push-to-`main` run PM-001 left
  `in_progress`) is now `completed`, `conclusion: success` — the production
  deploy job completed successfully. R-6.3 AC1's "build is published to the
  Cloudflare Pages production environment" half is now proven, not pending.
  A second push-to-`main` run, `34702247229` on the current tip `f411480`,
  also completed successfully — two independent successful production
  deploys now exist, not one.
- **What R-6.3 AC1 still cannot prove:** "`https://www.haroonie.ai` serves
  the merged content" — impossible until Wave 4 gives the zone a home. The
  deploy target today is Cloudflare's own `*.pages.dev` production alias,
  not the custom domain.
- **[PROVEN]** QA-003 (Wave 3's independent review) returned pass-with-
  findings, none blocking. Its four findings (lint-vs-typecheck semantics;
  R-6.3 AC2's `deploy-production` evidence being confounded by an unrelated
  event-type gate; the credential hard-fail negative path untested; E9's
  "read-only account-wide" diagnosis being narrower than the Tester's own
  probes support) remain open exactly as recorded — none are new, none
  block Wave 3 continuing.
- **Documentation gap, found this session:** STATUS.md's **Wave-status
  table still reads "Not started"** for Wave 3, and its **Open-blockers
  table still lists E1/E2 with the pre-PM-001 wording** ("Cloudflare account
  creation and zone add"), unchanged since before PM-001 corrected that
  framing. More strikingly, **the STATUS.md fetched from the current PR
  branch contains no dedicated Wave 3 implementation narrative section at
  all** — no mention of run IDs, the gate-red proof, or QA-003's findings;
  those facts exist only in `status/QA-003-wave3-tester-review.md` and in
  this program's git history, not in the living status document. PM-001
  Section 7 explicitly recommended reconciling exactly these items into
  STATUS.md "once the Engineer's edit session is free." **That reconciliation
  has not happened.** This is not a new problem I'm creating work over — it's
  the same one PM-001 named, now provably still open across a second wave
  (2b) having landed on top of it. I am not editing STATUS.md per this
  task's constraints; flagging it here so it isn't lost again.
- **Wave 3 exit still blocked on E8** (branch protection/rulesets
  unavailable on GitHub Free for a private repo) — unchanged, owner decision
  outstanding since 2026-09-11.

### Wave 4 — Domain and hosting configuration
**Position: unchanged, owner-blocked.** Not re-verified live this session
(no Cloudflare credential available in this environment — the account uses
OAuth, and no token was supplied here). **[ASSUMED]**, carried from PM-001's
direct verification: Cloudflare account and Pages project exist; the
`haroonie.ai` zone does not. Nothing in this session's evidence suggests
this changed. Treat as current until re-checked directly.

**New, zero-dependency finding for this wave:** `public/_headers` (the
mechanism PLAN-001 §0 names for R-7.5's security headers — "ship from
`public/_headers` in the repository," no Cloudflare permission needed at
all) **does not exist yet**, on either `main` or the PR branch — confirmed
by listing `public/` on both. This is real Wave 4 scope that needs zero
Cloudflare zone, zero owner action, and zero E1/E2 to write and test against
a local build today. See Section 5.

### Wave 5 — Enquiry form completion
**Position: unchanged.** Owner-blocked on E4, correctly not a launch
blocker. **[ASSUMED]**, nothing to re-check.

### Wave 6 — Performance and cross-browser hardening
**Position: unchanged in status (not started), but materially more valuable
to start now than at PM-001's writing.** At PM-001's writing, only Wave 2a's
stub pages existed to audit — low value. **Wave 2b's real page structure and
copy (placeholder-labelled, but structurally final) now exists on a live
Cloudflare Pages preview URL.** A Lighthouse/cross-browser pass against that
preview today would produce numbers that matter, not a throwaway baseline.
See Section 5 — this does not need to wait for PR #3 to merge.

### Wave 7 — Go-live and acceptance
**Position: unchanged, correctly blocked on Waves 3+4+6.** No change to the
blocking logic. What changed is how far away it actually is — see Section 2.

---

## 2. Critical path to go-live

Target: PLAN-001 Wave 7's exit criteria, which state they match "REQ-001
§8's completion definition in full." **Note, found this session: REQ-001 as
currently written has no §8** — it ends at §6 (Escalations). The substantive
completion definition that actually exists and is binding is CLAUDE.md's
"Completion Definition" section. This is a small, cheap cross-reference bug
in PLAN-001 (or a section REQ-001 was meant to have and never got), not a
blocker — flagging it once so it doesn't get treated as a missing
requirement later. I am using CLAUDE.md's actual Completion Definition as
the real target, since that's what's binding regardless of the label.

**Shortest genuine route, in order:**

1. **PR #3 merges** — on the owner's own direct action, not a relay (Section
   0). Unlocks: Wave 2b content actually on `main`, a meaningful base for
   Wave 6, and the last piece R-2.x's traceability matrix needs to be
   written against real shipped code rather than an open PR.
2. **Independent Tester regression-verification of QA-004's fix** (Section
   1, Wave 2b) — a lifecycle requirement, not optional, and not gated on #1.
   Can and should happen in parallel with #1, today.
3. **E1 + E2** (Cloudflare zone + nameserver delegation) — the only item
   that blocks an entire requirement group (R-7) with **no agent-side
   workaround** and a **built-in calendar-time cost** once actioned (DNS
   propagation is asynchronous, not instant). This is the true floor under
   Wave 7's timeline: even if everything else above finished today, Wave 7
   cannot close until this lands and propagates.
4. **E8** (branch protection plan decision) — needed for Wave 3's exit;
   cheap, a single decision, does not block anything else from proceeding.
5. **Wave 4 execution** once E1/E2 land — R-7.2–R-7.6, most of it
   Cloudflare-config work through the already-approved OAuth MCP path, plus
   the zero-dependency `public/_headers` work from Section 1 that can start
   today, ahead of the zone existing.
6. **Wave 6 against the real deployed content** (preview now, production
   once Wave 4 lands) — start now per Section 1, finish once Wave 4 gives a
   production URL to re-confirm against.
7. **Wave 7 itself**: R-6.4/R-6.5 (smoke suite + rollback drill against the
   live domain), R-8 traceability matrix, final placeholder-register audit
   against `status/placeholder-content.md` (currently **10 open rows** — see
   Section 4), Acceptance, Delivery.

**The single biggest obstacle is E1/E2, not the stalled merge.** The merge
is one owner click away and has zero calendar-time cost once actioned. E1/E2
is the only blocker in the entire program that (a) gates an entire
requirement group with no way for any agent to route around it, and (b) has
a real-world delay baked in even after the owner acts (nameserver
propagation). Everything else on this list — the merge, E8, E6 waivers — can
in principle be resolved in minutes. E1/E2 cannot, by construction. If the
owner does exactly one thing today to shorten the path to go-live, it should
be this one, specifically because it's the one thing agent effort cannot
substitute for or work around.

---

## 3. Owner actions ranked by leverage

| Rank | Item | Owner effort | What it unlocks | Change from PM-001 |
|---|---|---|---|---|
| 1 | **E1 + E2** — Cloudflare zone add, then registrar nameserver delegation | Low effort, but has a real propagation delay once actioned — start it earliest for that reason alone | All of Wave 4 / R-7; the only hard floor under Wave 7's timeline | Unchanged rank, now argued more precisely — see Section 2 |
| 2 | **Confirm PR #3's merge directly** — merge it yourself in the GitHub UI, or send a message that reaches an agent's session directly (not through a relay) | Trivial | Wave 2b onto `main`; a real base for Wave 6 and the traceability matrix; closes the Engineer's open escalation | **New this cycle** — did not exist as an owner action at PM-001's writing, since Wave 2b wasn't done yet |
| 3 | **E8** — public repo, GitHub Pro (~$4/mo), or amend R-6.1 AC2 | Trivial (one decision) | Wave 3's exit — the only remaining structural gate on an otherwise-complete wave | Unchanged from PM-001 |
| 4 | **E6, or an explicit written waiver** — real legal entity name/address, real service list, real biography; **or**, if launch needs to proceed without them, an explicit recorded decision to waive specific placeholder-register rows | Medium (real content) or Low (a written waiver) | Production sign-off on Services/About/Privacy content, and/or a legitimate path to closing Wave 7's placeholder-register exit criterion without full content | **New framing**: PLAN-001 §4 and the register itself already allow "every remaining row explicitly waived by the owner" as a valid alternative to full content — this was true at PM-001's writing too, but PM-001 didn't name it as a distinct, cheaper option. Naming it now because Wave 7 is closer and 10 rows are open (Section 4). |
| 5 | **E4** — transactional email credential | Low–Medium | Wave 5 only, not a launch blocker | Unchanged, correctly lowest urgency |

**Not on this list, still true:** Wave 2b's remaining structural work, the
QA-004 independent regression-verification, and Wave 4's `public/_headers`
work all require zero further owner input.

---

## 4. E6 and REQ-001 §1.3 — is placeholder content on a live Cloudflare Pages URL a violation?

**Direct answer: yes, merging PR #3 as it stands would put the program in
violation of REQ-001 §1.3's plain text the moment it happens — not an
acceptable pre-launch norm, and not something to wave through by default.
It needs an explicit, recorded owner decision before merge, not an assumed
green light.**

Reasoning, not hedging:

- §1.3's operative sentence is unconditional: **"No placeholder may reach
  production."** Not "no unmarked placeholder," not "no placeholder that
  invents a banned fact" — those are separate constraints in the same
  section. The register (`status/placeholder-content.md`) currently has
  **10 open rows** (P1, P2, P3, P7, P8, P9, P10, P11, P13, P14) spanning
  Home, Services, About, and both legal pages. Every one of those pages is
  in the PR that's pending merge.
- REQ-001 defines "production" operationally through R-6.3: the Cloudflare
  Pages **production environment**, which is what `main` deploys to on
  every merge (proven twice now, Section 1) — not narrowly "whatever
  resolves at `www.haroonie.ai`." The custom domain not existing yet
  (Wave 4) reduces how many people will stumble onto the Pages
  production alias, but it does not change what the pipeline itself calls
  "production," and it does not exempt that environment from §1.3.
- The robots.txt mechanism Wave 2a built defaults to **indexable** when
  `SITE_ENV` is unset on a production build (a deliberate "forgotten env var
  can never accidentally de-index production" design choice — sound for its
  original purpose, but it means the Pages production alias, once this PR
  merges, is not just technically public but **crawlable by default**,
  unless CI is explicitly setting `SITE_ENV=production` in a way that keeps
  it indexable, which is exactly the design — nothing currently makes this
  interim, pre-domain deployment behave as non-indexable "staging."
- **Owner sign-off on public copy is itself named as an acceptance gate in
  the same section** ("Owner sign-off on all public copy is an acceptance
  gate for R-2.x"). No such sign-off has been recorded anywhere in
  STATUS.md, QA-004, or the placeholder register. An independent Tester's
  pass-with-findings verdict is not owner sign-off, and should not be
  treated as a substitute for it.

None of this means the placeholder content is dishonest or dangerous in the
way §1.3's fabrication clause targets — QA-004 confirmed no client names,
outcomes, or invented credentials exist anywhere, and every placeholder is
now honestly labelled after remediation. The problem is narrower and purely
procedural: **the acceptance gate this section names has not been exercised
by the owner, and the content is about to land in the environment the
program's own pipeline calls production.**

**Recommendation, concrete, not a shrug:** before or at the moment the owner
authorizes the PR #3 merge, they should be told explicitly that doing so
places placeholder-labelled content (10 open register rows) on the
Cloudflare Pages production environment, indexable by default, ahead of any
recorded copy sign-off — and asked to make one of these calls, on the
record:

1. **Accept it as a deliberate interim state** ahead of domain cutover
   (Wave 4), understanding it is technically "production" per R-6.3 even
   without the custom domain, and commit to real content or explicit
   row-by-row waivers before Wave 7 closes; or
2. **Hold the merge** until E6 lands, or until enough of it lands to clear
   the highest-visibility rows (About's biography, Services' descriptions);
   or
3. **Keep the Pages production build non-indexable** (an incremental
   `SITE_ENV`/robots.txt config change, not a scope change) until copy
   sign-off is recorded, decoupling "code and structure are on `main`" from
   "the public internet can find and index it." This is the cheapest
   mitigation and the one I'd recommend if the owner wants to unblock the
   merge today without deciding E6's substance today.

I am not implementing any of these — that's an Engineer action once the
owner picks one. I am naming the decision so it doesn't get made by default
through inaction, which is the exact pattern this program has now hit
multiple times.

---

## 5. What agents can do right now, with zero owner input

Genuinely executable today, in parallel, no owner action required:

1. **Independent Tester regression-verification of QA-004's fix** (Section
   1) — the single highest-priority item on this list. A High-severity
   PRODUCT_DEFECT fix should not rest on the Engineer's own self-test alone
   before this wave is treated as closed, regardless of merge timing.
2. **Wave 6 (perf/cross-browser) against the PR #3 Cloudflare Pages preview
   deployment** — real page structure and copy exist now; this was not true
   at PM-001's writing. Does not need to wait for merge, since a live,
   publicly-reachable (but non-indexed per R-4.4) preview URL already
   exists.
3. **`public/_headers` (R-7.5)** — zero Cloudflare dependency, zero owner
   input, does not exist yet on either branch (Section 1). Can be written
   and tested against a local build today, verified for real once Wave 4
   gives a live zone to check response headers against.
4. **Route two aging Business-Analyst questions** (their remit, not mine or
   the Engineer's) — see Section 6, both now flagged as process failures by
   age, not just pending items.
5. **STATUS.md reconciliation**, once the Engineer's edit session is free
   (not now, per this task's constraint) — the specific, concrete list is
   in Section 1: fix the stale Wave 3 row, fix the stale E1/E2 blocker
   wording, add the missing Wave 3 narrative section or a pointer to
   QA-003, correct or drop the "awaiting Tester regression re-verification"
   line for Wave 2a now that QA-003 already provided it.
6. **Stop compounding the local/remote git divergence** (Section 7) —
   agents should treat GitHub API reads against `main`/PR branches, not
   local `main`, as the source of truth until fetch/push are fixed. This
   session's own PM-002 commit (below) is made locally per this task's
   explicit instruction, which itself adds one more commit to the diverged
   side — noted, not avoided, since it's what was asked.

**Honest bottom line on "is the program now substantially owner-blocked":**
No — there is real, non-manufactured work in items 1–3 above, and it's
higher-value work than at PM-001's writing (real content to test against,
not stubs). But the program's most consequential open items — Wave 3's
exit, Wave 4 in full, Wave 7 entirely, and the merge itself — are all now
sitting on owner actions, not engineering capacity. That's a meaningfully
different shape than PM-001's, which still had a full unstarted wave (2b)
as the top autonomous recommendation. That recommendation has been executed.
What's left that's genuinely autonomous is real but now smaller in scope
than what remains owner-gated.

---

## 6. Open decisions sitting unowned

| # | Item | Owner of the decision | Age | Process-failure flag |
|---|---|---|---|---|
| E8 | Branch protection/ruleset plan gate blocking Wave 3 exit | Program owner | Open since 2026-09-11, carried through Wave 3's close-out and now Wave 2b's completion | Not yet 3+ waves old, but aging past the wave it was raised in with zero movement — watch closely |
| QA-003 Finding 3 | Whether `lint` = `astro check && tsc --noEmit` satisfies R-6.1 AC1's intent | Business Analyst | Raised Wave 3 (2026-09-12), unassigned | Not yet a repeat-wave item — first time raised |
| QA-002 Probe 4 | Whether `404.astro`'s description is final copy or an unlogged placeholder | Business Analyst | Raised **Wave 2a** (2026-09-10) — still open through **Wave 3** (explicitly re-noted, not resolved, in QA-002's remediation) and through **Wave 2b** (explicitly re-noted again as "still open," not touched, per Wave 2b's self-test) | **Yes — this has now sat open across three separate waves (2a, 3, 2b) with the identical status each time: "flagged, not decided."** This is the process failure the task asked me to name plainly. It is the cheapest item on this entire list to close — one BA reading of one string — and it is now the single longest-lived unresolved item in the program by wave-count, not by calendar time. |
| (carried) | E6's real-content gap — REQ-001 §4's test-data table is not real copy | Owner (content) / BA (formalize) | Raised by PM-001 (Wave 2b's start), now directly evidenced by 10 open placeholder-register rows | Correctly not yet a repeat-wave failure — one wave old — but see Section 4: this is no longer a hypothetical risk, it is an active blocker on the next concrete action (the merge) |

**QA-002 Probe 4 is the one to call out by name as a process failure**, per
the task's explicit ask. Nothing about it is hard: it is "is this one
sentence final copy or a placeholder." It has been re-raised, unchanged, in
two separate independent Tester reviews since first flagged, and closing it
would also retroactively clarify whether it should have been its own
placeholder-register row this whole time. Recommend the Business Analyst
close this specific item within this next work session, not queue it again.

---

## 7. Housekeeping — git divergence, now urgent, not housekeeping

PM-001 called this "housekeeping" and recommended deliberate reconciliation
"by whoever next has write access to `main`'s history." That has not
happened, and the situation is now worse in a specific way:

- **Local `main`** (HEAD `9553bfe`) carries QA-003, PM-001, and QA-004 as
  local-only commits laid on top of `b4efc10` — it has **never seen** the
  actual Wave 3 CI/CD implementation commits or the PR #1 merge.
- **Actual `origin/main`** (HEAD `f411480`, confirmed live) has the real
  Wave 3 implementation and two successful production deploys — but does
  **not** have QA-003, PM-001, or QA-004 anywhere in its history.
- Those three documents now exist **only** on the open PR #3 branch
  (`wave-2b-page-content`), re-committed there with **different SHAs** than
  their local-`main` originals (content verified byte-identical by QA-004's
  own method note; history is not).
- This session adds a **fourth** copy of this pattern: PM-002 is being
  committed to local `main` per this task's explicit instruction, which
  means a document reasoning about the divergence is itself being added to
  the diverging side, not the side that will actually ship.

**This is no longer a background cleanup item — it is now actively
confusing about what "the current state of the program" even means**,
evidenced directly by this session needing to fetch every file from three
different refs (`main`, the PR branch, and — for QA-003 — nowhere but
`main`) to assemble one coherent picture, and by the fact that STATUS.md's
own Wave 3 narrative appears to exist in git history but not in the living
document on either branch. Recommend: as soon as `git fetch`/`push` are
unblocked in this sandbox (an environment issue, not a program one), a
single deliberate reconciliation pass — read all three sources, confirm
content agreement (already spot-checked and consistent everywhere I
compared), and land one clean history — should happen before any more
agents add a fifth divergent copy of anything. Until then, treat GitHub's
API state (this document's actual source) as ground truth, not any local
clone's `main`.

---

## 8. Risk the program is currently underweighting

**The pattern in Section 0 is the risk, not any single blocker.** This
program has now had an unverified "the owner approved X" claim reach two
independent agents in the same relay in the same task cycle — one declined
it correctly and logged why; this assessment is the second, and is
declining it the same way. That the Engineer's refusal worked this time is
a good sign for the program's design, not a reason to relax it: the next
relayed claim might reach an agent role with less reason to be suspicious of
it, or might be phrased as something more routine-sounding than "merge to
production." The concrete fix is not more caution from individual agents —
it's fixing whatever upstream step is generating "the owner said X" framings
without a verifiable channel back to the owner, since that step has now
produced this exact failure mode at least twice in immediate succession.

**Secondary, closely related risk:** Section 4's finding that merging as-is
would technically violate REQ-001 §1.3 was not surfaced by Wave 2b's
self-test, by QA-004's independent review, or by the merge instruction
itself — three separate checkpoints, none of which asked "is this
environment 'production' under our own pipeline's definition, and has the
copy-sign-off gate our own requirements name actually been exercised."
Every one of those checkpoints was reasoning correctly about its own
narrower question (does the code work, is the defect fixed, did the
instruction come from the owner) without anyone asking the composite
question. That's the same shape of gap as Section 0's — individually sound
local reasoning, no one holding the composite picture — which is exactly
the role this document and the PM function exist to fill, and exactly why
it should keep being asked at every merge point going forward, not just
this one.
