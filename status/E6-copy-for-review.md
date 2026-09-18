# E6 — Owner-supplied copy, for review before implementation

**Status: APPLIED 2026-09-17 (PR #14).** This began as a review document and
is now the historical record of the copy and the decisions behind it. Every
value below is live in `src/content/`; every decision carries the owner's
verbatim instruction.

Source: owner-supplied copy, 2026-09-17, first-hand in-session.
Register this resolves against: `status/placeholder-content.md`.

---

## 0. Headline — read this first

**All E6 copy is applied and every decision is settled.** Nine placeholder
rows closed on owner-supplied copy; R-2.3 AC1 (the About biography) went from
unassertable to asserted for the first time.

**Decisions, all 2026-09-17, all first-hand:** §5.1 entity name →
`haroonie.ai LLC` · §5.2 d/b/a clause dropped, address normalised · §4.2
mailbox → keep `dev@haroonie.ai` · §6 brand → lowercase throughout · §4.1
booking link → option B, removed under an explicit interim waiver of R-2.4
AC1's booking clause.

**Four rows remain open on the register — none a hard blocker:**

| Row | What | Why it is open |
|---|---|---|
| P7 | Open Graph share image (1200×630) | No image supplied; shares fall back to a favicon. Cosmetic. |
| P15 | Home `servicesSummary` | **Agent-drafted, not owner-supplied.** The old wording contradicted the new service areas, so it could not stay. Derived only from the owner's approved service titles. Awaits a nod on wording (§2). |
| P16 | About `metaDescription` | **Agent-drafted, not owner-supplied.** Schema-required; the owner supplied a heading and body but no meta description. Derived strictly from their own approved body copy (§3.3). |
| P17 | Contact booking link | Removed under the §4.1 waiver, pending a scheduling URL the owner parked (*"A: ignore for now"*). |

**One flag, not a task:**

- **§5.3** — the Privacy Policy is GDPR-framed on REQ-001 assumption **A4**,
  which predates knowing the entity is a US (Illinois) LLC. Doesn't block
  anything; worth a look by whoever advises you before go-live.

---

## 1. Services — the three service areas

Your copy gives each service both a short label ("AI & Automation") and a
full title ("AI & Intelligent Automation"). I have read the **full** title as
the visitor-facing heading and treated the short label as your slot naming.
Say if you meant the reverse.

### 1.1 `src/content/services/service-1.md` (row P9)

```yaml
title: "AI & Intelligent Automation"
order: 1
placeholder: false
```

> Turn AI from an idea into a practical business capability. haroonie.ai
> helps organizations identify high-value use cases, design AI-powered
> workflows, build intelligent assistants, and automate repetitive processes
> using modern cloud and AI technologies.

### 1.2 `src/content/services/service-2.md` (row P10)

```yaml
title: "Data & Analytics"
order: 2
placeholder: false
```

> Build a trusted foundation for better decisions. We help organizations
> modernize data platforms, integrate fragmented information, develop
> analytics solutions, and create scalable architectures that turn business
> data into actionable insight.

### 1.3 `src/content/services/service-3.md` (row P11)

```yaml
title: "Software & Cloud Solutions"
order: 3
placeholder: false
```

> Modernize how your organization builds and delivers technology. From custom
> applications and APIs to cloud architecture and system integration,
> haroonie.ai designs practical, maintainable solutions built around real
> business needs.

### 1.4 `src/content/pages/services.md` (row P2)

```yaml
metaDescription: >-
  Explore haroonie.ai consulting services across artificial intelligence,
  automation, data and analytics, cloud architecture, software development,
  and systems integration.
placeholder: false
```

⚠️ **170 characters.** Search engines typically truncate around 155–160, so
the tail ("and systems integration") will likely be cut in results. No
acceptance criterion sets a length limit — R-4.1 only requires unique,
non-empty metadata — so this **passes as written**. If you want it to survive
truncation, a 156-character variant:

> Explore haroonie.ai consulting services across AI, automation, data and
> analytics, cloud architecture, software development, and systems
> integration.

---

## 2. Home page — `src/content/home/index.md` (rows P1, P8)

```yaml
heading: "From Ideas to Real-World Impact."
subheading: >-
  Technology, data, automation, and AI solutions designed around your
  business.
metaDescription: >-
  haroonie.ai helps organizations solve business challenges with AI,
  automation, data, cloud, and custom software solutions—from strategy
  through implementation.
placeholder: false
```

- Heading 32 chars, subheading 77 chars, meta description **159 chars — just
  inside the truncation threshold.** All good.
- This single `metaDescription` also feeds the Organization JSON-LD
  `description` (row **P8**), so both rows close together.
- `ctaLabel`, `ctaHref`, `servicesSummary` and `servicesSummaryLinkLabel` were
  **not** part of your list. The existing `servicesSummary` still reads *"From
  technical advisory to hands-on delivery support…"*, which no longer matches
  the three service areas above. **Proposed replacement, needs your nod:**

  > Artificial intelligence, data, cloud and custom software — three service
  > areas built around what your business actually needs.

---

## 3. About page — `src/content/about/index.md` (row P3)

### 3.1 Heading

```yaml
heading: "Technology should solve problems, not create new ones."
```

Note this replaces the generic "About" with a statement of position. It
becomes the page's `<h1>`. That reads well, but it is a tagline rather than a
label — worth a conscious yes.

### 3.2 Body

> haroonie.ai is an independent technology consultancy focused on helping
> organizations turn complex technology challenges into practical solutions.
> We bring together software development, data, cloud, automation, and
> artificial intelligence to help businesses modernize systems, streamline
> operations, and get more value from technology. Our approach starts with
> understanding the problem, then designing the simplest solution that can
> deliver meaningful and lasting impact.

✅ Satisfies **R-2.3 AC1** (biography present, no placeholder markers), and
invents none of the facts REQ-001 §1.3 bans — no client names, outcomes,
headcount, revenue, certifications or years of experience. Clean.

### 3.3 Meta description — not supplied

Needed to close P3 fully. **Proposed, derived only from your own body copy so
it invents nothing** (150 chars):

> haroonie.ai is an independent technology consultancy helping organizations
> turn complex technology challenges into practical, lasting solutions.

---

## 4. Contact page — `src/content/contact/index.md` (row P4)

### 4.1 Booking URL — RESOLVED (option B, under waiver)

**Owner decisions, 2026-09-17.** Verbatim: *"A: ignore for now."* and
*"b: proceed with the waiver for now."*

Option **B** applied: the booking link is **removed**, and R-2.4 AC1's
booking-link clause is under an explicit interim owner waiver recorded in
REQ-001 R-2.4 itself. The email half of AC1 is untouched and still fully
asserted.

Implementation notes: `bookingUrl`/`bookingLabel` became optional in the
collection schema and are now unset, so the page renders no booking link
rather than a broken one. Restoring it later is two content-file lines plus
a `/booking` entry in `public/_redirects` — no component change. The full
AC1 assertion is retained as a `test.fixme` in a **stronger** form than the
one it replaces (it fetches the target instead of string-comparing the
href), and an active test now guards against any dead booking affordance
reappearing.

Tracked as register row **P17** until a scheduling URL exists.

---

#### Original analysis, retained for the record

**Owner decision, 2026-09-17: use `/booking`.** Verbatim: *"Use /booking"*.
So the vanity path is `https://www.haroonie.ai/booking`, not `/book`. Recorded.

**This settles which path, not what it points at — and those are separate
problems.** `/booking` is the value already live on the Contact page, and
re-verified at the time of this decision it still returns **404**. There is
no `public/_redirects` file and no `/booking` route anywhere in the repo, so
nothing serves that path.

A redirect needs a target. Until a scheduling URL exists, choosing `/booking`
over `/book` changes the spelling of a broken link, not its brokenness.
**Three ways forward — pick one:**

| | Option | Result |
|---|---|---|
| **A** | Give me the scheduling URL (Calendly, Microsoft Bookings, …) | I add `/booking  <url>  302` to `public/_redirects`, exclude it from the sitemap, and add a test asserting it redirects rather than 404s. **Link works.** |
| **B** | Ship with the booking link removed for now | Contact leads with email only. **No broken link.** The `/booking` path stays reserved for when a destination exists. |
| **C** | Ship the link knowing it 404s | Requires an explicit waiver of **R-2.4 AC1** ("actionable"), recorded against P4. Not recommended. |

**Recommended: B now, A when the scheduling account exists.** B is the only
option that neither blocks this copy landing nor knowingly ships a defect,
and moving to A later is a two-line change.

---

#### Original analysis, retained for the record

**Your recommendation:** `https://haroonie.ai/book`, redirecting to Calendly,
Microsoft Bookings, or similar.

**As it stands, this would publish a broken link.** Verified live, just now:

| URL | Result |
|---|---|
| `https://haroonie.ai/book` | 301 → `https://www.haroonie.ai/book` (apex redirect, per A8/R-7.2) |
| `https://www.haroonie.ai/book` | **404** |
| `https://www.haroonie.ai/booking` *(the value live today)* | **404** |

**There is already a broken booking link in production.** The Contact page
currently renders `Book a time to talk` → `https://www.haroonie.ai/booking`,
which 404s. Blast radius is small — the site is non-indexable — but it is a
live **R-2.4 AC1** failure ("actionable"), and it predates this copy round.

`/book` is not a route. The site is a six-route static build with no
`public/_redirects` file. Making your recommendation work is two steps:

1. **You:** choose the scheduling platform and give me the real destination
   URL (Calendly, Microsoft Bookings, …). *This is the missing input.*
2. **Me:** add `/book  <that URL>  302` to `public/_redirects`, exclude
   `/book` from the sitemap, and add a test asserting it redirects rather
   than 404s.

Your `/book` vanity-URL instinct is sound — it keeps the scheduling vendor
swappable without touching page copy. It just needs step 1 before it can
ship. **Until then, the honest options are:** publish the raw scheduling URL
directly, or remove the booking link and lead with email.

### 4.2 Enquiry mailbox — RESOLVED, keep `dev@haroonie.ai`

**Owner decision, 2026-09-17.** Verbatim: *"Modify to dev@haroonie.ai"*.
This supersedes the `hello@haroonie.ai` value in the original E6 copy.

```yaml
email: "dev@haroonie.ai"
```

**This is the address already published and live**, so it is a no-op against
the current site rather than a change — and it retires the risk flagged
here previously. There is no mailbox-existence question to answer: this
address has been the published enquiry route since Wave 2b, and E12's bar on
a test send is no longer a gap, because nothing about the mailbox is
changing.

DNS was never the concern and remains untouched — `haroonie.ai`'s MX routes
to Exchange Online, proven byte-identical before and after Wave 4 in
`status/WAVE4-dns-evidence.md`.

**Row P4's mailbox half is closed.** Only the booking URL (§4.1) remains.

*Observation, not a blocker:* Cloudflare's Email Address Obfuscation is
active on this zone, so the address is not a raw `mailto:` in the HTML — it
renders as `[email protected]` and is decoded by a same-origin
`/cdn-cgi/` script. It is actionable with JavaScript on (which is how the
suite verifies R-2.4 AC1) and inert with JavaScript off. Same family of
zone-level Cloudflare behaviour as Bot Fight Mode (E14/E15). Flagging it
because you are changing the published address; no action implied.

---

## 5. Privacy & Terms — values supplied (rows P13, P14)

Your earlier instruction, recorded verbatim: *"Use the exact registered
LLC/corporate name rather than the Haroonie.ai brand name. I wouldn't invent
this for your Privacy Policy or Terms."* and *"Use your registered/business
mailing address. This should likewise be confirmed before publishing rather
than inferred from your personal information."*

**Supplied 2026-09-17, verbatim:**

- Legal entity name: `haroonie.ai llc`
- Business address: `2501 Chatham Rd / Suite N / Springfield, IL, 62704, USA`

Nothing here is inferred or invented. Three things to settle before these go
into legal documents.

### 5.1 Entity name capitalization — RESOLVED

**Owner decision, 2026-09-17: `haroonie.ai LLC`.** Verbatim: *"haroonie.ai
LLC is fine."*

Brand lowercase, designator capitalized. The §6 house style continues to
govern every other use of the name; this one instance is a legal identifier
and is deliberately the exception.

### 5.2 Display format — RESOLVED

**Owner decision, 2026-09-17: drop the d/b/a clause, normalise the address.**
Verbatim: *"dropping the clause and normalizing to standard US postal format
is ok."*

**Final form, as it will appear in Privacy and Terms:**

> haroonie.ai LLC
> 2501 Chatham Rd, Suite N
> Springfield, IL 62704, USA

Changes from the raw supplied values, both approved above: the "doing
business as haroonie.ai" clause is dropped (the registered name and the
trading name are the same, so it carried no information), and the state/ZIP
comma is removed per standard US postal convention. Street, suite, city,
state, ZIP and country are otherwise exactly as you supplied them.

### 5.3 RESOLVED — REQ-001 A4 re-examined and confirmed

**Owner decision, 2026-09-18.** Verbatim: *"'A4 stands' → zero work."*

A4 was raised here because it was adopted before any entity information
existed, and the entity then turned out to be a US (Illinois) LLC. The owner
has re-examined it and confirmed it holds. No policy text changes; the
Privacy Policy's GDPR framing is already consistent with A4.

Recorded against A4 itself in REQ-001, with the verification that the
policy's factual claims are true of the build — no cookies, no analytics, no
third-party origins, and a contact form that does not submit. **The decision
is scoped to that state:** wiring R-3.1's form (Wave 5, E4) would start
moving personal data through a real pipeline, and A4 is worth re-testing
then rather than inheriting this answer.

The original analysis follows, unchanged, as the record of why it was asked.

---

#### Original analysis — REQ-001 A4

REQ-001 assumption **A4** states UK/EU GDPR applies, and the current
Privacy Policy (`src/content/legal/privacy.md`) was drafted against it — its
`lawfulBasis`, `retentionPeriod` and `rightsProcedure` fields are GDPR
constructs.

A4 was an assumption made with no entity information available. We now know
the entity is a **US (Illinois) LLC**. That does not automatically make A4
wrong — GDPR can still apply to a US entity offering services to UK/EU data
subjects — but it is no longer an assumption resting on nothing, and the
applicable-regime question now has a concrete fact bearing on it.

**This is a flag, not advice — I am not the right source for what privacy
regime governs your business.** What I would not do is quietly publish a
GDPR-framed policy under a US entity's name without telling you the basis for
it was an assumption predating the entity being known. Worth one pass by
whoever advises you on this before go-live.

It does **not** block applying the copy: A4 is an approved REQ-001
assumption and remains in force until you change it. Changing it would be a
material requirement change (BA work), not an implementation decision.

---

## 6. Editorial consistency — RESOLVED

**Owner decision, 2026-09-17: use `haroonie.ai` (lowercase), everywhere.**
Verbatim: *"Use "haroonie.ai""*.

Applied throughout this document — every copy value in §1–§5 now reads
`haroonie.ai`. This matches the domain, the existing pages, the logo and the
nav, so no existing copy needs changing: the house style simply stays as it
was, and the new copy conforms to it.

**One consequence, accepted knowingly.** Three supplied values now open a
sentence with a lowercase letter:

| Where | Opening |
|---|---|
| Service 1 body (§1.1) | "…business capability. **h**aroonie.ai helps organizations…" |
| About body (§3.2) | "**h**aroonie.ai is an independent technology consultancy…" |
| Home meta description (§2) | "**h**aroonie.ai helps organizations solve…" |

This is the standard, deliberate treatment for a lowercase brand and needs no
further action. Noted only so it reads as intentional rather than as a typo
to a later reviewer.

If you would rather avoid the sentence-initial position altogether, each can
be reworded without touching meaning — e.g. About opening *"An independent
technology consultancy, haroonie.ai helps organizations…"*. **Not applied**;
that would be editing your copy rather than styling it. Say the word if you
want it.

---

## 7. Register impact

| Row | Page / field | After this copy |
|---|---|---|
| P1 | Home heading/subheading/meta | **Closes** |
| P2 | Services meta description | **Closes** |
| P3 | About heading + body | **Closes** — meta description pending §3.3 |
| P4 | Contact | Mailbox §4.2 + booking §4.1 — **decisions needed** |
| P7 | og:image | **Still open** — no image supplied |
| P8 | Home JSON-LD description | **Closes** (via P1) |
| P9, P10, P11 | Three service areas | **Close** |
| P13 | Privacy | **Closes** — entity + address supplied (§5), pending §5.1 casing |
| P14 | Terms | **Closes** — same |

**11 of 13 close. 2 remain: P7 (share image) and P4's booking URL.**

Neither remaining row is a legal or content-integrity problem, so for the
first time the register is within sight of empty. Per your earlier decision,
lifting `robots.txt`'s `Disallow: /` requires the register to be empty **or**
each remaining row expressly waived — P7 and P4 are both plausible waivers,
but that is your call to make explicitly, not mine to infer.

---

## 8. Unrelated item still awaiting you

Not part of E6, but open in the same review queue and cheap to settle:
**QA-002 Probe 4** — is the 404 page's *"The page you're looking for doesn't
exist or has moved."* final copy, or should it be logged as a placeholder?

---

## 9. What happens on your approval

1. Apply §1–§4 to the named `src/content/` files, flipping each
   `placeholder: true` → `false`.
2. Update `status/placeholder-content.md` — strike closed rows through into
   the Resolved section with today's date, per that file's own convention.
3. Run the full gate plus the production suite; open a PR.
4. **`robots.txt` stays `Disallow: /`.** Lifting the non-indexable gate is a
   separate, explicit decision, and per your earlier one it waits until the
   register is empty or every remaining row is expressly waived — P13/P14
   will still be open.
