# Workstream Status — haroonie.ai Public Website

Last updated: 2026-09-10 by Tester (Wave 1 independent review complete)

## Lifecycle position

Requirements → Planning → Implementation → Engineering self-test →
Independent QA review → **[Remediation next]** → Regression → Acceptance →
Delivery

REQ-001 is Approved. PLAN-001 (execution waves) is drafted. Wave 1
(Foundation) is implemented, self-tested, and has now had independent Tester
review. **Not yet Accepted** — see `status/QA-001-wave1-tester-review.md`
for full findings. Two issues require remediation before acceptance:

1. **High severity:** `npm test` as configured is not actually reproducible
   outside the Engineer's own session — it only passed because a leftover
   background dev-server daemon happened to be listening already. On a
   genuinely clean environment (any CI runner) it fails with `Error: Process
   from config.webServer exited early.` Root cause and one-line fix are
   documented in QA-001. **This would have silently broken Wave 3's CI gate
   on day one** had it not been caught here.
2. **Medium severity:** default branch is `master`; REQ-001 R-1.1 requires
   `main`. Cheap to fix now, before a GitHub remote exists (E3); expensive
   after.

A third, low-severity test-coverage gap and a fourth informational note for
Wave 4 are also recorded in QA-001 but do not block acceptance.

## Wave 1 — engineering self-test evidence

- `npm run typecheck` (astro check): 0 errors, 0 warnings
- `npm run build`: 7/7 routes generated (`/`, `/services/`, `/about/`,
  `/contact/`, `/privacy/`, `/terms/`, `/404.html`)
- `npm test` (Playwright, Chromium + Firefox + WebKit): 32 passed, 1 skipped
  (documented WebKit platform behaviour, see `tests/smoke.spec.ts`), 0 failed
- Secret scan of tracked files: none found; `.env*` gitignored
- 4 commits on `master`: governance/spec docs, Astro scaffold + Node 24 LTS
  pin, shared layout + route stubs, Playwright harness

Known environment note for whoever runs this next: this machine's default
`node` on PATH is v17.3.0 (nvm-windows' `nvm use` requires elevated
privileges not available in this session). Build/test runs above used Node
24.21.0 directly via its nvm-managed path. CI will use `.nvmrc` (24.21.0) via
`actions/setup-node`, which is unaffected by this local quirk — flagged here
only so a future local run isn't confused by a stale global Node version.

## Wave status

| Wave | Description | Status | Blocked by |
|---|---|---|---|
| 0 | Owner actions | Open | Owner |
| 1 | Foundation (scaffold, toolchain, Playwright harness) | **Reviewed — remediation required (QA-001, 2 findings)** | Nothing |
| 2 | Pages, content, SEO plumbing | Not started | Wave 1 acceptance |
| 3 | CI/CD pipeline | Not started | Wave 1; verification blocked on E3, E5 |
| 4 | Domain and hosting configuration | Not started | Blocked on E1, E2 |
| 5 | Enquiry form completion | Not started | Wave 2 (Contact skeleton); blocked on E4 |
| 6 | Performance and cross-browser hardening | Not started | Wave 2 |
| 7 | Go-live and acceptance | Not started | Waves 3 + 4 + 6 |

## Open blockers (owner action required)

| ID | Item | Impact | Age |
|---|---|---|---|
| E1 | Cloudflare account + zone add for `haroonie.ai` | Blocks Wave 4 | New |
| E2 | Registrar nameserver delegation to Cloudflare | Blocks Wave 4 | New |
| E3 | GitHub repository (remote) + secrets configured | Blocks Wave 3 verification | New |
| E5 | Scoped Cloudflare API token (Pages edit only) | Blocks Wave 3 verification | New |
| E4 | Transactional email credential | Blocks Wave 5 only; not a launch blocker | New |
| E6 | Copy: services, bio, legal entity/address, mailbox, booking URL | Blocks production sign-off on affected pages only; does not block any wave from starting | New |

No blocker halts the whole program. Waves 1, 2, 5 (once its precondition
lands), and 6 are fully executable today without any owner action beyond the
already-granted REQ-001 approval.

## Recommended immediate next step

Hand back to `@engineer` for remediation of QA-001 Findings 1–3, then a
regression pass (re-run the full suite from a clean clone, not the working
directory) before Wave 1 is marked Accepted.

In parallel, the owner can action E3+E5 (unlocks Wave 3) and E1+E2 (unlocks
Wave 4) — see PLAN-001 §6.
