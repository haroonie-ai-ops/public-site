import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Where a test-spawned `astro build --outDir ...` is allowed to put its
// output.
//
// NOT `os.tmpdir()`, which is the obvious choice and is wrong on Windows.
// Astro's build finishes by RENAMING its intermediate prerender assets
// (`.astro/.prerender/_astro/*`) into the output directory. `fs.rename`
// cannot cross a filesystem boundary, so when the repository is on one
// volume and the system temp directory is on another — D:\ and C:\ on a
// stock Windows machine — the build dies with `EXDEV: cross-device link not
// permitted` before it writes anything the test can assert on.
//
// Reproduced directly: on this sandbox the failure appears only once the
// shared stylesheet grows past Astro's inline threshold, because below it
// there is no `_astro/*.css` asset to move and the rename never happens.
// That makes it a latent trap rather than an obvious one — a CSS change,
// nothing to do with robots.txt, is what surfaces it, and the error names a
// stylesheet in a test about crawl directives.
//
// Keeping the output on the same volume as the repository removes the
// boundary entirely. Nothing about what the tests assert changes; only
// where the bytes land.
const PREFIX = '.tmp-build-';

export function makeBuildOutDir(): string {
	return mkdtempSync(join(process.cwd(), PREFIX));
}

export function removeBuildOutDir(dir: string): void {
	rmSync(dir, { recursive: true, force: true });
}
