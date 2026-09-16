// Minimal ambient declaration for the one Cloudflare Pages Functions type
// this codebase actually uses (`PagesFunction`). Deliberately hand-written
// instead of adding `@cloudflare/workers-types` as a dependency:
// functions/tsconfig.json's `lib` already includes `DOM` (for
// Request/Response/Headers/crypto/btoa), which is spec-compatible with the
// Cloudflare Workers runtime for everything functions/_middleware.ts
// actually touches — global fetch primitives, not a Workers-specific
// binding. The only thing missing without the full types package is the
// Function/context shape itself, declared here to the exact surface used
// (`context.env`, `context.next()`).
//
// No `import`/`export` in this file on purpose — that keeps it a global
// script (not a module), so `PagesFunction` is ambient the same way the
// real `@cloudflare/workers-types` package makes it ambient.
interface PagesFunctionContext<Env = unknown> {
	request: Request;
	env: Env;
	next: () => Promise<Response>;
}

type PagesFunction<Env = unknown> = (
	context: PagesFunctionContext<Env>,
) => Response | Promise<Response>;
