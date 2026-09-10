# ADR-0001 — Public Website Technology Options

Status: PROPOSED — awaiting owner selection
Owner decision required: yes (architecture, recurring cost, credentials)
Author: Business Analyst
Date: 2026-09-10

## 1. Context

haroonie.ai requires a public marketing website for a tech consulting
business. No code exists yet; `D:\dev\public-site` contains only governance
files and is not yet a Git repository.

CLAUDE.md mandates a supervised autonomous delivery lifecycle: Git commits,
Playwright automation, independent QA review and regression. The chosen
technology must therefore be (a) source-controlled, (b) locally runnable,
(c) automatable by agents without a human in the editing loop.

## 2. Decision drivers

| # | Driver | Why it matters |
|---|--------|----------------|
| D1 | Agent-operability | Content and markup must live in Git or agents cannot own delivery |
| D2 | Testability | Must run locally so Playwright can assert against a real build |
| D3 | SEO / performance | Lead generation is the site's only commercial function |
| D4 | Editing model | Who changes copy after launch, and how often |
| D5 | Recurring cost | Solo consultancy; fixed overhead should stay minimal |
| D6 | Lock-in / exit | Ability to move host or vendor without rebuilding |
| D7 | Growth path | Whether the site later needs auth, a portal, or interactive AI demos |

## 3. Options

### Option A — Hosted site builder (Squarespace / Framer / Webflow)
Indicative cost: Squarespace Core ~$17/mo; Framer Basic $10 – Pro $30/mo;
Webflow Basic ~$15/mo site plan *plus* a Workspace plan per account.

Pros: fastest route to a polished site; design, hosting, TLS, CMS and forms
bundled; no maintenance burden.

Cons: content and markup live in a vendor database, not Git — this removes
the Engineer role's ability to implement and the whole autonomous lifecycle
degrades to "Playwright can observe but not repair". Export is lossy or
absent. Cost is permanent and rises with features.

D1 fail. D2 fail (no local build). D6 weak.

### Option B — Astro static site, Markdown content, Cloudflare Pages
Indicative cost: $0 hosting (Cloudflare Pages free tier has unmetered
bandwidth); domain only. Note `.ai` domains renew at roughly $70–130/yr.

Pros: every page, style and word is a file in Git; agents have full
authority; `astro dev` gives Playwright a real local target; ships near-zero
JavaScript, which is the strongest technical SEO baseline available; output
is plain HTML, portable to any host.

Cons: design is our responsibility, not a template vendor's; no visual
editor for a non-technical author; requires a build pipeline.

D1–D3, D5, D6 strong. D4 weak until a CMS is added (see Option C).

### Option C — Option B plus a Git-backed CMS (Decap / Sveltia / TinaCMS)
Indicative cost: $0–$15/mo depending on product.

Adds a browser editing UI while keeping content committed to the repo, so
agent-operability is preserved. Database-backed alternatives (Sanity,
Contentful, Payload) offer richer modelling but move content outside Git and
partially reintroduce Option A's problem.

Recommended as a deferred increment, not a launch requirement.

### Option D — Next.js (React) on Vercel
Indicative cost: Vercel Hobby is free but its terms exclude commercial use,
so a business site requires Pro at ~$20 per seat per month.

Pros: one project can hold marketing pages plus server routes, auth, a
client portal or a live AI demo — relevant if haroonie.ai wants to
demonstrate capability rather than describe it.

Cons: materially heavier JavaScript payload than Astro for content pages;
per-seat pricing; more framework surface for agents to maintain.

Justified only if D7 is answered "yes, soon".

### Option E — WordPress (managed hosting)
Indicative cost: ~$20–30/mo managed, less on shared hosting.

Pros: ubiquitous, easy content editing, trivially handed to any agency.

Cons: ongoing security patching and plugin sprawl; performance requires
active work; PHP/database stack sits awkwardly with a Git-centric
autonomous programme.

D1 partial, D3 weak without tuning, D5 moderate.

## 4. Recommendation

Option B for launch, with Option C as a planned increment and Option D
features reachable incrementally (Astro supports server rendering and can
call a Cloudflare Worker for any dynamic endpoint).

Rationale: it is the only option that satisfies D1 and D2 fully, and it is
also the cheapest and the fastest. Nothing in it forecloses a later move.

## 5. Cross-cutting decisions (required regardless of option)

| Area | Options | Safest default |
|------|---------|----------------|
| Registrar / DNS | existing registrar + Cloudflare DNS | Cloudflare DNS |
| Business email | Google Workspace, Microsoft 365, Fastmail | Google Workspace |
| Lead capture | Formspree, Web3Forms, Worker + Resend, Cal.com booking | Worker + Resend, plus Cal.com link |
| Analytics | Cloudflare Web Analytics (free, cookieless), Plausible (~$9/mo), GA4 | Cloudflare Web Analytics |
| Consent | none needed if no non-essential cookies | cookieless analytics, no banner |
| Legal pages | privacy policy, terms, cookie notice | privacy + terms at launch |
| Accessibility | WCAG 2.2 AA | AA, asserted in Playwright |
| CI | GitHub Actions running Playwright on PR | required by CLAUDE.md lifecycle |

## 6. Ambiguities — owner input required

Each carries a default so implementation is not blocked.

| # | Question | Default if unanswered |
|---|----------|----------------------|
| Q1 | Brochure site only, or interactive AI demo / client portal? | Brochure + blog |
| Q2 | Who edits content post-launch? | Owner and agents, via Markdown |
| Q3 | Where do leads go? | Email plus a booking link |
| Q4 | Legal jurisdiction? | UK GDPR and EU GDPR |
| Q5 | Existing brand assets, or design from scratch? | From scratch, minimal |
| Q6 | Recurring cost ceiling? | Under $20/mo excluding domain |
| Q7 | Languages? | English only |

## 7. Escalations under CLAUDE.md

The following require human action and cannot be performed autonomously:

- domain registrar and DNS account access
- hosting account creation (Cloudflare) and GitHub repository creation
- email provider account and any MFA enrolment
- `git init` in `D:\dev\public-site` — repository creation is an owner decision
- selection of this ADR, being an architecture decision with cost impact
