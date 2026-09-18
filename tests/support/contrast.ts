// WCAG 2.x relative-luminance and contrast-ratio maths, shared by any spec
// that needs to assert a real ratio rather than trust a swatch.
//
// This exists because axe cannot answer the questions REQ-001 R-9.5 asks.
// axe computes `color-contrast` for text only; SC 1.4.11 (non-text
// contrast — form-field borders, focus rings, the active-nav indicator) is
// not machine-checkable generically, so axe does not attempt it. R-9.5 AC4
// still requires 3:1 for exactly those elements, which means a spec has to
// read the computed colour off the rendered element and do the arithmetic.

/** An `rgb(r, g, b)` / `rgba(r, g, b, a)` string as getComputedStyle returns it. */
export interface Rgb {
	r: number;
	g: number;
	b: number;
	a: number;
}

export function parseCssColor(value: string): Rgb | null {
	const match = value.match(
		/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.%]+)\s*)?\)$/i,
	);
	if (!match) return null;

	const alphaRaw = match[4];
	const a =
		alphaRaw === undefined
			? 1
			: alphaRaw.endsWith('%')
				? Number.parseFloat(alphaRaw) / 100
				: Number.parseFloat(alphaRaw);

	return {
		r: Number.parseFloat(match[1]),
		g: Number.parseFloat(match[2]),
		b: Number.parseFloat(match[3]),
		a,
	};
}

/**
 * Composite a possibly-translucent colour over an opaque backdrop, so the
 * ratio is computed against the pixels a visitor actually sees rather than
 * against a declared value that is partly see-through.
 */
export function flatten(foreground: Rgb, backdrop: Rgb): Rgb {
	const mix = (f: number, b: number) => f * foreground.a + b * (1 - foreground.a);
	return {
		r: mix(foreground.r, backdrop.r),
		g: mix(foreground.g, backdrop.g),
		b: mix(foreground.b, backdrop.b),
		a: 1,
	};
}

function channelLuminance(value: number): number {
	const c = value / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance({ r, g, b }: Rgb): number {
	return (
		0.2126 * channelLuminance(r) +
		0.7152 * channelLuminance(g) +
		0.0722 * channelLuminance(b)
	);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
	return (lighter + 0.05) / (darker + 0.05);
}

/** Contrast between two computed-style colour strings, over an opaque page backdrop. */
export function ratioBetween(
	foregroundCss: string,
	backgroundCss: string,
	backdropCss = 'rgb(255, 255, 255)',
): number {
	const backdrop = parseCssColor(backdropCss);
	const foreground = parseCssColor(foregroundCss);
	const background = parseCssColor(backgroundCss);
	if (!backdrop || !foreground || !background) {
		throw new Error(
			`Unparseable colour: fg="${foregroundCss}" bg="${backgroundCss}" backdrop="${backdropCss}"`,
		);
	}
	return contrastRatio(flatten(foreground, backdrop), flatten(background, backdrop));
}
