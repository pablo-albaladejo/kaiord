<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# styles

## Purpose

Brand-level CSS tokens and shared web fonts consumed by the frontend
packages (`landing`, `workout-spa-editor`, `docs`). Lives at the repo
root so a brand change is a single source-of-truth edit; each frontend
package imports from here rather than re-declaring colors/spacing.

## Key Files

| File               | Description                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| `brand-tokens.css` | CSS custom-property definitions for brand color, type scale, radii, shadows, motion. |

## Subdirectories

| Directory | Purpose                                                 |
| --------- | ------------------------------------------------------- |
| `fonts/`  | Self-hosted webfont binaries (`inter-var-latin.woff2`). |

## For AI Agents

### Working In This Directory

- **Single source of truth**: do not duplicate token values into a frontend
  package's CSS. Import or `@layer` from here.
- **No JS** — CSS and font binaries only.
- Updating a token in `brand-tokens.css` is a breaking visual change;
  preview each consumer (`landing`, `docs`, SPA editor) before merging.
- Branding contract lives in `openspec/specs/branding/spec.md`.

### Two invariants that will bite you

- **One flat `.dark` block, and only one.** `scripts/brand-tokens.mjs` — and
  through it the `<meta name="theme-color">` tag, both Open Graph card
  renderers and the bridge-popup palette guard — regexes the FIRST
  `.dark { … }` in the file. A second block, or a compound selector like
  `:root, .dark`, and every theme-dependent surface falls silently back to
  the light values.
- **Anything theme-dependent goes inside the two role blocks.** A custom
  property resolves its `var()` against the value the referenced role holds
  on the SAME element, so a token declared only in `:root` keeps the light
  value wherever `.dark` sits on an ancestor.

### Testing Requirements

No unit tests — visual regression is covered by SPA editor Playwright
snapshots and landing-page review.

### Common Patterns

- **Three layers, one direction.** Layer 1 is ramps — fixed scales
  (`--n-0`…`--n-1200`, `--z1-dark`…`--z5-light`, `--da-*`, `--mg-*`) plus the
  type scale, radii and motion. Layer 2 is roles — `--text`, `--bg-surface`,
  `--border`, `--control`, `--zone-3`, `--danger`. A role may read a ramp; a
  ramp may never read a role; **a component may only ever name a role**.
- **Magenta is marketing-only.** `--mkt-brand` / `--mkt-cta` are legitimate on
  `packages/landing/**` and in the OG card renderer, nowhere else.
  `scripts/check-mkt-boundary.mjs` fails `pnpm lint` otherwise. Inside the
  product the brand is ink; the one live accent is `--core-live`, which takes
  a training-zone hue.
- **Node reads this file too.** Import `scripts/brand-tokens.mjs` rather than
  re-parsing it: roles are `var()` chains into oklch ramps, and every consumer
  needs the resolved sRGB hex.
- Fonts use `font-display: swap` and `unicode-range` to keep payload tight.

## Dependencies

### Internal

Consumed by `packages/landing/src/main.css`, `packages/docs/.vitepress/theme/`,
`packages/workout-spa-editor/src/` styles.

### External

Inter Variable font (Latin subset).

<!-- MANUAL: -->
