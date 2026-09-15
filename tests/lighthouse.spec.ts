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
		const lcpMs = lhr.audits['largest-contentful-paint'].numericValue;
		expect(lcpMs, 'LCP (ms) must be under 2.5s per R-5.2 AC1').toBeLessThan(2500);
	});
});
