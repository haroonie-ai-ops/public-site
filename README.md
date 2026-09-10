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

## Node version

Pinned in `.nvmrc` and `package.json#engines`. Use the same version in CI
(see `requirements/REQ-001-mvp-public-website.md` R-1.2, R-6.7).
