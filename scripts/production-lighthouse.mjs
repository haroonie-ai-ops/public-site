// R-9.8 AC6 / R-7.8 AC4 — run the R-5.2 AC1 Lighthouse audit against the
// PRODUCTION HOSTNAME and print the comparison against the pre-brand
// baseline.
//
// WHY A SCRIPT AND NOT A SPEC. QA-006 Finding 3.2: `tests/lighthouse.spec.ts`
// runs against the local built output, and both of these criteria name the
// production hostname. That spec is the right home for the continuous
// regression gate — it must stay deployment-independent so it can run
// pre-merge (R-7.8 AC6). But R-9.8 AC6 is not a continuous gate; its wording
// is an event: "When R-5.2 AC1's audit is NEXT executed against the
// production hostname, Then the result is compared against the most recent
// pre-brand baseline". That is a measurement to take and record, which is
// what this does.
//
// It is checked in rather than run ad hoc so the figure in
// status/PERF-002-post-brand-production-audit.md can be reproduced by anyone,
// which is the property QA-006 found the previous matrix generator lacked.
//
// Run:  node scripts/production-lighthouse.mjs [url]
//
// Deliberately NOT wired into CI. It drives a real browser against the live
// site from whatever network it runs on; Cloudflare's Bot Fight Mode makes a
// datacenter runner an unreliable place to measure from (QA-005 Finding 3),
// and a flaky performance number in a deploy gate is worse than a dated one
// in a document.

import { chromium } from 'playwright';
import { playAudit } from 'playwright-lighthouse';

const URL_UNDER_TEST = process.argv[2] ?? 'https://www.haroonie.ai/';
const CDP_PORT = 9223;

// REQ-001 §4, "Pre-brand performance baseline", sourced from PERF-001 as
// corrected by REQ-001-A2 §3.3. Both ends of the LCP range are kept: the
// previous comparison used only the loosest (1200ms) and reported the result
// as "roughly 290ms BETTER", an improvement that largely measured the choice
// of baseline end (QA-006 Finding 3.3).
const BASELINE = { performance: 100, lcpMsBest: 960, lcpMsWorst: 1200, ownJsBytes: 0 };

const browser = await chromium.launch({
	args: [`--remote-debugging-port=${CDP_PORT}`],
});

try {
	const page = await browser.newPage();
	const response = await page.goto(URL_UNDER_TEST, { waitUntil: 'load' });

	if (!response || response.status() !== 200) {
		// A Bot Fight Mode challenge returns 403 and would otherwise be audited
		// as if it were the site, producing a meaningless score.
		throw new Error(
			`${URL_UNDER_TEST} answered ${response?.status() ?? 'no response'} — not auditing. ` +
				'If this is 403 with Cloudflare markers it is a Bot Fight Mode challenge ' +
				'(QA-005 Finding 3), not a site failure; re-run from an unchallenged network.',
		);
	}

	const { lhr } = await playAudit({
		page,
		port: CDP_PORT,
		// `performance: 0` is a deliberate non-threshold. This script REPORTS,
		// it does not gate - the gate is tests/lighthouse.spec.ts, and a script
		// that threw on a bad number would produce no record OF the bad number,
		// which is the opposite of what AC6 asks for. But the option cannot
		// simply be omitted: playwright-lighthouse then requests every
		// Lighthouse category, including `pwa`, which Lighthouse 13 removed -
		// the run dies with "unrecognized category in 'onlyCategories': pwa"
		// before any audit executes. Naming the one category needed keeps the
		// run scoped and keeps it non-gating.
		thresholds: { performance: 0 },
		opts: {
			formFactor: 'mobile',
			throttlingMethod: 'simulate',
			screenEmulation: { mobile: true, width: 360, height: 640, deviceScaleFactor: 2, disabled: false },
		},
	});

	const num = (id) => lhr.audits[id]?.numericValue ?? Number.NaN;
	const performance = Math.round((lhr.categories.performance.score ?? 0) * 100);
	const lcp = num('largest-contentful-paint');
	const cls = num('cumulative-layout-shift');
	const fcp = num('first-contentful-paint');
	const tbt = num('total-blocking-time');

	const lines = [
		`URL                 ${URL_UNDER_TEST}`,
		`Measured at         ${new Date().toISOString()}`,
		`Lighthouse          ${lhr.lighthouseVersion}`,
		'',
		`Performance         ${performance}   (baseline ${BASELINE.performance}; delta ${performance - BASELINE.performance})`,
		`LCP                 ${Math.round(lcp)} ms   (baseline range ${BASELINE.lcpMsBest}-${BASELINE.lcpMsWorst} ms; ` +
			`delta ${Math.round(lcp - BASELINE.lcpMsBest)} ms vs best end, ${Math.round(lcp - BASELINE.lcpMsWorst)} ms vs worst end)`,
		`CLS                 ${cls.toFixed(3)}   (R-5.2 AC3 budget < 0.1)`,
		`FCP                 ${Math.round(fcp)} ms`,
		`TBT                 ${Math.round(tbt)} ms`,
		'',
		`R-5.2 AC1 bounds    Performance >= 95: ${performance >= 95 ? 'PASS' : 'FAIL'}; LCP < 2500 ms: ${lcp < 2500 ? 'PASS' : 'FAIL'}`,
		`R-5.2 AC3 bound     CLS < 0.1: ${cls < 0.1 ? 'PASS' : 'FAIL'}`,
	];

	console.log(lines.join('\n'));
} finally {
	await browser.close();
}
