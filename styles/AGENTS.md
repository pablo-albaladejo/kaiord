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

### Testing Requirements

No unit tests — visual regression is covered by SPA editor Playwright
snapshots and landing-page review.

### Common Patterns

- Tokens follow `--ka-<group>-<scale>` (e.g. `--ka-color-accent-500`).
- Fonts use `font-display: swap` and `unicode-range` to keep payload tight.

## Dependencies

### Internal

Consumed by `packages/landing/src/main.css`, `packages/docs/.vitepress/theme/`,
`packages/workout-spa-editor/src/` styles.

### External

Inter Variable font (Latin subset).

<!-- MANUAL: -->
