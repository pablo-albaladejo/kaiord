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

1. **custom.css** — Update here for global styling, color scheme overrides, responsive layouts, or adding CSS custom properties. Already imports design tokens from `../brand-tokens.mjs`.
2. **NotFound.vue** — Modify for custom 404 page content or styling. Ensure it matches the site's design system.
3. **index.ts** — Entry point for theme initialization. Rarely modified; touch only for adding global plugins or theme-wide setup.

### Testing Requirements

- **Build integration**: Changes must not break `pnpm --filter @kaiord/docs build`.
- **CSS validation**: Custom CSS must be valid; Prettier will enforce formatting.
- **Component rendering**: NotFound.vue must render without Vue warnings (check browser console during dev).
- **Design tokens**: Any CSS custom property usage must reference valid tokens from `../brand-tokens.mjs`.

### Common Patterns

- **CSS custom properties**: Use `var(--vp-c-brand-1)` pattern from `brand-tokens.mjs`. Do not hardcode hex colors (linted by `no-hex-literals.test.mjs`).
- **Responsive design**: Use CSS media queries or Tailwind-like utility classes (if applicable) for mobile-first layouts.
- **Vue SFC (Single File Components)**: NotFound.vue uses `<script setup>`, `<template>`, `<style scoped>` (or module) syntax.

## Dependencies

### Internal

- `../brand-tokens.mjs` — CSS custom property definitions (imported or referenced)

### External

- **VitePress 2.0** (alpha) — Theme API and default theme imports
- **Vue 3** — Component framework

<!-- MANUAL: -->

## Notes for Agents

1. **This is the theme layer**: CSS and Vue components live here. The site's visual identity is defined in `custom.css`.
2. **NotFound.vue is critical**: Users reaching broken links land here. Ensure it's user-friendly and matches the site design.
3. **No JSX/TSX**: NotFound.vue uses Vue 3 SFC syntax, not JSX. Use `<template>` and `{{ }}` for bindings.
4. **CSS isolation**: `<style scoped>` in Vue components is scoped to that component. Global styles go in `custom.css`.
5. **Custom tokens must exist**: Before using `var(--vp-c-new-color)`, ensure it is defined in `../brand-tokens.mjs` and linted in `brand-tokens.test.mjs`.
