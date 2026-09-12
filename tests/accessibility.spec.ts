import { test } from '@playwright/test';
import { allRoutes } from './support/routes';
import { scanForSeriousOrCriticalViolations } from './support/a11y';

// R-5.1 AC1 — "Given any page, When scanned with an automated
// accessibility engine, Then zero violations of serious or critical impact
// are reported." Runs against every route in the shared route fixture
// (tests/support/routes.ts), the same set every other Wave 2 spec uses, so
// a new page added there is automatically covered here too.
test.describe('accessibility scan (R-5.1 AC1)', () => {
	for (const route of allRoutes) {
		test(`${route.path} has zero serious/critical automated accessibility violations`, async ({
			page,
		}) => {
			await page.goto(route.path);
			await scanForSeriousOrCriticalViolations(page);
		});
	}
});
