# Production rollback procedure (R-6.5)

**Status: documented and drilled 2026-09-18.** R-6.5 AC1 requires that "the
documented rollback procedure" exist and restore a prior deployment within
10 minutes. Until this drill no such document existed — the CI failure
summary pointed at the Cloudflare dashboard as an interim route, which is
not the same as a procedure anyone had followed.

Owner authorisation for the drill, verbatim: *"Run r.6-5 now as a controlled
drill."*

---

## The procedure

### 1. Identify the target — and record where you are first

Before changing anything, record the deployment you are rolling **away
from**. Without it you have no roll-forward target, and the dashboard will
not tell you which one you were on once you have moved.

Cloudflare dashboard → **Workers & Pages** → `haroonie-ai-public-site` →
**Deployments**, or by API:

```
GET https://api.cloudflare.com/client/v4/accounts/{account_id}
    /pages/projects/haroonie-ai-public-site
```

Read `result.canonical_deployment.id` — that is what production serves right
now. `latest_deployment` is **not** the same thing and will mislead you: a
preview deployment is frequently newer than the live production one.

### 2. Roll back

Dashboard → select the target deployment → **"Rollback to this
deployment."**

Or by API:

```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}
     /pages/projects/haroonie-ai-public-site
     /deployments/{deployment_id}/rollback
```

**The dashboard is the recommended route**, and not only because it needs no
token: R-6.5 is about a procedure a human executes under incident pressure,
so the drilled path should be the one someone would actually reach for.

The API route additionally requires a token with Pages write access. CI's
`CLOUDFLARE_API_TOKEN` has it. `CLOUDFLARE_ZONE_TOKEN` reads Pages fine, but
its write grants are unverifiable (**E11**), so do not assume it will work
at the moment you need it.

### 3. Verify — and NOT by looking at the site

**This is the step the drill exists to teach.** Re-read
`canonical_deployment.id` and confirm it is the target.

Do **not** verify by loading the page. Two independent reasons:

- **Consecutive deployments are frequently byte-identical.** Any run of
  docs-only or tooling-only merges builds to the same output. During this
  drill the four most recent production deployments were identical on every
  route.
- **Production HTML changes on every request regardless.** Cloudflare's JS
  Detections injects a script carrying a per-request CSP nonce, so page
  hashes never match between two fetches of the same deployment.

A content check can therefore tell you a successful rollback failed, or that
a failed one succeeded. Only the deployment id is authoritative.

If you want a content-level sanity check as well, use a **structural
marker** that differs between the two builds — during this drill, the count
of `class="service-icon"` elements on `/services/` (3 in the current build,
0 before the icons shipped).

### 4. Roll forward when the incident is resolved

Same operation, targeting the id recorded in step 1. Verify the same way.

---

## Drill record, 2026-09-18

| | |
|---|---|
| Rolled from | `eeb20b43-92db-4aed-8cf6-0a212dda38f4` (`e589e8c`, PR #23) |
| Rolled to | `490440a1-6a88-…` (`64cba98`, PR #20) — the dashboard's previous deployment |
| Rolled forward to | `eeb20b43-…` — confirmed `canonical_deployment` MATCH at 11:43:30 UTC |
| Executed by | Owner, via the Cloudflare dashboard |
| Visitor-visible regression | **None** — the two builds are byte-identical |
| Post-recovery health | All six routes 200; 3 service icons; brand tokens serving; CSP present |

### Second drill, 2026-09-18 — timed against a visible target

The first attempt could not measure propagation, because the dashboard's
"previous deployment" was byte-identical to the build it replaced. Repeated
against a target that differs visibly:

| | |
|---|---|
| Rolled to | `7f1215c2-c1c5-4dfe-8cbb-d53f4a7263f5` (`7692f41`, PR #17, pre-service-icons) |
| Signal | `service-icon` count on `/services/`: **3 → 0**, and back |
| Rollback issued | 07:49 EDT / 11:49 UTC |
| Rollback observed live | 11:50:07 UTC — **≤ ~67s**, a ceiling: it had already completed before the first sample |
| Roll-forward observed live | **11:51:14 UTC**. The duration figure previously stated here is **WITHDRAWN** — see the note below |
| Restored to | `eeb20b43-…` (`e589e8c`) — `canonical_deployment` MATCH |
| Under rollback | all routes still 200; a clean older build, not a broken state |

**R-6.5 AC1 is satisfied**, on the rollback direction, which is the direction
the criterion is about. It completed roughly an order of magnitude inside the
10-minute bound, and — unlike the first attempt — an observable signal proves
the transition happened rather than it being inferred from an unchanged page.
The roll-forward also completed quickly and the site was verified restored by
`canonical_deployment` match; what is withdrawn below is the *duration figure*
for it, not the fact that it happened.

The **rollback** figure is an **upper bound**, not a precise duration: it is
the gap between the human action and the next poll that saw the result, so it
strictly exceeds the true propagation time. Inflating a measurement and still
clearing a 10-minute criterion by roughly 9x is valid evidence, and the figure
is deliberately not stated more precisely than the method supports. QA-006
examined this reasoning directly and found it sound.

### The roll-forward figure is withdrawn (QA-006 Finding 16)

The row above previously read *"11:51:14 UTC, sampling every 3s from 11:51:26
— transition caught inside a ≤ 48s window"*. Three numbers that cannot all be
true: the observation is timestamped **12 seconds before sampling began**, a
**3-second cadence cannot produce a 48-second window**, and **no roll-forward
issue time was recorded**, so there is no anchor from which 48s could be
derived. No raw poll log was retained, so it cannot be reconstructed.

It is withdrawn rather than corrected, because guessing which of the three
numbers is wrong would be inventing evidence. **The rollback direction's
≤ ~67s stands and is what satisfies R-6.5 AC1** — that is the direction the
criterion is about ("Given a bad production deployment... the PRIOR
deployment serves within 10 minutes"). The roll-forward is the return to
normal after the drill, not the criterion.

**To restore a roll-forward figure:** re-drill with the poll output retained
to a file, and record the issue time as well as the observation time. Both
were captured by hand the first time, which is how the three numbers came
apart.

### The finding worth keeping

Had this been a real incident, an operator would have clicked rollback,
reloaded the page, seen identical content, and reasonably concluded the
rollback had not worked — when it had. The inverse is more dangerous: you
could believe you had rolled back a bad deployment while still serving it.

That is why step 3 above verifies the deployment id rather than the page,
and it is the single most useful thing these drills produced. **It took a
drill whose first attempt failed to measure anything to surface it** — a
procedure written from theory would have said "roll back, then check the
site."
