import { defineConfig, devices } from '@playwright/test';
import { LIGHTHOUSE_CDP_PORT } from './tests/support/ports';

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
			// Wave 6 additions below all depend on the *built* static output
			// (accurate JS-transfer accounting, a real Lighthouse run, and
			// production-representative console/layout behaviour — the dev
			// server injects Vite/Astro HMR client scripts and dev-only
			// warnings that would never ship, so counting or reading console
			// output from it would misrepresent what Cloudflare Pages actually
			// serves). Each has its own project against `previewBaseURL`
			// below, so it must not also run here against the dev server.
			// REQ-001-A2 / R-7.8 — also ignore the production-hostname suites
			// here: they talk to a real, already-deployed URL over the network
			// and must never join this fast, deployment-independent pre-merge
			// gate (R-7.8 AC6). They run only under
			// playwright.production.config.ts (`npm run test:production`).
			//
			// Matched by PATTERN (`production-*.spec.ts`), not by listing each
			// filename. R-6.4's smoke suite was added in Wave 7 and silently
			// joined this gate because the list named only its sibling - 24
			// test instances would have hit live production on every pre-merge
			// run. The naming convention is now the contract.
			testIgnore: /seo-preview\.spec\.ts|cross-browser\.spec\.ts|lighthouse\.spec\.ts|production-[a-z-]+\.spec\.ts|keyboard-focus\.spec\.ts|csp-nonce-failsafe\.spec\.ts|service-icons\.spec\.ts|\.manual\.spec\.ts/,
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
			// REQ-001-A2 / R-7.8 — also ignore the production-hostname suites
			// here: they talk to a real, already-deployed URL over the network
			// and must never join this fast, deployment-independent pre-merge
			// gate (R-7.8 AC6). They run only under
			// playwright.production.config.ts (`npm run test:production`).
			//
			// Matched by PATTERN (`production-*.spec.ts`), not by listing each
			// filename. R-6.4's smoke suite was added in Wave 7 and silently
			// joined this gate because the list named only its sibling - 24
			// test instances would have hit live production on every pre-merge
			// run. The naming convention is now the contract.
			testIgnore: /seo-preview\.spec\.ts|cross-browser\.spec\.ts|lighthouse\.spec\.ts|production-[a-z-]+\.spec\.ts|keyboard-focus\.spec\.ts|csp-nonce-failsafe\.spec\.ts|service-icons\.spec\.ts|\.manual\.spec\.ts/,
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
			// REQ-001-A2 / R-7.8 — also ignore the production-hostname suites
			// here: they talk to a real, already-deployed URL over the network
			// and must never join this fast, deployment-independent pre-merge
			// gate (R-7.8 AC6). They run only under
			// playwright.production.config.ts (`npm run test:production`).
			//
			// Matched by PATTERN (`production-*.spec.ts`), not by listing each
			// filename. R-6.4's smoke suite was added in Wave 7 and silently
			// joined this gate because the list named only its sibling - 24
			// test instances would have hit live production on every pre-merge
			// run. The naming convention is now the contract.
			testIgnore: /seo-preview\.spec\.ts|cross-browser\.spec\.ts|lighthouse\.spec\.ts|production-[a-z-]+\.spec\.ts|keyboard-focus\.spec\.ts|csp-nonce-failsafe\.spec\.ts|service-icons\.spec\.ts|\.manual\.spec\.ts/,
		},
		{
			name: 'static-preview',
			use: { ...devices['Desktop Chrome'], baseURL: previewBaseURL },
			// service-icons.spec.ts joins this project rather than the dev-server
			// ones for the same reason seo-preview.spec.ts does: it asserts that
			// the page ships no JavaScript, and `astro dev` injects Vite/Astro
			// HMR client scripts that never reach production. Asserted against
			// the dev server it would fail on scripts that do not exist in the
			// build.
			// keyboard-focus.spec.ts joins this project for the same reason the
			// others did, and it learned it the hard way: run against `astro
			// dev`, it picked up the DEV TOOLBAR's own buttons (Menu, Inspect,
			// Audit, Settings) as unreachable interactive elements, and raced
			// the HMR client's reload. Neither exists in the build a visitor
			// gets. A spec about what ships must run against what ships.
			testMatch: /seo-preview\.spec\.ts|service-icons\.spec\.ts|keyboard-focus\.spec\.ts/,
		},
		// Wave 6 (R-5.3): cross-browser layout/console-error pass, one project
		// per engine, all against the built static output via `previewBaseURL`
		// — the same reasoning as `static-preview` above, generalised to all
		// three engines instead of just Chromium.
		{
			name: 'cross-browser-chromium',
			use: { ...devices['Desktop Chrome'], baseURL: previewBaseURL },
			testMatch: /cross-browser\.spec\.ts/,
		},
		{
			name: 'cross-browser-firefox',
			use: { ...devices['Desktop Firefox'], baseURL: previewBaseURL },
			testMatch: /cross-browser\.spec\.ts/,
		},
		{
			name: 'cross-browser-webkit',
			use: { ...devices['Desktop Safari'], baseURL: previewBaseURL },
			testMatch: /cross-browser\.spec\.ts/,
		},
		// Wave 6 (R-5.2 AC1): a dedicated project so the fixed
		// `--remote-debugging-port` launch arg (needed by playwright-lighthouse
		// to attach to this exact browser instance) is scoped only to
		// `lighthouse.spec.ts` and never applied to any other project's
		// browser. Runs against the built static output for the same reason
		// as `static-preview`/`cross-browser-*` above — Lighthouse must score
		// what Cloudflare Pages actually serves, not the dev server. This
		// project's spec deliberately contains exactly one test (the
		// production home page, per R-5.2 AC1's own scope) so it never needs
		// more than one worker and can never race itself for the fixed port.
		{
			name: 'lighthouse',
			use: {
				...devices['Desktop Chrome'],
				baseURL: previewBaseURL,
				launchOptions: { args: [`--remote-debugging-port=${LIGHTHOUSE_CDP_PORT}`] },
			},
			testMatch: /lighthouse\.spec\.ts/,
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
			command: `npm run build && npm run preview -- --port ${PREVIEW_PORT} --ignore-lock`,
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
			//
			// --ignore-lock (QA-002 Finding 2): `astro preview`'s concurrency
			// lock (node_modules/astro/dist/core/dev/lockfile.js) is keyed on
			// the project ROOT directory, never on --port, so any second
			// `astro preview` invocation from this working directory — on any
			// port — refuses to start while *any* prior preview process is
			// still alive here, orphaned or not. Reproduced directly (no crash
			// needed): started `astro preview --port 4362` in the foreground,
			// left it running, then ran `astro preview --port 4363` from the
			// same directory — it was refused with "Another astro preview
			// server is already running", pointing at the still-live PID on
			// 4362, even though 4363 was completely free.
			//
			// `--force` (the CLI's own suggested remedy, and QA-002's
			// suggestion) was tested and rejected: reading
			// dist/cli/preview/index.js (Astro 7.3.2) shows `--force` is never
			// actually wired up for `astro preview` — only `astro dev --force`
			// calls killDevServer(); `astro preview --port 4363 --force` was
			// run against the same live 4362 process above and still refused
			// to start, so it doesn't even do what its own error message
			// implies in this Astro version. And even where Astro *does*
			// implement `--force` (`astro dev`), it kills whatever PID its own
			// (single, root-scoped) liveness check believes is alive with no
			// re-verification — if two agents ever shared this directory with
			// two genuinely live preview servers, `--force` would silently
			// kill the other agent's real server. We don't want that risk even
			// if a future Astro version wires `--force` up for `preview` too.
			//
			// `--ignore-lock` instead makes this webServer entry start its own
			// server on its own port without ever reading or writing the lock
			// file — it cannot block on someone else's lock, and it cannot
			// kill anyone else's process, because it never inspects or signals
			// any other PID. Verified: with server A left running on 4362,
			// `astro preview --port 4363 --ignore-lock` started cleanly
			// alongside it, both served 200s, and A's lock/PID were untouched.
			// The tradeoff, accepted deliberately: an instance started this
			// way isn't tracked by `astro preview stop/status/logs` — fine
			// here, since Playwright's own webServer lifecycle (not Astro's
			// lock) is what starts and tears down this process. Residual risk
			// carried forward, not fixed here: repeated crashes will still
			// accumulate untracked orphan processes over time, since nothing
			// external can find them via the lock file anymore. That's a
			// resource-hygiene concern for Wave 3 CI, not a correctness
			// regression — it's strictly better than every subsequent run
			// being blocked outright, and it never trades into the
			// cross-agent-kill hazard above.
			env: { ASTRO_PREVIEW_BACKGROUND: '0' },
		},
	],
});
