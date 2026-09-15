// Support for R-7.5 (baseline security response headers). Cloudflare Pages
// reads `public/_headers` at deploy time and applies it to the live site;
// neither `astro dev` nor `astro preview` understand this file at all (it's
// a Cloudflare-specific mechanism, not an Astro one), so nothing served
// locally ever actually carries these headers. This helper parses the file
// directly so tests can assert on its declared content, and
// security-headers.spec.ts separately re-enforces that exact content as a
// real response header locally (via route interception) to verify R-7.5
// AC2 (no CSP violation browsing the site) in a real browser.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const HEADERS_FILE_PATH = join(process.cwd(), 'public', '_headers');

export interface HeaderBlock {
	pattern: string;
	headers: Record<string, string>;
}

/**
 * Minimal parser for Cloudflare Pages' `_headers` file format
 * (https://developers.cloudflare.com/pages/configuration/headers/): each
 * unindented, non-comment line starts a new path-pattern block; each
 * indented `Name: value` line beneath it adds a header to that block.
 */
export function parseHeadersFile(): HeaderBlock[] {
	const raw = readFileSync(HEADERS_FILE_PATH, 'utf-8');
	const blocks: HeaderBlock[] = [];
	let current: HeaderBlock | null = null;

	for (const rawLine of raw.split('\n')) {
		const line = rawLine.replace(/\r$/, '');
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const isIndented = /^\s/.test(line);
		if (!isIndented) {
			current = { pattern: trimmed, headers: {} };
			blocks.push(current);
			continue;
		}
		if (!current) continue;

		const separatorIndex = trimmed.indexOf(':');
		if (separatorIndex === -1) continue;
		const name = trimmed.slice(0, separatorIndex).trim();
		const value = trimmed.slice(separatorIndex + 1).trim();
		current.headers[name] = value;
	}

	return blocks;
}

/** The headers block that applies to every route (the catch-all `/*` pattern). */
export function siteWideHeaders(): Record<string, string> {
	const block = parseHeadersFile().find((b) => b.pattern === '/*');
	if (!block) {
		throw new Error('public/_headers has no site-wide "/*" pattern block');
	}
	return block.headers;
}
