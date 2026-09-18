import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import { LIGHTHOUSE_CDP_PORT } from './support/ports';

// Wave 6 (R-5.2 AC1): "Given the production home page on a simulated mobile
// connection, When audited, Then Lighthouse Performance is at least 95 and
// Largest Contentful Paint is under 2.5 seconds." Scoped to the home page
// only, per the AC's own wording — the other five pages' JS budget (AC2) is
// covered generically for every page in cross-browser.spec.ts.
//
// Runs against the built static output (`previewBaseURL`, via the
// `lighthouse` project in playwright.config.ts), the same server
// `seo-preview.spec.ts` uses, and for the same reason: this is what
// Cloudflare Pages actually serves, not the dev server. This is the durable,
// ongoing enforcement of the budget that Wave 6 measured once by hand
// against the live production URL — see status/PERF-001-wave6-audit.md for
// that one-off production evidence (production home page: Performance 100,
// LCP ~0.9-1.2s, 0 bytes of JS, both runs comfortably inside budget).
//
// It also carries R-5.2 AC3 (CLS < 0.1, added by REQ-001-A3) and the
// asserted pre-brand baseline comparison required by R-5.2 AC4 / R-7.8 AC4 /
// R-9.8 AC6. Both were added by QA-006 remediation; see the comments at each.
//
// One test only, deliberately — see the `lighthouse` project's comment in
// playwright.config.ts for why this file must not grow a second test.
//
// Observed flakiness (Wave 6, this shared local sandbox only — same class
// as QA-002 Finding 1, ENVIRONMENT/FLAKY_TEST, not a product defect): the
// very first run immediately after this webServer's own `npm run build`
// step scored 75 while the machine was still busy with that build's
// process teardown; three immediate reruns with no other load scored
// 99/100/100. Lighthouse's "simulate" throttling still records a real
// performance trace before simulating the network on top of it, so genuine
// CPU contention on the machine running the test — not present on a
// dedicated CI runner — can transiently depress the score. Not remediated
// here per the same reasoning QA-002 Finding 1 was left alone: no retry
// logic or threshold-loosening was added.
test.describe('home page performance budget (R-5.2 AC1)', () => {
	test('meets Lighthouse Performance >= 95 and LCP < 2.5s on simulated mobile', async ({
		page,
	}) => {
		await page.goto('/');

		const { lhr } = await playAudit({
			page,
			port: LIGHTHOUSE_CDP_PORT,
			thresholds: {
				performance: 95,
			},
			opts: {
				formFactor: 'mobile',
				throttlingMethod: 'simulate',
				screenEmulation: {
					mobile: true,
					width: 360,
					height: 640,
					deviceScaleFactor: 2,
					disabled: false,
				},
			},
		});

		// `playAudit`'s own `thresholds` option already fails the test if the
		// Performance category score is under 95 (asserted above by not
		// throwing); LCP is a separate numeric audit, not a category score, so
		// it needs its own explicit assertion here per AC1's "under 2.5
		// seconds" clause.
		// `numericValue` is `number | undefined` in Lighthouse's own types: an
		// audit that did not run reports no value. Narrowed explicitly rather
		// than asserted away, and the narrowing doubles as a real check - a
		// missing LCP audit now FAILS instead of silently comparing undefined,
		// which is what the previous single toBeLessThan() would have done.
		const lcpMs = lhr.audits['largest-contentful-paint'].numericValue ?? Number.NaN;
		expect(Number.isFinite(lcpMs), 'Lighthouse must report an LCP value').toBe(true);
		expect(lcpMs, 'LCP (ms) must be under 2.5s per R-5.2 AC1').toBeLessThan(2500);

		// R-5.2 AC3 (added by REQ-001-A3) - "Given the home page on a simulated
		// mobile connection, When audited, Then Cumulative Layout Shift is
		// under 0.1."
		//
		// Added by QA-006 Finding 1. This criterion was marked AUTOMATED in the
		// R-8.1 traceability matrix against this file, and three separate rows
		// (R-5.2 AC3, R-9.8 AC3, R-9.2 AC5) credited a CLS budget that did not
		// exist anywhere in the suite - `grep -rni "cls|layout-shift" tests/`
		// returned nothing. The criterion was written by the amendment
		// SPECIFICALLY because the brand introduced the risk it guards (a web
		// font and, at the time, an intended hero image - the two canonical CLS
		// sources), and it shipped unguarded.
		//
		// Read the same way as LCP above, and for the same reason: an audit
		// that did not run reports no value, so a missing CLS audit must FAIL
		// rather than silently compare `undefined`.
		const cls = lhr.audits['cumulative-layout-shift'].numericValue ?? Number.NaN;
		expect(Number.isFinite(cls), 'Lighthouse must report a CLS value').toBe(true);
		expect(cls, 'CLS must be under 0.1 per R-5.2 AC3').toBeLessThan(0.1);

		// R-5.2 AC4 / R-7.8 AC4 / R-9.8 AC6 - one requirement wearing three
		// numbers: the post-brand result must be COMPARED against the pre-brand
		// baseline, "with any regression reported rather than silently absorbed
		// as 'still passing' without a stated comparison".
		//
		// Baseline: REQ-001 section 4, "Pre-brand performance baseline", sourced
		// from PERF-001 as corrected by REQ-001-A2 section 3.3 - production home
		// page, Performance 100, LCP ~0.96-1.2s.
		//
		// QA-006 Finding 3 rewrote how this is implemented. It was previously a
		// `console.log` and nothing else, and the comment below it said the
		// pass/fail bound was "deliberately unchanged". That is the failure mode
		// the AC exists to prevent: Performance 96 with LCP 2400ms is an
		// unambiguous regression against 100 / ~1200ms, and it would have
		// printed the regression into the stdout of a green run. The Tester was
		// right; a line of log inside a passing test is not a comparison that
		// can fail.
		//
		// So the comparison is now ASSERTED, against a deliberately wide
		// tolerance that is still far tighter than AC1's own bound. The
		// tolerance is a judgement, and it is stated rather than implied:
		// Lighthouse's composite score moves a point or two on shared hardware,
		// and LCP under `simulate` throttling is the more stable of the two, so
		// the score gets 3 points of slack and LCP gets 600ms - 50% above the
		// LOOSEST end of the recorded baseline range. A drift large enough to
		// matter breaks the gate; run-to-run noise does not.
		const BASELINE = {
			performance: 100,
			// The recorded range is ~0.96-1.2s. Both ends are kept because the
			// previous code used only `1200` - the loosest end - and then
			// reported the result as "roughly 290ms BETTER", an improvement that
			// mostly measured the choice of baseline end (QA-006 Finding 3.3).
			// The comparison below is stated against BOTH ends so the reader is
			// not handed the flattering one.
			lcpMsBest: 960,
			lcpMsWorst: 1200,
		};
		const TOLERANCE = { performancePoints: 3, lcpMs: 600 };

		const performance = Math.round((lhr.categories.performance.score ?? 0) * 100);
		const deltaScore = performance - BASELINE.performance;
		const deltaLcpWorst = Math.round(lcpMs - BASELINE.lcpMsWorst);
		const deltaLcpBest = Math.round(lcpMs - BASELINE.lcpMsBest);

		// eslint-disable-next-line no-console -- deliberate: this IS the stated comparison the three ACs require, not debug output.
		console.log(
			`R-9.8 AC6 baseline comparison (LOCAL BUILT OUTPUT, not the production ` +
				`hostname - see below) - Performance ${performance} vs ${BASELINE.performance} ` +
				`(${deltaScore >= 0 ? '+' : ''}${deltaScore}); LCP ${Math.round(lcpMs)}ms vs a ` +
				`baseline range of ${BASELINE.lcpMsBest}-${BASELINE.lcpMsWorst}ms ` +
				`(${deltaLcpBest >= 0 ? '+' : ''}${deltaLcpBest}ms against the best end, ` +
				`${deltaLcpWorst >= 0 ? '+' : ''}${deltaLcpWorst}ms against the worst); ` +
				`CLS ${cls.toFixed(3)} against a pre-brand page that had no font and no image. ` +
				`Site's own JS unchanged at 0 bytes (asserted separately by cross-browser.spec.ts).`,
		);

		expect(
			performance,
			`Performance ${performance} has regressed more than ${TOLERANCE.performancePoints} ` +
				`points below the pre-brand baseline of ${BASELINE.performance} (REQ-001 section 4). ` +
				`R-5.2 AC1's own floor of 95 is separate and also applies.`,
		).toBeGreaterThanOrEqual(BASELINE.performance - TOLERANCE.performancePoints);

		expect(
			lcpMs,
			`LCP ${Math.round(lcpMs)}ms has regressed more than ${TOLERANCE.lcpMs}ms beyond the ` +
				`loosest end of the pre-brand baseline range (${BASELINE.lcpMsWorst}ms). ` +
				`R-5.2 AC1's own ceiling of 2500ms is separate and also applies.`,
		).toBeLessThanOrEqual(BASELINE.lcpMsWorst + TOLERANCE.lcpMs);

		// WHAT THIS TEST STILL DOES NOT DO, stated rather than left to be
		// rediscovered (QA-006 Finding 3.2): R-9.8 AC6 and R-7.8 AC4 name the
		// PRODUCTION HOSTNAME. This project runs against `previewBaseURL` - the
		// local built static output - because that is where a pre-merge gate
		// can run deterministically and without a deployment. The figures above
		// are therefore a local-vs-production comparison, not like-for-like.
		//
		// The production half of AC6 is discharged separately and by
		// measurement, not by this file: see status/PERF-002-post-brand-
		// production-audit.md. The matrix rows for AC6 cite that document; this
		// file is cited only for the ongoing local regression gate it actually
		// is.
	});
});
