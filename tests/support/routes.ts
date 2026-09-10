// Shared route fixture data. One source of truth for "what pages exist"
// so Wave 2 content specs and this Wave 1 smoke spec don't drift apart.
export interface RouteInfo {
	path: string;
	navLabel: string;
}

// Primary nav, in the order BaseLayout renders it (R-2.7 AC1).
export const primaryNavRoutes: RouteInfo[] = [
	{ path: '/', navLabel: 'Home' },
	{ path: '/services/', navLabel: 'Services' },
	{ path: '/about/', navLabel: 'About' },
	{ path: '/contact/', navLabel: 'Contact' },
];

// Legal pages, linked from the footer only (R-2.5 AC2), not primary nav.
export const legalRoutes: RouteInfo[] = [
	{ path: '/privacy/', navLabel: 'Privacy' },
	{ path: '/terms/', navLabel: 'Terms' },
];

export const allRoutes: RouteInfo[] = [...primaryNavRoutes, ...legalRoutes];
