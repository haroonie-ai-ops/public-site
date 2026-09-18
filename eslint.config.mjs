// ESLint flat configuration — R-6.1 AC1's "lint" step.
//
// Why this file exists
// --------------------
// Through Waves 1-6, `npm run lint` was `astro check && tsc --noEmit` twice
// over: genuine, gating static analysis, but *type*-checking rather than
// linting. QA-003 Finding 1 raised that the acceptance criterion's letter was
// satisfied while its substance was narrower than "lint" conventionally
// promises. The owner resolved the ambiguity on 2026-09-17 by choosing the
// substantive option, verbatim:
//
//   "QA-003 Finding 1 — 'lint' means type-checking, have @engineer add a
//    real linter now."
//
// So this is *additive*. The two type-check passes stay in `npm run lint`
// exactly as they were — they catch real problems and genuinely gate the
// pipeline — and ESLint runs alongside them, not instead of them.
//
// Tool selection
// --------------
// ESLint 10 + typescript-eslint 8 + eslint-plugin-astro 3, with
// eslint-plugin-jsx-a11y-x for the accessibility rules. The `-x` fork rather
// than the original `eslint-plugin-jsx-a11y` for one concrete reason:
// jsx-a11y@6.10.2 declares `peerDependencies.eslint: "^3 || ... || ^9"` and
// therefore cannot be installed against ESLint 10 without
// `--legacy-peer-deps`, which would undermine R-6.7's clean, reproducible
// `npm ci`. jsx-a11y-x declares `^9 || ^10` and installs cleanly.
// eslint-plugin-astro lists both as *optional* peers and consumes whichever
// is present, so this is a supported configuration, not a workaround.
//
// Type-aware linting
// ------------------
// `.ts` files are linted with typescript-eslint's type-checked rule set.
// That is deliberately the most valuable half of this config: rules like
// `no-floating-promises` and `await-thenable` need the type graph and are
// exactly the class of defect `tsc --noEmit` does *not* report — a forgotten
// `await` in front of a Playwright `expect()` is well-typed and silently
// non-asserting. `.astro` files use the non-type-checked set, because the
// Astro parser does not participate in a TypeScript program.
//
// Ordering inside `npm run lint` is load-bearing
// ----------------------------------------------
// `eslint .` runs LAST, after `astro check`. `.astro/types.d.ts` is generated
// and git-ignored, and `astro:content` resolves through it; `astro check`
// generates it as a side effect. Running ESLint before that on a clean
// checkout does not fail honestly — it emits ~149 spurious
// `no-unsafe-*`/"type that cannot be resolved" errors in src/content.config.ts
// and src/lib/icons.ts, which look like real type-safety findings and are
// not. `npm run lint:eslint` exists for running ESLint alone and calls
// `astro sync` itself for the same reason.
//
// Why the ESLint dependencies are pinned to exact versions
// -------------------------------------------------------
// The rest of devDependencies uses carets. Linters are the one case where
// that is actively harmful: a patch or minor release can add rules to
// `recommended`, which turns a green pipeline red with no change to this
// repository's own code. `package-lock.json` + `npm ci` already make CI
// deterministic (R-6.7); the exact pins extend that to anyone who runs a
// plain `npm install`, and make a rule-set change an explicit, reviewable
// commit.
//
// This file is never emitted to the client bundle; ESLint and every plugin
// here are devDependencies only.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

export default tseslint.config(
	// ---------------------------------------------------------------
	// Never linted. Build output and generated types are not authored
	// source; test artefacts are transient.
	// ---------------------------------------------------------------
	{
		ignores: [
			'dist/**',
			'.astro/**',
			'node_modules/**',
			'test-results/**',
			'playwright-report/**',
			'playwright-report-production/**',
			'blob-report/**',
			'playwright/.cache/**',
			'.tmp-build-*/**',
			// Agent worktrees are full copies of this repository living inside
			// it. Without this, `eslint .` walks into every one and reports
			// findings against code that is not on the current branch and may
			// be many commits stale - 369 errors from 13 worktrees when this
			// was found, none of them from real source. CI never saw it
			// because it checks out fresh, which is exactly why local and CI
			// disagreed: the one place a developer runs lint by hand was the
			// one place it was unusable.
			'.claude/**',
		],
	},

	// ---------------------------------------------------------------
	// A suppression that suppresses nothing is worse than no comment at
	// all: it reads as a reviewed exception while silently protecting
	// against a rule that is not even on. The first run of this linter
	// found two such directives already in the tree, written against
	// rules this project had never enabled. `error`, not the default
	// `warn`, so they can never accumulate again.
	// ---------------------------------------------------------------
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'error',
		},
	},

	// ---------------------------------------------------------------
	// Baseline for everything ESLint looks at.
	// ---------------------------------------------------------------
	js.configs.recommended,

	// ---------------------------------------------------------------
	// Rules added on top of `recommended`, each for a stated reason.
	// ---------------------------------------------------------------
	{
		rules: {
			// The site ships 0 bytes of its own JavaScript (R-5.2 AC2), and
			// the Pages Function is on a request hot path — a stray
			// `console.log` in either is either dead weight or noise in a
			// Worker log. In the test suite, logging is occasionally the
			// point (evidence trails), and those sites carry an explicit
			// disable with a recorded reason. Enabling this rule produced
			// zero new findings; it makes the one pre-existing deliberate
			// exemption real rather than decorative.
			'no-console': 'error',
		},
	},

	// ---------------------------------------------------------------
	// Rules deliberately NOT enabled, recorded so the absence reads as a
	// decision rather than an oversight:
	//
	//   no-await-in-loop — flags 18 sites across the Playwright suite,
	//     every one of them correct. Driving a single `page` object is
	//     inherently sequential: `page.goto()` calls cannot be issued in
	//     parallel against the same page, and several suites await in a
	//     loop precisely to prove per-request behaviour rather than
	//     batched behaviour. Enabling it would mean 18 suppressions to
	//     silence a rule that is right about the general case and wrong
	//     about this codebase.
	//
	//   typescript-eslint's `strictTypeChecked` set — considered and not
	//     adopted for this first pass. `recommendedTypeChecked` already
	//     carries the rules that catch the defect class `tsc` misses;
	//     the strict set's additions are mostly stylistic here and would
	//     land as a large diff unrelated to the reason this linter was
	//     added.
	// ---------------------------------------------------------------

	// ---------------------------------------------------------------
	// TypeScript — type-aware. Covers src/**/*.ts, functions/**/*.ts,
	// tests/**/*.ts and the root playwright.*.config.ts files.
	// ---------------------------------------------------------------
	{
		files: ['**/*.ts'],
		extends: [tseslint.configs.recommendedTypeChecked],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},

	// ---------------------------------------------------------------
	// Astro components and pages, plus the accessibility rules. R-3.x
	// is an explicit accessibility requirement set, so a11y linting is
	// not decoration here — it is coverage of a stated requirement,
	// complementary to the axe-core assertions in
	// tests/accessibility.spec.ts (which check rendered pages; these
	// check authored source, including markup paths no test happens to
	// render).
	// ---------------------------------------------------------------
	astro.configs['flat/recommended'],
	astro.configs['flat/jsx-a11y-recommended'],

	// ---------------------------------------------------------------
	// Plain ESM config files at the repository root (astro.config.mjs,
	// this file). Not part of a TypeScript program, so type-aware rules
	// must not be applied to them.
	// ---------------------------------------------------------------
	{
		files: ['**/*.mjs'],
		languageOptions: {
			globals: globals.node,
		},
	},

	// ---------------------------------------------------------------
	// Node-side sources: Playwright specs and their support helpers,
	// the Playwright configs, and Astro endpoint/config modules that
	// run at build time.
	// ---------------------------------------------------------------
	{
		files: ['tests/**/*.ts', 'playwright*.config.ts', 'src/content.config.ts'],
		languageOptions: {
			globals: globals.node,
		},
	},

	// ---------------------------------------------------------------
	// scripts/ holds command-line tools, not shipped code. Their entire
	// purpose is to print to a terminal - the traceability generator
	// reports what it wrote and why a check failed, and the production
	// Lighthouse audit's output IS its result. `no-console` is on for the
	// rest of the repository because a stray log in a page or a spec is
	// almost always debris; here it is the interface.
	// ---------------------------------------------------------------
	{
		files: ['scripts/**/*.mjs'],
		rules: {
			'no-console': 'off',
		},
	},

	// ---------------------------------------------------------------
	// Cloudflare Pages Functions run on workerd, not Node: no `process`,
	// no `Buffer`, but the full web platform including `crypto`.
	// ---------------------------------------------------------------
	{
		files: ['functions/**/*.ts'],
		languageOptions: {
			globals: globals.worker,
		},
	},
);
