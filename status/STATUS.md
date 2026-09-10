# Workstream Status — haroonie.ai Public Website

Last updated: 2026-09-10 by Engineer (Wave 1 complete)

## Lifecycle position

Requirements → Planning → Implementation → **[Engineering self-test done —
Independent QA review next]** → Remediation → Regression → Acceptance →
Delivery

REQ-001 is Approved. PLAN-001 (execution waves) is drafted. Wave 1
(Foundation) is implemented and self-tested; awaiting independent Tester
review before it can be marked Accepted per CLAUDE.md's completion
definition — implementation existing is not the same as done.

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
| 1 | Foundation (scaffold, toolchain, Playwright harness) | **Implemented, self-tested — pending Tester review** | Nothing |
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

Hand off Wave 1 to `@tester` for independent QA review against REQ-001's
acceptance criteria before it is marked Accepted — the Engineer's own test
run above is self-test evidence, not independent sign-off, per CLAUDE.md's
delivery lifecycle.

In parallel, the owner can action E3+E5 (unlocks Wave 3) and E1+E2 (unlocks
Wave 4) — see PLAN-001 §6.
