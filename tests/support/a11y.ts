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
	const results = await new AxeBuilder({ page }).analyze();

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
