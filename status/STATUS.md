# Workstream Status — haroonie.ai Public Website

Last updated: 2026-09-10 by Project Manager

## Lifecycle position

Requirements → Planning → **[Implementation next]** → Engineering self-test
→ Independent QA review → Remediation → Regression → Acceptance → Delivery

REQ-001 is Approved. PLAN-001 (execution waves) is drafted. No implementation
has started; repository has `git init` only, no commits.

## Wave status

| Wave | Description | Status | Blocked by |
|---|---|---|---|
| 0 | Owner actions | Open | Owner |
| 1 | Foundation (scaffold, toolchain, Playwright harness) | Not started | Nothing — ready to begin |
| 2 | Pages, content, SEO plumbing | Not started | Wave 1 |
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

Hand off Wave 1 to `@engineer`: Astro scaffold, pinned Node version,
lockfile, base layout/nav/footer shell, 404 skeleton, Playwright harness
wired to the local dev server, first commit. Nothing in Wave 1 depends on
any open blocker above.

In parallel, the owner can action E3+E5 (unlocks Wave 3) and E1+E2 (unlocks
Wave 4) — see PLAN-001 §6.
