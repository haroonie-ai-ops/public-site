import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
	],
	webServer: {
		command: 'npm run dev',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
		// Astro 7.2+ auto-detects an AI coding agent and runs `astro dev` as a
		// detached background daemon, which exits the foreground process
		// Playwright is watching and surfaces as "Process from config.webServer
		// exited early." Force foreground mode so webServer's own lifecycle
		// management (start/health-check/teardown) actually applies.
		// See QA-001 Finding 1 — confirmed empirically, not just per Astro docs.
		env: { ASTRO_DEV_BACKGROUND: '0' },
	},
});
