import { defineConfig, devices } from '@playwright/test';

// REQ-001-A2 — a THIRD, deliberately separate Playwright config, holding
// the checks moved out of the CI-gated production suite because Bot Fight
// Mode challenges their request pattern from a datacenter IP, not because
// anything about them is wrong:
//   - R-7.5 AC1d  — tests/production-challenge-platform.manual.spec.ts (PR #11)
//   - R-7.5 AC1c  — tests/production-nonce-entropy.manual.spec.ts (2026-09-17),
//                   the 20-sample uniqueness audit only; AC1c's entropy
//                   floor stays CI-gated in production-security.spec.ts
// Each file's header carries its own full rationale.
//
// `testMatch` deliberately keys on the `.manual.spec.ts` SUFFIX rather than
// naming each file: the naming convention is now the contract, so a future
// relocation is one correctly-named file and no config edit — and it cannot
// half-land as a spec that belongs here but silently runs nowhere.
//
// Structurally isolated from playwright.production.config.ts's `testMatch`
// — rather than an env-var self-skip inside that same config/job — so
// `npm run test:production` (what `post-deploy-verify` runs) can never pick
// these specs up even by accident; they only run via their own explicit
// command, `npm run test:production:manual`.
//
// No webServer: this, like playwright.production.config.ts, talks only to
// an already-deployed real URL over the network.
export default defineConfig({
	testDir: './tests',
	testMatch: /\.manual\.spec\.ts/,
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
