<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# .vitepress/theme

## Purpose

Custom Vue components and global styling for the VitePress documentation theme. Extends the default VitePress theme with Kaiord-specific design, 404 page, and CSS overrides.

## Key Files

- `index.ts` — Theme entry point; initializes VitePress theme and applies customizations
- `NotFound.vue` — Custom 404 error page component (Vue 3)
- `custom.css` — Global CSS overrides and design system (colors, layout, typography, responsive styles)

## Subdirectories

None. This is a flat component directory.

## For AI Agents

### Working In This Directory

1. **custom.css** — Update here for global styling, color scheme overrides, responsive layouts, or adding CSS custom properties. Already imports design tokens from `../../../../styles/brand-tokens.css` (the shared token file).
2. **NotFound.vue** — Modify for custom 404 page content or styling. Ensure it matches the site's design system.
3. **index.ts** — Entry point for theme initialization. Rarely modified; touch only for adding global plugins or theme-wide setup.

### Testing Requirements

- **Build integration**: Changes must not break `pnpm --filter @kaiord/docs build`.
- **CSS validation**: Custom CSS must be valid; Prettier will enforce formatting.
- **Component rendering**: NotFound.vue must render without Vue warnings (check browser console during dev).
- **Design tokens**: Any CSS custom property usage must reference valid tokens defined in `../../../../styles/brand-tokens.css` — the file `custom.css` actually imports.

### Common Patterns

- **CSS custom properties**: Use the `var(--vp-c-brand-1)` pattern; the `--vp-*` mappings live in `custom.css` and resolve through the shared token file. Do not hardcode hex colors (linted by `no-hex-literals.test.mjs`: whole `.css` files plus `<style>` blocks in `.md`/`.vue`/`.html`).
- **Responsive design**: Use CSS media queries or Tailwind-like utility classes (if applicable) for mobile-first layouts.
- **Vue SFC (Single File Components)**: NotFound.vue uses `<script setup>`, `<template>`, `<style scoped>` (or module) syntax.

## Dependencies

### Internal

- `../../../../styles/brand-tokens.css` — CSS custom property definitions (what `custom.css` imports)
- `../brand-tokens.mjs` — Node-side resolver (`readBrandTokenColor`) that READS the css for scripts; it defines nothing

### External

- **VitePress 2.0** (alpha) — Theme API and default theme imports
- **Vue 3** — Component framework

<!-- MANUAL: -->

## Notes for Agents

1. **This is the theme layer**: CSS and Vue components live here. The site's visual identity is defined in `custom.css`.
2. **NotFound.vue is critical**: Users reaching broken links land here. Ensure it's user-friendly and matches the site design.
3. **No JSX/TSX**: NotFound.vue uses Vue 3 SFC syntax, not JSX. Use `<template>` and `{{ }}` for bindings.
4. **CSS isolation**: `<style scoped>` in Vue components is scoped to that component. Global styles go in `custom.css`.
5. **Custom tokens must exist**: Before using `var(--vp-c-new-color)`, ensure it is defined in `../../../../styles/brand-tokens.css`; resolved values are pinned by `scripts/brand-tokens.test.mjs` at the repo root.
