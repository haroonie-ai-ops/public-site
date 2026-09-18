import { defineConfig, devices } from '@playwright/test';

// Production-hostname verification, deliberately a SEPARATE config from
// playwright.config.ts's build-output suites. Covers two requirements that
// ask different questions of the same deployment:
//   R-6.4 (production-smoke.spec.ts)    — is the site up, did it serve?
//   R-7.8 (production-security.spec.ts) — does the CSP hold on the real host?
// They share this config because they share one expensive precondition, a
// real browser against the real hostname, and because R-6.4 AC2's rollback
// recommendation is the same job-level mechanism R-7.8 already triggers.
//
// QA-005 Finding 2: every existing suite targets build output or the
// `pages.dev` origin, never the real Cloudflare zone proxy — which is
// exactly where Bot Fight Mode's script injection (and therefore R-7.5
// AC2's actual failure) occurs. Folding this into playwright.config.ts
// risked exactly the mistake QA-005 diagnosed: a project addition that
// quietly gets excluded by one of that file's existing testIgnore regexes,
// or quietly included in the fast pre-merge `npm test` gate it must never
// join (R-7.8 AC6 — additive, not a replacement, and this suite needs a
// live network dependency the pre-merge gate must not have).
//
// No webServer here: every test in this config's scope talks to a real,
// already-deployed URL over the network — there is nothing local to build
// or serve.
export default defineConfig({
	testDir: './tests',
	testMatch: /production-smoke\.spec\.ts|production-security\.spec\.ts|csp-nonce-failsafe\.spec\.ts/,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI
		? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-production' }]]
		: 'list',
	use: {
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'production-chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'production-firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'production-webkit', use: { ...devices['Desktop Safari'] } },
	],
});
