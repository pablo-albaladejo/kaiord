<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# assets

## Purpose

Brand and marketing assets shared by frontends and docs (favicons, logos,
Open-Graph image). Source-of-truth for the public brand surface;
extension-icon and popup masters live under `packages/_shared/` since they
are MV3-specific and follow a different rendering pipeline.

## Key Files

| File                   | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `logo.svg`             | Full logo (wordmark + symbol), vector master     |
| `logo-symbol.svg`      | Symbol-only logo, vector                         |
| `favicon.svg`          | Modern SVG favicon                               |
| `favicon.png`          | PNG fallback favicon                             |
| `favicon-16.png`       | 16×16 PNG favicon (legacy browsers, RSS readers) |
| `favicon-32.png`       | 32×32 PNG favicon                                |
| `favicon-48.png`       | 48×48 PNG favicon                                |
| `apple-touch-icon.png` | iOS home-screen icon (180×180)                   |
| `og-image.png`         | Open-Graph / Twitter Card preview image          |

## For AI Agents

### Working In This Directory

- **SVG is canonical**: regenerate PNG variants from `logo.svg` /
  `favicon.svg` whenever the master changes. Don't hand-edit a PNG.
- **Pixel sizes are fixed** by the file name suffix; preserve aspect ratio
  and the brand `--ka-color-*` tokens defined in `/styles/brand-tokens.css`.
- **Branding contract** lives in `openspec/specs/branding/spec.md` — any
  change to logo geometry or color SHOULD route through a proposal.
- Frontend packages copy or reference these assets in their own `public/`
  directories during build.

### Testing Requirements

No automated tests. Visual regression is covered by the landing-page and
docs-site review process; favicon presence is asserted by integration
smoke tests in `packages/landing/`.

### Common Patterns

- One concept per file; do not pack multiple logos into a sprite.
- File names use lowercase kebab-case with a size suffix where relevant.

## Dependencies

### Internal

Referenced by `packages/landing/public/`, `packages/docs/public/`,
`packages/workout-spa-editor/public/`.

### External

None.

<!-- MANUAL: -->
