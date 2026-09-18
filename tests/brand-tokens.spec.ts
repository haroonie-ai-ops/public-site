import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test, expect } from '@playwright/test';
import { allRoutes } from './support/routes';
import { ratioBetween } from './support/contrast';

// REQ-001 R-9.1 and R-9.2 say brand values have ONE source and that every
// page resolves through it. R-9.1's own "verified by" clause asks for two
// different kinds of check, and this file carries both:
//
//   - AC2 by a repository scan, "in the same class as R-1.4's secret scan";
//   - AC1 and AC3 by Playwright reading computed styles.
//
// R-9.5 AC4's 3:1 for informative non-text UI is here too, because nothing
// else in the suite can cover it: axe computes `color-contrast` for TEXT
// only and does not attempt SC 1.4.11 at all, so a form-field border or an
// active-nav indicator at 1.3:1 passes every existing gate silently. One
// did — see the contact page's frontmatter for the border that shipped at
// 1.26:1 until these ratios were computed.

const SRC = join(process.cwd(), 'src');
const TOKEN_SOURCE = join(SRC, 'layouts', 'BaseLayout.astro');

function astroFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const full = join(dir, name);
		if (statSync(full).isDirectory()) return astroFiles(full);
		return name.endsWith('.astro') ? [full] : [];
	});
}

/**
 * Everything a browser is actually served from a `.astro` file: the
 * frontmatter fence is compile-time only and never reaches the client, so
 * an internal note or a computed ratio written there is not a declaration.
 */
function clientFacingSource(file: string): string {
	const raw = readFileSync(file, 'utf-8');
	const fence = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
	const body = fence ? raw.slice(fence[0].length) : raw;
	// CSS and HTML comments are prose about declarations, not declarations.
	// (They DO ship to the client, which is a separate concern the QA-004
	// regression test in seo-preview.spec.ts owns.)
	return body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * The token source's own definitions — the `:root` block and the
 * `@font-face` rule — are the one place literals are allowed to exist.
 * Removing exactly those two regions is what turns "find every literal"
 * into "find every literal that is NOT the single source".
 */
function outsideTheTokenSource(file: string): string {
	let css = clientFacingSource(file);
	if (file !== TOKEN_SOURCE) return css;

	css = css.replace(/@font-face\s*\{[^}]*\}/g, '');
	css = css.replace(/:root\s*\{[^}]*\}/g, '');
	return css;
}

test.describe('brand values have a single source (R-9.1 AC2)', () => {
	const files = astroFiles(SRC);

	test('the repository contains .astro files to scan', () => {
		// Guards the scan itself: a glob that silently matches nothing would
		// make every assertion below vacuously true.
		expect(files.length).toBeGreaterThan(5);
	});

	test('no colour literal appears outside the token source', () => {
		const offenders: string[] = [];

		for (const file of files) {
			const css = outsideTheTokenSource(file);
			const matches = [
				...css.matchAll(/#[0-9a-f]{3,8}\b/gi),
				...css.matchAll(/\b(?:rgba?|hsla?)\s*\(/gi),
			];
			for (const match of matches) {
				offenders.push(`${relative(process.cwd(), file)}: ${match[0]}`);
			}
		}

		expect(
			offenders,
			`colour literals must be declared only in the :root token block of ${relative(process.cwd(), TOKEN_SOURCE)}:\n${offenders.join('\n')}`,
		).toEqual([]);
	});

	test('no font-family is declared with anything but a token reference', () => {
		const offenders: string[] = [];

		for (const file of files) {
			const css = outsideTheTokenSource(file);
			for (const match of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
				// `font-family: var(--font-sans)` is the token being applied,
				// which is the point of having one. A literal family name is
				// a component declaring its own typeface, which is not.
				if (!/^var\(\s*--/.test(match[1].trim())) {
					offenders.push(`${relative(process.cwd(), file)}: font-family: ${match[1].trim()}`);
				}
			}
		}

		expect(
			offenders,
			`font families must be referenced through a token:\n${offenders.join('\n')}`,
		).toEqual([]);
	});

	test('each palette value is written exactly once in the whole source tree', () => {
		// The complement of the scan above. That one proves no OTHER file
		// declares a literal; this proves the token source does not declare
		// the same value twice either — two copies of the brand blue would
		// satisfy "no literals elsewhere" and still defeat AC1's "change it
		// in one place".
		const palette = ['#0a2a87', '#155bef', '#2e83ff', '#66b4ff', '#f5f8ff'];
		const allCss = files.map((file) => clientFacingSource(file)).join('\n');

		for (const value of palette) {
			const occurrences = allCss.toLowerCase().split(value).length - 1;
			expect(occurrences, `${value} must be declared exactly once`).toBe(1);
		}
	});
});

test.describe('every page resolves brand values through the tokens (R-9.1 AC1/AC3, R-9.2 AC1)', () => {
	for (const route of allRoutes) {
		test(`${route.path} renders headings and body text in the token font stack`, async ({
			page,
		}) => {
			await page.goto(route.path);

			const firstFamily = (selector: string) =>
				page.locator(selector).first().evaluate((element) =>
					getComputedStyle(element)
						.fontFamily.split(',')[0]
						.trim()
						.replace(/^["']|["']$/g, ''),
				);

			expect(await firstFamily('h1')).toBe('Manrope');
			expect(await firstFamily('p')).toBe('Manrope');
		});

		test(`${route.path} repaints when the token source's brand colour changes`, async ({
			page,
		}) => {
			// Links carry a colour transition, so a computed value read in the
			// same tick as the override is the value the transition STARTED
			// from, not the one it is heading to — which is a property of the
			// animation, not of the token wiring this test is about. Asking
			// for reduced motion is how the site itself turns transitions off
			// (see BaseLayout's prefers-reduced-motion block), so this uses
			// real shipped behaviour rather than injecting test-only CSS; the
			// polls below then absorb the remaining frame. Found in Firefox,
			// which reported `a.brand` mid-transition on five of six routes.
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(route.path);

			// AC1 in its own terms: change the token source's value for the
			// primary brand colour, change nothing else, and every page that
			// renders that colour must reflect the new one — with the old
			// value surviving nowhere. Done here by overriding the custom
			// property on :root rather than by editing the file and
			// rebuilding: a custom property IS the propagation mechanism, so
			// this exercises the real cascade, and it does it without
			// mutating a tracked file underneath a suite that is running in
			// three browsers at once.
			const OLD_NAVY = 'rgb(10, 42, 135)';
			const PROBE = 'rgb(200, 30, 90)';

			const before = await page
				.getByRole('heading', { level: 1 })
				.evaluate((element) => getComputedStyle(element).color);
			expect(before, 'h1 must render the brand navy before the override').toBe(OLD_NAVY);

			await page.evaluate((probe) => {
				document.documentElement.style.setProperty('--brand-navy', probe);
			}, PROBE);

			await expect
				.poll(
					() =>
						page
							.getByRole('heading', { level: 1 })
							.evaluate((element) => getComputedStyle(element).color),
					{ message: 'h1 must follow the token, not a copy of its value' },
				)
				.toBe(PROBE);

			// ...and nothing anywhere on the page is still painting the old
			// value out of a literal. box-shadow is deliberately excluded:
			// the elevation tokens carry their own navy-tinted rgba() inside
			// the token block, which is permitted there and is not "rendering
			// the brand colour" in AC1's sense.
			const findSurvivors = () =>
				page.evaluate((oldValue) => {
					const properties = [
						'color',
						'backgroundColor',
						'borderTopColor',
						'borderRightColor',
						'borderBottomColor',
						'borderLeftColor',
						'outlineColor',
						'textDecorationColor',
						'caretColor',
					] as const;
	
					return [...document.querySelectorAll('*')]
						.filter((element) => {
							const styles = getComputedStyle(element);
							return properties.some((property) => {
								if (styles[property] !== oldValue) return false;
								// A transparent or zero-width border still reports a
								// colour; it paints nothing, so it is not a survivor.
								if (property.startsWith('border')) {
									const side = property.replace('border', '').replace('Color', '');
									return Number.parseFloat(
										styles.getPropertyValue(`border-${side.toLowerCase()}-width`),
									) > 0;
								}
								return true;
							});
						})
						.map((element) => {
							const classes = element.getAttribute('class');
							return element.tagName.toLowerCase() + (classes ? `.${classes}` : '');
						});
				}, OLD_NAVY);

			await expect
				.poll(findSurvivors, {
					message:
						'these elements still render the pre-change brand colour, so they are not reading the token',
				})
				.toEqual([]);
		});
	}
});

test.describe('informative non-text UI meets 3:1 (R-9.5 AC4)', () => {
	// Not covered by axe at all — see this file's header comment.
	const MINIMUM = 3;

	test('every enquiry form field border is distinguishable from the page', async ({ page }) => {
		await page.goto('/contact/');

		const fields = page.locator('#contact-name, #contact-email, #contact-message');
		await expect(fields).toHaveCount(3);

		for (let index = 0; index < 3; index += 1) {
			const measured = await fields.nth(index).evaluate((element) => {
				const styles = getComputedStyle(element);
				let node: HTMLElement | null = element.parentElement;
				let behind = 'rgba(0, 0, 0, 0)';
				while (node) {
					const candidate = getComputedStyle(node).backgroundColor;
					if (candidate !== 'rgba(0, 0, 0, 0)' && candidate !== 'transparent') {
						behind = candidate;
						break;
					}
					node = node.parentElement;
				}
				return {
					id: element.id,
					border: styles.borderTopColor,
					width: Number.parseFloat(styles.borderTopWidth),
					behind,
				};
			});

			expect(measured.width, `${measured.id} must have a visible border`).toBeGreaterThan(0);
			const ratio = ratioBetween(measured.border, measured.behind);
			expect(
				Number(ratio.toFixed(2)),
				`${measured.id} border ${measured.border} on ${measured.behind}`,
			).toBeGreaterThanOrEqual(MINIMUM);
		}
	});

	for (const route of allRoutes) {
		test(`${route.path} draws a focus indicator that clears 3:1`, async ({ page }) => {
			await page.goto(route.path);

			const measured = await page.evaluate(() => {
				const styles = getComputedStyle(document.documentElement);
				return {
					focus: styles.getPropertyValue('--focus').trim(),
					paper: styles.getPropertyValue('--paper').trim(),
					subtle: styles.getPropertyValue('--surface-subtle').trim(),
				};
			});

			// The tokens resolve to hex; convert through a canvas-free path by
			// letting the browser normalise them for us.
			const normalised = await page.evaluate((values) => {
				const probe = document.createElement('span');
				document.body.append(probe);
				const read = (value: string) => {
					probe.style.color = value;
					const computed = getComputedStyle(probe).color;
					return computed;
				};
				const result = {
					focus: read(values.focus),
					paper: read(values.paper),
					subtle: read(values.subtle),
				};
				probe.remove();
				return result;
			}, measured);

			expect(
				Number(ratioBetween(normalised.focus, normalised.paper).toFixed(2)),
				'focus ring on the page surface',
			).toBeGreaterThanOrEqual(MINIMUM);
			expect(
				Number(ratioBetween(normalised.focus, normalised.subtle).toFixed(2)),
				'focus ring on the subtle surface',
			).toBeGreaterThanOrEqual(MINIMUM);
		});
	}

	test('the current-page nav indicator is legible and not colour-only (R-9.5 AC5)', async ({
		page,
	}) => {
		await page.goto('/services/');

		const current = page
			.getByRole('navigation', { name: 'Primary' })
			.getByRole('link', { name: 'Services' });
		await expect(current).toHaveAttribute('aria-current', 'page');

		const measured = await current.evaluate((element) => {
			const styles = getComputedStyle(element);
			const header = element.closest('header');
			return {
				rule: styles.borderBottomColor,
				ruleWidth: Number.parseFloat(styles.borderBottomWidth),
				weight: styles.fontWeight,
				behind: header ? getComputedStyle(header).backgroundColor : 'rgb(255, 255, 255)',
			};
		});

		// Carried by weight as well as colour, so colour perception is never
		// the only channel (R-9.5 AC5, R-5.1 AC3).
		expect(Number(measured.weight)).toBeGreaterThanOrEqual(700);
		expect(measured.ruleWidth, 'the indicator rule must be drawn').toBeGreaterThan(0);
		expect(
			Number(ratioBetween(measured.rule, measured.behind).toFixed(2)),
			`indicator ${measured.rule} on ${measured.behind}`,
		).toBeGreaterThanOrEqual(MINIMUM);
	});
});

test.describe('one light theme only (R-9.9)', () => {
	test('the document root declares color-scheme: light', async ({ page }) => {
		await page.goto('/');
		const scheme = await page.evaluate(
			() => getComputedStyle(document.documentElement).colorScheme,
		);
		expect(scheme).toBe('light');
	});

	for (const route of allRoutes) {
		test(`${route.path} renders identically under a dark colour-scheme preference (R-9.9 AC1)`, async ({
			page,
		}) => {
			const sample = async () => {
				await page.goto(route.path);
				return page.evaluate(() => {
					const read = (selector: string) => {
						const element = document.querySelector(selector);
						if (!element) return null;
						const styles = getComputedStyle(element);
						return `${styles.color}|${styles.backgroundColor}`;
					};
					return {
						body: read('body'),
						heading: read('h1'),
						footer: read('footer'),
					};
				});
			};

			await page.emulateMedia({ colorScheme: 'light' });
			const light = await sample();
			await page.emulateMedia({ colorScheme: 'dark' });
			const dark = await sample();
			await page.emulateMedia({ colorScheme: 'no-preference' });
			const none = await sample();

			expect(dark, 'dark preference must not change the rendering').toEqual(light);
			expect(none, 'no preference must not change the rendering').toEqual(light);
		});
	}
});
