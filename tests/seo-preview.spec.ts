import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';
import { makeBuildOutDir, removeBuildOutDir } from './support/build-output';

// These checks run only against the `static-preview` project (see
// playwright.config.ts), which serves the real `astro build` output via
// `astro preview` rather than the dev server — QA-001 (Wave 1) found real
// behaviour differences between the two, and R-4.2/R-4.4 are specifically
// about what the production static host serves.

const SITE = 'https://www.haroonie.ai';

test.describe('sitemap and robots.txt in the built preview (R-4.2, R-4.4)', () => {
	test('robots.txt is served, allows crawling, and references the sitemap (production build)', async ({
		request,
	}) => {
		const response = await request.get('/robots.txt');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('text/plain');

		const body = await response.text();
		expect(body).not.toContain('Disallow: /');
		expect(body).toContain('Sitemap: https://www.haroonie.ai/sitemap-index.xml');
	});

	test('the sitemap index is served and points at a sitemap', async ({ request }) => {
		const response = await request.get('/sitemap-index.xml');
		expect(response.status()).toBe(200);

		const body = await response.text();
		expect(body).toContain('<sitemapindex');
		expect(body).toContain('sitemap-0.xml');
	});

	test('the sitemap lists every public page and excludes the 404', async ({ request }) => {
		const response = await request.get('/sitemap-0.xml');
		expect(response.status()).toBe(200);

		const body = await response.text();
		for (const route of allRoutes) {
			expect(body).toContain(`<loc>${SITE}${route.path}</loc>`);
		}
		expect(body).not.toContain('/404');
	});
});

test.describe('non-indexable preview builds (R-4.4)', () => {
	// Each test here spawns a real `astro build`. `--outDir` only redirects
	// the final output — the intermediate prerender cache
	// (`.astro/.prerender/`) is still shared at the project root regardless
	// of `--outDir`, so two of these builds racing in parallel corrupt each
	// other's cache (observed directly: `ERR_MODULE_NOT_FOUND` on a chunk
	// another concurrent build had already rewritten). Serial mode avoids
	// that without weakening any assertion.
	test.describe.configure({ mode: 'serial' });

	test('a build with SITE_ENV=preview disallows all crawling in its robots.txt', async () => {
		const outDir = makeBuildOutDir();
		try {
			execSync(`npm run build -- --outDir "${outDir}"`, {
				cwd: process.cwd(),
				env: { ...process.env, SITE_ENV: 'preview' },
				stdio: 'pipe',
				// A hung child process blocks execSync's synchronous wait,
				// which blocks Node's single event loop thread — Playwright's
				// own test-timeout mechanism cannot intervene at all in that
				// state, since it relies on that same event loop to fire a
				// timer. This bounds the failure mode: a genuinely stuck
				// build now fails this test loudly after 60s instead of
				// hanging the whole CI job indefinitely (observed directly:
				// a real CI run stuck on this step for 25+ minutes with no
				// way to distinguish "slow" from "hung" until this fix).
				timeout: 60_000,
			});

			const robots = readFileSync(join(outDir, 'robots.txt'), 'utf-8');
			expect(robots).toContain('Disallow: /');
		} finally {
			removeBuildOutDir(outDir);
		}
	});

	// QA-002 Probe 2: SITE_ENV is compared case-insensitively, so a build
	// pipeline that sets an unexpected case doesn't accidentally de-index
	// production. This must never flip the other way (a typo'd/unrecognised
	// value must still de-index) — see the sibling test below.
	test('a build with SITE_ENV=Production (mixed case) still allows crawling', async () => {
		const outDir = makeBuildOutDir();
		try {
			execSync(`npm run build -- --outDir "${outDir}"`, {
				cwd: process.cwd(),
				env: { ...process.env, SITE_ENV: 'Production' },
				stdio: 'pipe',
				timeout: 60_000, // see the comment on the first execSync above
			});

			const robots = readFileSync(join(outDir, 'robots.txt'), 'utf-8');
			expect(robots).not.toContain('Disallow: /');
			expect(robots).toContain('Sitemap: https://www.haroonie.ai/sitemap-index.xml');
		} finally {
			removeBuildOutDir(outDir);
		}
	});

	test('a build with an unrecognised SITE_ENV value still disallows crawling (fails safe)', async () => {
		const outDir = makeBuildOutDir();
		try {
			execSync(`npm run build -- --outDir "${outDir}"`, {
				cwd: process.cwd(),
				env: { ...process.env, SITE_ENV: 'staging' },
				stdio: 'pipe',
				timeout: 60_000, // see the comment on the first execSync above
			});

			const robots = readFileSync(join(outDir, 'robots.txt'), 'utf-8');
			expect(robots).toContain('Disallow: /');
		} finally {
			removeBuildOutDir(outDir);
		}
	});

	// Temporary E6 gate (owner decision, 2026-09-13, per PM-002) — see the
	// "TEMPORARY E6 GATE" comment on deploy-production's Build step in
	// .github/workflows/ci-cd.yml. That job now sets SITE_ENV=prelaunch
	// specifically (a distinct value from SITE_ENV=preview, which has its
	// own R-4.4 meaning for PR previews) so the *production* deploy stays
	// non-indexable while placeholder content remains open. This proves
	// that exact configured value, not just "some unrecognised value"
	// (already covered by the SITE_ENV=staging test above) — if a future
	// edit changes the workflow's literal string without updating this
	// test, this is what catches the drift.
	test('a build with SITE_ENV=prelaunch (the production E6 gate) disallows all crawling', async () => {
		const outDir = makeBuildOutDir();
		try {
			execSync(`npm run build -- --outDir "${outDir}"`, {
				cwd: process.cwd(),
				env: { ...process.env, SITE_ENV: 'prelaunch' },
				stdio: 'pipe',
				timeout: 60_000, // see the comment on the first execSync above
			});

			const robots = readFileSync(join(outDir, 'robots.txt'), 'utf-8');
			expect(robots).toContain('Disallow: /');
		} finally {
			removeBuildOutDir(outDir);
		}
	});

	// R-2.8 AC1 — "Given a copy change, When only a Markdown file is
	// edited, Then the rendered page reflects the change after a rebuild."
	// Proven directly here rather than just by architectural inspection:
	// edit the Home content collection's Markdown file on disk, rebuild,
	// and assert the new heading text — not the old one — appears in the
	// built output, with no `.astro` component touched. Grouped into this
	// same serial describe block (not a new file) because it spawns a real
	// `astro build`, which — per the comment above — corrupts a
	// concurrently-running build's shared `.astro/.prerender` cache; the
	// content file is restored in `finally` even if the assertion throws,
	// so a failure here can't corrupt the working tree for other tests.
	test('editing only a Markdown content file changes the rendered page after a rebuild', async () => {
		const contentPath = join(process.cwd(), 'src/content/home/index.md');
		const original = readFileSync(contentPath, 'utf-8');
		const proofHeading = `R-2.8 proof heading ${Date.now()}`;
		const modified = original.replace(
			/^heading: .*$/m,
			`heading: "${proofHeading}"`,
		);
		expect(modified, 'the heading frontmatter field must have been found and replaced').not.toBe(
			original,
		);

		const outDir = makeBuildOutDir();
		try {
			writeFileSync(contentPath, modified);
			execSync(`npm run build -- --outDir "${outDir}"`, {
				cwd: process.cwd(),
				stdio: 'pipe',
				timeout: 60_000, // see the comment on the first execSync above
			});

			const html = readFileSync(join(outDir, 'index.html'), 'utf-8');
			expect(html).toContain(proofHeading);
		} finally {
			writeFileSync(contentPath, original);
			removeBuildOutDir(outDir);
		}
	});
});

test.describe('per-page metadata on the built output (R-4.1)', () => {
	for (const route of allRoutes) {
		test(`${route.path} serves a title, description and canonical link`, async ({ page }) => {
			const response = await page.goto(route.path);
			expect(response?.status()).toBe(200);

			await expect(page).toHaveTitle(/.+/);
			await expect(page.locator('meta[name="description"]')).toHaveAttribute(
				'content',
				/.+/,
			);
			await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
				'href',
				`${SITE}${route.path}`,
			);
		});
	}
});

// QA-004 (PRODUCT_DEFECT, High): the Privacy and Terms pages rendered a
// repository file path (`status/placeholder-content.md`), an internal role
// name ("Project Manager"), and an internal escalation ID into visitor-
// facing copy — confirmed live on the PR's own Cloudflare Pages preview,
// not just locally. No test in the suite caught it (`tests/legal.spec.ts`
// only asserts the four required sections are non-empty). This asserts
// against the actual built HTML in `dist/` — what Cloudflare Pages actually
// serves, per this file's own project rationale above, not the dev server
// — across every page, not just the two the Tester happened to name, since
// the same class of leak (internal req/escalation IDs, a repository path)
// was also present in About's and Services' rendered body copy, and in a
// raw HTML comment in Contact's markup.
//
// QA-004 Finding 2 (TEST_DEFECT, Medium — independent Tester regression
// review, 2026-09-12/13): the pattern list below originally covered only
// the exact strings that happened to leak, not the general class of
// "internal program artifact in visitor copy" the test's own doc-comment
// above claims to guard against. The Tester proved this by injecting five
// synthetic same-class probes into otherwise-clean fixed content — an
// internal requirement ID, a plan-document name, an internal-actor phrase,
// and a PR number — and all five shipped into `dist/` undetected. The
// patterns below were broadened in response to cover program document IDs,
// requirement/AC identifiers, wave references, and PR/issue references —
// the class, not just the instances — each one verified (by the same
// inject-and-check method that exposed the gap) to both catch a same-class
// probe and not fire on any of the six real pages' actual content.
test.describe('no internal program artifacts in rendered page content (QA-004 regression)', () => {
	const BANNED_PATTERNS: { label: string; pattern: RegExp }[] = [
		{ label: 'repository path reference (status/...)', pattern: /status\/[\w.-]+/i },
		{ label: 'markdown file reference (*.md)', pattern: /\b[\w-]+\.md\b/i },
		{ label: 'internal role name: Project Manager', pattern: /Project Manager/i },
		{ label: 'internal role name: Business Analyst', pattern: /Business Analyst/i },
		{ label: 'internal role name: Tester', pattern: /\bTester\b/ },
		{ label: 'internal role name: Wave <n> Engineer', pattern: /Wave\s*\d+[a-z]?\s*Engineer/i },
		{ label: 'escalation ID (E1-E9)', pattern: /\bE[1-9]\b/ },
		{ label: 'process vocabulary: agent-drafted', pattern: /agent-drafted/i },
		{ label: 'process vocabulary: boilerplate pending', pattern: /boilerplate pending/i },
		{ label: 'process vocabulary: placeholder register', pattern: /placeholder register/i },

		// --- Finding 2 additions: the class, not the instances ---

		// Program document IDs. Each prefix is a distinctive, hyphenated,
		// all-caps token this program actually uses for its own status/
		// requirements docs (REQ-001, PLAN-001, QA-001..004, ADR-*,
		// PM-001/002) — none of these are plausible in ordinary marketing,
		// legal, or contact copy for a tech consulting site, so requiring
		// the literal prefix keeps false-positive risk close to zero.
		{ label: 'program document ID: REQ-NNN', pattern: /\bREQ-\d+\b/ },
		{ label: 'program document ID: PLAN-NNN', pattern: /\bPLAN-\d+\b/ },
		{ label: 'program document ID: QA-NNN', pattern: /\bQA-\d+\b/ },
		{ label: 'program document ID: ADR-NNN', pattern: /\bADR-\d+\b/ },
		// PM-NNN is this repo's own convention for Project Manager status
		// docs (status/PM-001-*.md, PM-002-*.md) — added beyond QA-004's
		// literal instruction because it's the identical document-ID class
		// already in use here. Small acknowledged residual risk: "PM2.5"/
		// "PM 2.5" (air-quality) is a real-world usage of "PM" + a number,
		// but the hyphenated "PM-<digits>" form this pattern requires is
		// not how that's conventionally written, and this site has no
		// plausible reason to discuss air quality.
		{ label: 'program document ID: PM-NNN', pattern: /\bPM-\d+\b/ },

		// Requirement/acceptance-criterion identifiers. "R-<n>.<n>" (e.g.
		// R-2.3, R-6.1) requires a capital R, a hyphen, and two dot-
		// separated digit groups — not a pattern ordinary prose or a
		// version string ("v2.3") produces. "AC<n>" (e.g. AC1, AC2) is
		// slightly more likely to collide with real English in principle
		// (air conditioning, alternating current), so it's deliberately
		// capped at 1-2 digits to match this program's actual AC1-AC9-ish
		// numbering rather than an open-ended \d+, and checked against all
		// six real pages below to confirm it doesn't fire in practice.
		{ label: 'requirement identifier (R-n.n)', pattern: /\bR-\d+\.\d+\b/ },
		{ label: 'acceptance-criterion identifier (ACn)', pattern: /\bAC\d{1,2}\b/ },

		// Wave references. Deliberately scoped to "Wave" immediately
		// followed by a digit (optionally a lowercase letter, matching
		// this program's own "2a"/"2b" sub-wave convention) rather than
		// banning the bare word "Wave" — a tech-consulting site plausibly
		// uses "wave" on its own (e.g. "a new wave of AI adoption"), but
		// "Wave" paired directly with a digit is specific to this
		// program's internal wave-numbering scheme, not ordinary usage.
		// Acknowledged residual risk, not eliminated: a future real page
		// describing a client's own "Wave 3 rollout" would also match this
		// and would need a narrower fix at that time, not before.
		{ label: 'internal wave reference (Wave <n>)', pattern: /\bWave\s?\d+[a-z]?\b/i },

		// Internal PR/issue references — "PR #3", "PR#3", "issue #42".
		// The "#<digits>" requirement makes this specific to a tracker
		// reference; plain "PR" (public relations) or "issue" (a problem,
		// a magazine issue) alone are common English words and are
		// intentionally NOT banned on their own.
		{ label: 'internal PR/issue reference', pattern: /\b(?:PR|issue)\s?#\d+\b/i },

		// Internal-actor phrases beyond the four role names already above.
		// Case-sensitive and capitalized ("the Engineer", not "the
		// engineer") specifically because this program capitalizes role
		// titles when used as internal-process shorthand, while ordinary
		// flowing prose about an engineer (a bio, a services blurb) would
		// not capitalize the common noun mid-sentence. Deliberately NOT
		// included: a bare "the owner" pattern — a small business's own
		// About-page bio plausibly and legitimately says "the owner
		// founded this company in ..."; banning that phrase risks a false
		// positive on exactly the kind of real content this site needs to
		// ship, so it's left out rather than silently degrading coverage
		// elsewhere to compensate.
		{ label: 'internal-actor phrase: coordinating session', pattern: /coordinating session/i },
		{ label: 'internal-actor phrase: the Engineer', pattern: /\bthe Engineer\b/ },
	];

	for (const route of allRoutes) {
		test(`${route.path} built output contains no internal program artifacts`, () => {
			const segments = route.path.split('/').filter(Boolean);
			const filePath = join(process.cwd(), 'dist', ...segments, 'index.html');
			const html = readFileSync(filePath, 'utf-8');

			for (const { label, pattern } of BANNED_PATTERNS) {
				const match = html.match(pattern);
				expect(
					match,
					`${route.path} built output must not contain ${label}${match ? ` — found "${match[0]}"` : ''}`,
				).toBeNull();
			}
		});
	}
});
