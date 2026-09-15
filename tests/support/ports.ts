// Shared port configuration between `playwright.config.ts` and the specs
// that need to know a port value directly (rather than just a baseURL),
// so the two can never drift apart.

// Wave 6 (R-5.2 AC1): the fixed Chrome DevTools Protocol port
// `lighthouse.spec.ts` passes to `playwright-lighthouse`'s `playAudit`, and
// that the `lighthouse` project in `playwright.config.ts` passes to Chrome
// via `--remote-debugging-port`. Configurable via env var for the same
// reason `PW_PORT`/`PW_PREVIEW_PORT` are — so two agents sharing a machine
// don't collide on the same port.
export const LIGHTHOUSE_CDP_PORT = Number(process.env.PW_LIGHTHOUSE_CDP_PORT ?? 9223);
