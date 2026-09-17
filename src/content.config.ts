// Content architecture for R-2.8 ("all page copy originates from Markdown
// or content collections in the repository, not from hard-coded markup in
// components"). Every collection below is backed by Markdown files under
// `src/content/<collection>/`, loaded through Astro's content-layer `glob`
// loader and validated against a typed Zod schema.
//
// Design intent (Wave 2b, see status/STATUS.md and the PR description for
// the full rationale): a copy change on any page in R-2 should require
// editing only the corresponding Markdown file under `src/content/`, never
// touching a `.astro` component. Pages read from these collections via
// `getCollection`/`getEntry` + the `render()` helper and contain no
// hard-coded body copy of their own — only structural markup and the CTA
// wiring the acceptance criteria require (e.g. "exactly one primary CTA").
//
// `metaDescription` is included in every schema so that `<meta
// name="description">` (R-4.1) is likewise Markdown-sourced rather than a
// string literal in a `.astro` file — the same content-integrity guarantee
// extends to SEO metadata, not just visible body copy.
//
// Every schema carries an optional `placeholder` flag (default `false`).
// Where REQ-001 §1.3's content-integrity constraint means real copy is not
// yet available, the Markdown file sets `placeholder: true` and the
// corresponding row is logged in `status/placeholder-content.md` — the flag
// itself is not asserted on by any Playwright spec; it exists purely as a
// durable, greppable marker distinct from the page-level
// `PlaceholderNotice` component.
//
// This structure was designed to accommodate the future Insights/blog
// collection (REQ-001 §1.2 — out of scope for MVP, but the content
// architecture must not require restructuring to add it): a new
// `insights` collection with its own schema can be added here without
// touching any of the collections below.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const placeholderField = z.boolean().default(false);

const home = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/home' }),
	schema: z.object({
		/** Single primary heading rendered above the fold (R-2.1 AC1). */
		heading: z.string(),
		/** Supporting sub-heading — who the offer is for. */
		subheading: z.string(),
		/** Accessible name of the one primary CTA (R-2.1 AC2). */
		ctaLabel: z.string(),
		/** Must resolve to the Contact page per R-2.1 AC2. */
		ctaHref: z.string(),
		/** Service-area summary text (R-2.1 AC3). */
		servicesSummary: z.string(),
		/** Accessible name of the link to the Services page (R-2.1 AC3). */
		servicesSummaryLinkLabel: z.string(),
		metaDescription: z.string(),
		placeholder: placeholderField,
	}),
});

const services = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/services' }),
	schema: z.object({
		/** Service entry heading (R-2.2 AC1). */
		title: z.string(),
		/** Display order; lower renders first. */
		order: z.number(),
		placeholder: placeholderField,
	}),
	// Markdown body is the entry's description (R-2.2 AC1).
});

const about = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/about' }),
	schema: z.object({
		heading: z.string(),
		metaDescription: z.string(),
		placeholder: placeholderField,
	}),
	// Markdown body is the biography content (R-2.3 AC1).
});

const contact = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/contact' }),
	schema: z.object({
		heading: z.string(),
		/** Enquiry mailbox — actionable via a mailto: link (R-2.4 AC1). */
		email: z.string(),
		/**
		 * Booking link URL — actionable (R-2.4 AC1).
		 *
		 * OPTIONAL as of 2026-09-17. R-2.4 AC1's booking-link clause is
		 * under an explicit, interim owner waiver (see REQ-001 R-2.4) because
		 * no scheduling account exists yet and the reserved `/booking` path
		 * resolves to a 404 — publishing a dead link failed AC1's
		 * "actionable" requirement anyway. Omitting both fields renders no
		 * booking link at all rather than a broken one.
		 *
		 * To restore the link when a scheduling URL exists: set both fields
		 * in src/content/contact/index.md. No component change is needed —
		 * the page renders the link whenever they are present.
		 */
		bookingUrl: z.string().optional(),
		/** Accessible name of the booking link. Required whenever bookingUrl is set. */
		bookingLabel: z.string().optional(),
		/** Short intro line above the form fields. */
		formIntro: z.string(),
		metaDescription: z.string(),
		placeholder: placeholderField,
	}),
});

const legal = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/legal' }),
	schema: z.object({
		title: z.string(),
		metaDescription: z.string(),
		/** R-2.5 AC1 — what personal data is collected. */
		dataCollected: z.string().optional(),
		/** R-2.5 AC1 — the lawful basis for processing. */
		lawfulBasis: z.string().optional(),
		/** R-2.5 AC1 — how long data is retained. */
		retentionPeriod: z.string().optional(),
		/** R-2.5 AC1 — how to exercise data-subject rights. */
		rightsProcedure: z.string().optional(),
		placeholder: placeholderField,
	}),
	// Markdown body carries any additional policy prose (intro, sections
	// beyond the four structured fields above).
});

// Singleton per-page metadata for pages that have no natural singleton
// content entry of their own (currently only Services, whose collection is
// a list of entries rather than one page record). Keeps the page's
// <meta name="description"> Markdown-sourced too, consistent with every
// other page (R-2.8).
const pages = defineCollection({
	loader: glob({ pattern: '*.md', base: './src/content/pages' }),
	schema: z.object({
		metaDescription: z.string(),
		placeholder: placeholderField,
	}),
});

export const collections = { home, services, about, contact, legal, pages };
