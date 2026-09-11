import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PW_PORT ?? 4321);
const baseURL = `http://localhost:${PORT}`;

// A second server, serving the actual built static output (`astro build` +
// `astro preview`), not the dev server. QA-001 (Wave 1) found real behaviour
// differences between the two (404 status codes only matched on the built
// output), so anything that depends on what Cloudflare Pages will actually
// serve — the sitemap and robots.txt endpoints (R-4.2-R-4.4) in particular —
// is verified against this server, not `astro dev`.
const PREVIEW_PORT = Number(process.env.PW_PREVIEW_PORT ?? 4322);
const previewBaseURL = `http://localhost:${PREVIEW_PORT}`;

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
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			testIgnore: /seo-preview\.spec\.ts/,
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
			testIgnore: /seo-preview\.spec\.ts/,
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
			testIgnore: /seo-preview\.spec\.ts/,
		},
		{
			name: 'static-preview',
			use: { ...devices['Desktop Chrome'], baseURL: previewBaseURL },
			testMatch: /seo-preview\.spec\.ts/,
		},
	],
	webServer: [
		{
			command: `npm run dev -- --port ${PORT}`,
			url: baseURL,
			reuseExistingServer: false,
			timeout: 60_000,
			// Astro 7.2+ auto-detects an AI coding agent and runs `astro dev` as a
			// detached background daemon, which exits the foreground process
			// Playwright is watching and surfaces as "Process from config.webServer
			// exited early." Force foreground mode so webServer's own lifecycle
			// management (start/health-check/teardown) actually applies.
			// See QA-001 Finding 1 — confirmed empirically, not just per Astro docs.
			env: { ASTRO_DEV_BACKGROUND: '0' },
		},
		{
			command: `npm run build && npm run preview -- --port ${PREVIEW_PORT}`,
			url: previewBaseURL,
			reuseExistingServer: false,
			timeout: 120_000,
			// `astro preview` has its own, separate AI-agent auto-background
			// detection (distinct env var from `astro dev`'s — confirmed by
			// reading node_modules/astro/dist/cli/preview/index.js: it checks
			// ASTRO_PREVIEW_BACKGROUND, not ASTRO_DEV_BACKGROUND). Without this,
			// `astro preview` detaches into a background daemon tracked by its
			// own lock file, the foreground process Playwright is watching
			// exits, and webServer reports "exited early" — the same failure
			// mode as QA-001 Finding 1, one CLI command over.
			env: { ASTRO_PREVIEW_BACKGROUND: '0' },
		},
	],
});
