import { test, expect } from '@playwright/test';
import { allRoutes, primaryNavRoutes, legalRoutes } from './support/routes';

// Wave 1 exit criteria (PLAN-001): every route stub responds 200, the
// shared header/footer/nav render on every page (R-2.7), and the custom
// 404 page works (R-2.6). Page copy itself is Wave 2 scope and is
// intentionally not asserted here beyond "a heading exists".

test.describe('route stubs respond', () => {
	for (const route of allRoutes) {
		test(`${route.path} returns 200 and renders a heading`, async ({ page }) => {
			const response = await page.goto(route.path);
			expect(response?.status()).toBe(200);
			await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		});
	}
});

test.describe('primary navigation (R-2.7)', () => {
	for (const onPage of allRoutes) {
		test(`${onPage.path} exposes Home, Services, About, Contact in the header`, async ({
			page,
		}) => {
			await page.goto(onPage.path);
			const primaryNav = page.getByRole('navigation', { name: 'Primary' });
			for (const route of primaryNavRoutes) {
				await expect(
					primaryNav.getByRole('link', { name: route.navLabel }),
				).toBeVisible();
			}
		});
	}

	// R-2.7 AC1 requires the current page to be indicated "given any page",
	// so this checks every route, not just one — accessibly (via
	// aria-current, not colour alone; see BaseLayout's nav styles).
	for (const onPage of allRoutes) {
		test(`${onPage.path} marks its own nav link current and no other`, async ({ page }) => {
			await page.goto(onPage.path);
			const primaryNav = page.getByRole('navigation', { name: 'Primary' });

			for (const navRoute of primaryNavRoutes) {
				const link = primaryNav.getByRole('link', { name: navRoute.navLabel });
				if (navRoute.path === onPage.path) {
					await expect(link).toHaveAttribute('aria-current', 'page');
				} else {
					await expect(link).not.toHaveAttribute('aria-current', 'page');
				}
			}
		});
	}
});

test.describe('footer (R-2.5 AC2, R-2.7 AC2)', () => {
	test('shows the company name, a copyright year, and legal links', async ({
		page,
	}) => {
		await page.goto('/');
		const footer = page.getByRole('contentinfo');
		await expect(footer).toContainText('haroonie.ai');
		await expect(footer).toContainText(String(new Date().getFullYear()));

		const legalNav = footer.getByRole('navigation', { name: 'Legal' });
		for (const route of legalRoutes) {
			await expect(legalNav.getByRole('link', { name: route.navLabel })).toBeVisible();
		}
	});
});

test.describe('custom 404 page (R-2.6)', () => {
	test('an unknown path returns HTTP 404 and links back home', async ({ page }) => {
		const response = await page.goto('/this-page-does-not-exist/');
		expect(response?.status()).toBe(404);
		await expect(
			page.getByRole('heading', { name: 'Page not found' }),
		).toBeVisible();
		await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute(
			'href',
			'/',
		);
	});
});

test.describe('accessibility scaffolding', () => {
	test('a skip link is the first focusable element', async ({ page, browserName }) => {
		// WebKit's default tab order excludes plain links (this matches real
		// desktop Safari, which only tabs through form controls unless "Full
		// Keyboard Access" is enabled system-wide) — not a defect in the page,
		// so this assertion only holds for engines that tab through links.
		test.skip(
			browserName === 'webkit',
			'WebKit does not include links in the default tab order',
		);
		await page.goto('/');
		await page.keyboard.press('Tab');
		await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
	});
});
