import { defineConfig, devices } from '@playwright/test';

// REQ-001-A2 / R-7.5 AC1d — a THIRD, deliberately separate Playwright
// config, holding only the one check that PR #11 moved out of the
// CI-gated production suite (tests/production-challenge-platform.manual.spec.ts
// has the full rationale). Structurally isolated from
// playwright.production.config.ts's `testMatch` — rather than an
// env-var self-skip inside that same config/job — so `npm run
// test:production` (what `post-deploy-verify` runs) can never pick this
// spec up even by accident; it only runs via its own explicit command,
// `npm run test:production:manual`.
//
// No webServer: this, like playwright.production.config.ts, talks only to
// an already-deployed real URL over the network.
export default defineConfig({
	testDir: './tests',
	testMatch: /production-challenge-platform\.manual\.spec\.ts/,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: 'list',
	use: {
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'production-manual-chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'production-manual-firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'production-manual-webkit', use: { ...devices['Desktop Safari'] } },
	],
});
