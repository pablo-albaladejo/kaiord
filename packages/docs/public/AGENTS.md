<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# public

## Purpose

Static assets served by the VitePress documentation site. Contains logos and Open Graph images used in the site HTML and social media.

## Key Files

- `favicon.svg` — the Kaiord mark, magenta on a dark plate (mirrored from `assets/`)
- `logo-light.svg` — nav mark with light-theme ink baked in (generated)
- `logo-dark.svg` — nav mark with dark-theme ink baked in (generated)
- `og-image-docs.png` — Open Graph image for social media sharing (PNG)

## Subdirectories

None. All assets are in this directory.

## For AI Agents

### Working In This Directory

`favicon.svg`, `logo-light.svg` and `logo-dark.svg` are GENERATED from the
masters in `assets/` — edit the master and run `pnpm brand:images`. The two
nav marks carry baked ink rather than `currentColor` because VitePress renders
its logo through `<img>`, which inherits no color from the page.

`og-image-docs.png` comes from `pnpm --filter @kaiord/docs exec node
scripts/generate-og-image.mjs`.

**Conventions:**

1. **Logo files**: Use SVG for logos (scalable, small file size).
2. **OG images**: Use PNG for Open Graph images (raster format, expected by social platforms).
3. **Naming**: Use kebab-case for file names.
4. **References**: Logos are referenced in `.vitepress/config.ts` under `themeConfig.logo`. OG images are referenced in `head-config.mjs`.

### Testing Requirements

- **File presence**: Ensure all referenced logos and images exist before building.
- **Build validation**: `pnpm --filter @kaiord/docs build` must not report missing assets.
- **Visual quality**: Verify logos render correctly in light/dark themes. Test OG image in social media preview tools.

### Common Patterns

- **Theme-aware logos**: Light/dark variants allow logos to adapt to site theme preference.
- **OG images**: Recommended size is 1200x630px for optimal social media display.

## Dependencies

### Internal

- `.vitepress/config.ts` — References logo files
- `.vitepress/head-config.mjs` — References OG image

### External

None (these are static assets).

<!-- MANUAL: -->

## Notes for Agents

1. **Keep logos simple**: Logos appear in headers and sidebars. Simple, recognizable designs work best.
2. **Test in context**: Verify logos render correctly on light and dark backgrounds.
3. **OG image is critical**: This image appears when Kaiord docs are shared on Twitter/LinkedIn/etc. Make it visually appealing.
4. **File size matters**: Use optimized SVGs (no unnecessary nodes) and compressed PNGs.
