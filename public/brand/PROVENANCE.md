# Brand asset provenance and licensing

## Origin

The brand identity was **AI-generated**, confirmed by the owner on 2026-09-17.
The SVGs here were then reconstructed as vector from those generated brand
boards; the accompanying kit README describes the geometry as "an
interpretation of the raster brand boards", so they are traced derivatives
rather than an original design source.

## What that means, recorded honestly

- **Inbound risk is low.** There is no stock library, agency or commissioned
  designer holding rights to assert against this site, and the photographic
  hero that originally raised the question was replaced by the owner with an
  illustration before anything shipped.
- **Outbound protection is weak.** US copyright requires human authorship, so
  purely AI-generated artwork may not be protectable by copyright. The kit's
  "(c) 2026 haroonie.ai" notice asserts a claim that may not be enforceable
  over those elements.
- **Trademark is the relevant route for a logo**, and is a separate question
  turning on use in commerce and clearance. This program has not examined it.
- **Residual, unresolved:** generative models can reproduce training data, so
  a generated mark could coincidentally resemble an existing one. That is a
  trademark-clearance question for the owner's adviser.

None of the above is legal advice.

## Files

| File | Status |
|---|---|
| `haroonie-logo-mark.svg`, `haroonie-logo-mark-mono.svg`, `haroonie-app-icon.svg` | Supplied kit, **unmodified**. Pure vector, no text, no embedded raster. |
| `haroonie-logo-horizontal.svg`, `-dark.svg`, `-mono.svg`, `haroonie-logo-stacked.svg` | **Regenerated.** Mark and gradients kept from the kit; the wordmark and tagline were outlined to paths from Manrope at weight 800/500, because the supplied versions used live text on a font fallback chain and absolute positioning that broke whenever Manrope was unavailable. |
| `/favicon*.png`, `/favicon.ico`, `/apple-touch-icon.png` | **Generated** from `haroonie-logo-mark.svg` and `haroonie-app-icon.svg`. |
| `/og-image.jpg` | Derived from the owner's brand banner. |

## Typeface

**Manrope**, SIL Open Font License 1.1 — unaffected by any of the above and
separately licensed. Licence text ships at `public/fonts/manrope-OFL.txt`.
Self-hosted, so no third-party font service receives visitor requests.
