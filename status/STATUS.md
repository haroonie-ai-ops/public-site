# Workstream Status — haroonie.ai Public Website

Last updated: 2026-09-10 — Wave 1 **Accepted** by Owner, regression pass complete

## Lifecycle position

Requirements → Planning → Implementation → Engineering self-test →
Independent QA review → Remediation → **Acceptance (Owner, 2026-09-10)** →
**Regression (Tester, 2026-09-10) — confirmed, no new defects** → Delivery

Owner accepted Wave 1 directly on the strength of the remediation evidence,
ahead of the Tester regression pass. The Tester then independently
re-verified all three code-level findings from a fresh clone — not a
re-print of the Engineer's numbers — and confirmed each holds: `main`
branch, the `ASTRO_DEV_BACKGROUND` fix, and the nav test's route coverage.
Full suite: 47 passed, 1 skipped, 0 failed. No new defects surfaced. Full
detail: `status/QA-001-wave1-tester-review.md` (Regression Pass section).

REQ-001 is Approved. PLAN-001 (execution waves) is drafted. Wave 1
(Foundation) has been implemented, self-tested, independently reviewed
(QA-001), and remediated. All findings addressed:

1. **High severity, fixed:** `npm test` was not actually reproducible
   outside the Engineer's original session — it only passed because a
   leftover background dev-server daemon happened to already be listening.
   Root cause: Astro 7.2+ auto-backgrounds `astro dev` for AI-agent
   environments, which broke Playwright's `webServer` contract. Fixed by
   setting `ASTRO_DEV_BACKGROUND=0` on the `webServer`'s own `env` in
   `playwright.config.ts`. Re-verified from a fresh clone with no env var
   manually exported and the port confirmed empty beforehand: 47 passed, 1
   skipped, 0 failed.
2. **Medium severity, fixed:** default branch renamed `master` → `main`
   (`git branch -m`), done before any GitHub remote exists.
3. **Low severity, fixed:** nav test now checks all six routes instead of
   only `/`.
4. **Informational (Wave 4 scope):** no action required yet — logged for
   when hosting/domain configuration starts.

Full detail and re-verification evidence:
`status/QA-001-wave1-tester-review.md` (Remediation Report section). One
honest open note there, not a blocker: a config-load-time error appeared in
this sandbox's nested Temp scratch-clone path specifically (never in the
actual project directory, and observed identically by both the Engineer and
the Tester independently) — flagged in case it resurfaces once real CI
exists, not asserted as resolved.

Wave 1 is Accepted and regression-confirmed. Closed.

## Wave 1 — verification evidence (post-remediation)

- `npm run typecheck` (astro check): 0 errors, 0 warnings — fresh clone
- `npm run build`: 7/7 routes generated (`/`, `/services/`, `/about/`,
  `/contact/`, `/privacy/`, `/terms/`, `/404.html`) — fresh clone, `npm ci`
- `npm test` (Playwright, Chromium + Firefox + WebKit): **47 passed, 1
  skipped** (documented WebKit tab-order behaviour), 0 failed — verified
  with no pre-existing daemon and no manually exported env vars
- Secret scan of tracked files: none found; `.env*` gitignored
- 7 commits on `main` (renamed from `master`): governance/spec docs, Astro
  scaffold + Node 24 LTS pin, shared layout + route stubs, Playwright
  harness, QA-001 review, remediation fixes

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
| 1 | Foundation (scaffold, toolchain, Playwright harness) | **Accepted (Owner) — regression-confirmed (Tester), closed** | Nothing |
| 2 | Pages, content, SEO plumbing | Not started | Nothing — Wave 1 Accepted |
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

Wave 1 is closed. Wave 2 (pages, content, SEO plumbing) is ready to start —
its 2a/2b split from PLAN-001 applies: shared layout/nav/head work first,
then the five content pages in parallel once that merges. Real page copy
depends on E6; structure and tests do not.

In parallel, the owner can action E3+E5 (unlocks Wave 3) and E1+E2 (unlocks
Wave 4) — see PLAN-001 §6.
