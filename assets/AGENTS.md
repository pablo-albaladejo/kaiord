<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# assets

## Purpose

Brand and marketing assets shared by frontends and docs (favicons, logos,
Open-Graph image). Source-of-truth for the public brand surface;
extension-icon and popup masters live under `packages/_shared/` since they
are MV3-specific and follow a different rendering pipeline.

## Key Files

| File                   | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `favicon.svg`          | **The mark.** Magenta on a baked dark plate; browser tab and OG cards |
| `mark.svg`             | Product mark, pure `currentColor` — **inline it, never `<img src>`**  |
| `mark-core-live.svg`   | App-header mark; core reads `var(--core-live, currentColor)`          |
| `mark-app-icon.svg`    | Installed-app / dock icon, ink on a baked plate, ≥ 64 px              |
| `logo.svg`             | Pre-rebrand wordmark + symbol. Kept until the wordmark is redrawn     |
| `favicon.png`          | PNG fallback favicon (generated)                                      |
| `favicon-16.png`       | 16×16 PNG favicon, legacy browsers and RSS readers (generated)        |
| `favicon-32.png`       | 32×32 PNG favicon (generated)                                         |
| `favicon-48.png`       | 48×48 PNG favicon (generated)                                         |
| `apple-touch-icon.png` | iOS home-screen icon, 180×180, from `mark-app-icon.svg` (generated)   |
| `og-image.png`         | Open-Graph / Twitter Card preview image (generated)                   |

## For AI Agents

### Working In This Directory

- **SVG is canonical**: every PNG here is generated. Edit the SVG master, run
  `pnpm brand:images`, and commit the result. Never hand-edit a PNG.
- **`pnpm brand:images` also mirrors** the assets each frontend serves into its
  own `public/` directory, and bakes the docs nav marks (`logo-light.svg` /
  `logo-dark.svg`) — VitePress renders its logo through `<img>`, which inherits
  no `currentColor`. `scripts/build-brand-images.test.mjs` fails if a mirrored
  copy drifts from its master here.
- **`mark.svg` and `mark-core-live.svg` must be inlined.** An SVG behind
  `<img src>` is an isolated document: it inherits neither `currentColor` nor
  `--core-live`, so both would render black. The SPA inlines them through
  `components/atoms/BrandMark/`; the landing inlines the geometry directly.
- **Below 24 px, drop the spokes and nodes.** A 1.4-unit spoke at favicon size
  is under one device pixel and reads as grey — which is why `favicon.svg` is
  the hexagon and core alone.
- **Branding contract** lives in `openspec/specs/branding/spec.md` — any
  change to mark geometry or color SHOULD route through a proposal.

### Testing Requirements

`pnpm test:scripts` covers this directory through two suites:

- `scripts/build-brand-images.test.mjs` — every generated raster is committed
  at the size its name promises, every mirrored `public/` copy is byte-identical
  to its master here, and the marks carry no baked colour.
- `scripts/check-mark-geometry-parity.test.mjs` — the hand-written copies of the
  mark (the OG card renderer, the SPA component, the landing header) still match
  `mark.svg`.

Everything else is visual: the landing-page and docs-site review process, plus
the Playwright snapshots in `packages/workout-spa-editor/e2e/`.

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
