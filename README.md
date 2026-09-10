# haroonie.ai — Public Website

Astro static site, Markdown content, deployed to Cloudflare Pages from
GitHub Actions. See `CLAUDE.md` for the delivery process and
`requirements/`, `planning/`, `status/` for the governing specification.

## Structure

```
/
├── src/
│   ├── layouts/BaseLayout.astro   # header, nav, footer — shared shell
│   ├── components/                # reusable page components
│   └── pages/                     # one route per file/folder
├── public/                        # static assets served as-is
├── tests/                         # Playwright specs (tests/support/ = fixtures)
└── dist/                          # build output (generated, not committed)
```

## Commands

| Command             | Action                                              |
| :------------------- | :-------------------------------------------------- |
| `npm install`         | Install dependencies                                 |
| `npm run dev`          | Start the local dev server at `localhost:4321`       |
| `npm run build`        | Build the production site to `./dist/`                |
| `npm run preview`      | Preview the production build locally                  |
| `npm run typecheck`    | Run `astro check`                                     |
| `npm test`             | Run the Playwright suite (Chromium, Firefox, WebKit)  |
| `npm run test:ui`      | Run Playwright in UI mode                             |

## Agent tooling (Claude Code)

Project-scoped, so it travels with the repo:

- **Cloudflare plugin** — `cloudflare@cloudflare` from the `cloudflare/skills`
  marketplace, declared in `.claude/settings.json`. Ships Workers, Wrangler,
  web-perf and Pages skills plus a remote MCP server; authenticate it with
  `/mcp`.
- **GitHub MCP server** — declared in `.mcp.json`, running the local
  `github-mcp-server` binary over stdio (no Docker, no remote endpoint).

### GitHub MCP prerequisites

1. Download the `github-mcp-server` binary for your platform from
   https://github.com/github/github-mcp-server/releases and put it on your
   `PATH` (verify with `github-mcp-server --version`).
2. Export a GitHub PAT as `GITHUB_PERSONAL_ACCESS_TOKEN`. `.mcp.json`
   references the variable rather than the value — never commit a token.
3. Restart Claude Code and confirm with `claude mcp list`.

## Node version

Pinned in `.nvmrc` and `package.json#engines`. Use the same version in CI
(see `requirements/REQ-001-mvp-public-website.md` R-1.2, R-6.7).
