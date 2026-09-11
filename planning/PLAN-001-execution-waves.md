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
against until Wave 3 exists. **Owner-blocked on:** E1, E2.

Scope: R-7.1 (zone active on Cloudflare nameservers), R-7.2 (`www` canonical
+ TLS), R-7.3 (apex → `www` 301, path-preserving), R-7.4 (HTTPS upgrade +
HSTS), R-7.5 (security headers), R-7.6 (trailing-slash canonicalization).
Also: create the Cloudflare Pages project itself — this is shared
infrastructure between Wave 3 and Wave 4, do it once, here, first.

**Exit criteria:**
- `https://www.haroonie.ai/` resolves to a Cloudflare Pages deployment with a
  valid cert
- Apex 301s to `www`, preserving path
- HTTP upgrades to HTTPS; HSTS present
- Security headers present on every response; zero CSP console violations
  across R-2's pages

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
| E1/E2 not actioned | Wave 4 cannot start; Wave 7 cannot close | Waves 1, 2, 3, 5, 6 all proceed fully |
| E3/E5 not actioned | Wave 3 cannot be *verified* (drafting still possible); Wave 7 cannot close | Waves 1, 2, 4, 5, 6 all proceed fully |
| E4 not actioned | Wave 5 cannot start | Every other wave, including go-live, proceeds — R-3.1 is non-blocking by design |
| E6 incomplete | Affected pages carry logged placeholders, blocking only those pages' production sign-off | Scaffolding, tests, CI, domain, and unaffected pages all proceed |

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
