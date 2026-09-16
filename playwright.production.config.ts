import { defineConfig, devices } from '@playwright/test';

// REQ-001-A2 / R-7.8 — production-hostname verification, deliberately a
// SEPARATE config from playwright.config.ts's build-output suites.
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
	testMatch: /production-security\.spec\.ts|csp-nonce-failsafe\.spec\.ts/,
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
