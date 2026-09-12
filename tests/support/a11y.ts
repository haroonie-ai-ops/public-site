import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Shared accessibility scan helper for R-5.1 AC1: "zero violations of
// serious or critical impact". We scan with the full default axe-core rule
// set (which already targets WCAG 2.x A/AA, among other best practices) and
// then filter to serious/critical impact ourselves, rather than narrowing
// the rule set — a moderate/minor finding not gating the assertion is a
// deliberate scope choice matching the AC's wording, not a weakened scan.
export async function scanForSeriousOrCriticalViolations(page: Page) {
	// The dev server (Vite/Astro's HMR client) can trigger a client-side
	// navigation shortly after `load` fires, tearing down the execution
	// context axe-core just injected ("Execution context was destroyed,
	// most likely because of a navigation."). This is transient and
	// unrelated to the page's actual accessibility — retrying once against
	// the same, now-settled page resolves it without weakening the scan
	// itself (still the full default rule set, still filtered to
	// serious/critical afterward). An earlier attempt at fixing this with
	// `page.waitForLoadState('networkidle')` before scanning was reverted:
	// the dev server keeps a persistent HMR WebSocket open, which prevents
	// "networkidle" from ever firing and burns the entire test timeout
	// instead (multiplied by CI's `retries: 2` across every route) rather
	// than failing fast — confirmed against a real, since-cancelled CI run
	// that ran for 30+ minutes on a suite that takes under 3 locally.
	let results: Awaited<ReturnType<AxeBuilder['analyze']>>;
	try {
		results = await new AxeBuilder({ page }).analyze();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (!message.includes('context was destroyed') && !message.includes('Execution context')) {
			throw error;
		}
		results = await new AxeBuilder({ page }).analyze();
	}

	const seriousOrCritical = results.violations.filter(
		(violation) => violation.impact === 'serious' || violation.impact === 'critical',
	);

	const detail = seriousOrCritical
		.map(
			(violation) =>
				`${violation.id} (${violation.impact}): ${violation.help} — ${violation.nodes
					.map((node) => node.target.join(' '))
					.join(', ')}`,
		)
		.join('\n');

	expect(seriousOrCritical, detail || 'no serious/critical violations').toHaveLength(0);
}
