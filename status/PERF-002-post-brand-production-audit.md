# PERF-002 — Post-brand Lighthouse audit against the production hostname

**Raised:** 2026-09-18
**Author:** Engineer, during QA-006 remediation
**Discharges:** R-9.8 AC6, R-7.8 AC4 — the production-hostname half
**Headline:** **R-5.2 AC1's Performance clause does not pass on production.**
Three consecutive runs scored **83, 83, 92** against a floor of 95 and a
pre-brand baseline of 100. LCP, CLS and the JavaScript byte budget all pass
comfortably. The cause is not the brand.

---

## Why this document exists

R-9.8 AC6 and R-7.8 AC4 both say the same thing in different words: when the
R-5.2 AC1 audit is next executed **against the production hostname**, the
result is compared against the pre-brand baseline and any regression is
reported explicitly rather than absorbed as "still passing".

QA-006 Finding 3 established that this had not happened. `lighthouse.spec.ts`
runs against the local built output; the traceability matrix credited it for
both criteria anyway, and reported the result as *"roughly 290ms BETTER"* —
a comparison between a local post-brand number and a production pre-brand
number, measured against the loosest end of the baseline range.

So the audit was actually run against production. This is what it found.

## Method

`node scripts/production-lighthouse.mjs` — checked in, so the figures below
are reproducible rather than asserted. It drives a real Chromium navigation
to `https://www.haroonie.ai/` (not `*.pages.dev`, not local output), then
audits that page with Lighthouse 13.4.1, `formFactor: mobile`,
`throttlingMethod: simulate`, 360×640 at DPR 2 — the same options
`tests/lighthouse.spec.ts` uses, so the only variable is the host.

It reports and never gates. A script that threw on a bad score would produce
no record of the bad score, which is the opposite of what AC6 asks for.

Run from a residential connection, not a CI runner: Cloudflare's Bot Fight
Mode challenges datacenter IPs (QA-005 Finding 3) and a challenged response
would be audited as if it were the site.

## Results — 2026-09-18, three consecutive runs

| Metric | Run 1 | Run 2 | Run 3 | Pre-brand baseline | AC bound | Verdict |
|---|---|---|---|---|---|---|
| Performance | **83** | **83** | **92** | 100 | ≥ 95 (R-5.2 AC1) | **FAIL** |
| LCP | 1022 ms | 1112 ms | 900 ms | 960–1200 ms | < 2500 ms (R-5.2 AC1) | PASS |
| CLS | 0.000 | 0.000 | 0.000 | not recorded (no font, no image pre-brand) | < 0.1 (R-5.2 AC3) | PASS |
| FCP | 924 ms | 833 ms | 813 ms | — | — | — |
| TBT | 695 ms | 436 ms | 351 ms | — | — | — |

Local built output, same machine, same session, for comparison:
**Performance 100, LCP 912 ms, CLS 0.000.**

## What is actually causing it, measured

The site's own JavaScript is still 0 bytes. The production page loads exactly
one script, and it is Cloudflare's:

```
302     0 B      https://www.haroonie.ai/cdn-cgi/challenge-platform/scripts/jsd/main.js
200  20,576 B    https://www.haroonie.ai/cdn-cgi/challenge-platform/h/g/scripts/jsd/330e41bb475c/main.js
```

That is **Bot Fight Mode's JavaScript Detections**. Its cost is CPU, not
bytes: Total Blocking Time of 351–695 ms is what drives the Performance
score down, while the page's own paint metrics stay at baseline. That is
consistent with LCP and CLS passing while the composite score fails.

**The recorded figure for this script has drifted by a factor of 22.**
REQ-001-A2 §3.3 records *"~938 bytes of Cloudflare-injected script"*,
measured during QA-005 on 2026-09-16. It is 20,576 bytes today. Nothing in
this repository changed to cause that, and nothing in this repository would
have noticed it: R-5.2 AC2's budget is 50 KB, so 20.5 KB still passes, and
`production-security.spec.ts` asserts exactly that budget and is green. The
byte check is not the check that catches this.

## Conformance, stated precisely

- **R-5.2 AC1 — Performance ≥ 95: FAILS on the production hostname.** Passes
  on the built output (100). Both statements are true and they are about
  different things.
- **R-5.2 AC1 — LCP < 2.5 s: PASSES**, and sits inside the pre-brand range.
- **R-5.2 AC2 — JS under 50 KB compressed: PASSES** (20.5 KB uncompressed).
- **R-5.2 AC3 — CLS < 0.1: PASSES**, measured 0.000 on production with the
  web font live. This is the criterion REQ-001-A3 added because the brand
  introduced the risk; the brand did not realise it.
- **R-9.8 AC7 — the site's OWN JavaScript remains 0 bytes: PASSES.** The
  20.5 KB is Cloudflare's, injected at the edge, and is not part of the
  brand or of any build output.
- **R-9.8 AC6 / R-7.8 AC4 — discharged by this document**, in the direction
  they were written: the regression is reported, not absorbed.

**The brand is not the regression.** Every metric the brand could plausibly
have moved — LCP, CLS, byte weight — is at or better than baseline. The
delta is entirely attributable to an edge feature that was already enabled
before the brand shipped and has since grown.

## What this needs from the owner, and what it does not

**Not an Engineer decision.** The fix, if the owner wants one, is a
Cloudflare zone setting: Bot Fight Mode / JS Detections. QA-005 recorded the
program's standing position — *"Not touched, on purpose: Cloudflare zone
settings, Bot Fight Mode, HSTS"* — and that position is unchanged here.
Nothing was altered to produce this measurement.

Three routes, for the owner:

1. **Accept and amend.** R-5.2 AC1's 95 was set against a site with no edge
   script. Amend AC1 to state the production floor separately from the
   build-output floor, recording that the difference is an edge security
   feature the owner chose to keep. This costs nothing and makes the
   requirement true.
2. **Turn JS Detections off, keep Bot Fight Mode.** They are separate
   toggles. This is the change that would recover the score, and it weakens
   a bot-mitigation control — an owner call, with a security consequence, not
   a performance tweak.
3. **Leave both and leave AC1 as written,** accepting that it fails on
   production and is recorded as failing. Honest, and the least useful of the
   three, because a criterion known to fail stops being read.

Recommendation: **(1)**. The site is fast — 900 ms LCP on mobile emulation
through a real CDN is a good number — and the score is measuring a security
feature's cost, not a performance defect. Option (2) trades a real control
for a number. But this is the owner's to decide; it is recorded here, not
acted on.

## Re-running this

```
node scripts/production-lighthouse.mjs                       # www.haroonie.ai
node scripts/production-lighthouse.mjs https://example.com/   # anything else
```

Deliberately not wired into CI: it drives a real browser against the live
site from whatever network it runs on, and a flaky performance number inside
a deploy gate is worse than a dated one in a document.
