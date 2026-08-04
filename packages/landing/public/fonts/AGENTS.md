<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# public/fonts/ AGENTS.md

## Purpose

Web font assets served to clients. Contains the Inter variable font (latin subset) in WOFF2 format, optimized for the landing page typography.

## Key Files

- **`inter-var-latin.woff2`** (65 KB) — Inter variable font, WOFF2 format, latin character set only. Covers the entire landing page text (navigation, headings, body copy, code examples, UI labels).

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Font files are immutable** — do not edit WOFF2 files. If the font needs to change, replace the entire file.
- **WOFF2 compression** — all-in format for modern browsers. No fallback formats needed (IE11 / legacy browser support not required).
- **Subset coverage** — `latin` subset includes ASCII + extended Latin (a–z, A–Z, common diacritics). Sufficient for English and many European languages.
- **Variable font features** — Inter supports weight variation (100–900). CSS `font-weight` can vary without additional files.

### Testing Requirements

- **Font loading verification** — manual only. Check browser DevTools Network tab: font should load with correct size and Content-Type (`font/woff2`).
- **Preload link** — `index.html` includes `<link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>` to prioritize loading.
- **CSS usage** — `styles/brand-tokens.css` declares `--font-sans` in an unlayered `:root`, which beats Tailwind's own `@layer theme` default; no `@theme` mapping is needed or wanted (it would compile to a self-reference).

### Common Patterns

- **Preload strategy** — preload fonts before other resources to avoid "Cumulative Layout Shift" (CLS) from late font arrival.
- **Crossorigin attribute** — required for CORS-enabled font requests. Ensures font is cached correctly across origins.
- **Variable font weight** — CSS can use `font-weight: 600` or `font-weight: 700` without additional HTTP requests.

## Dependencies

### Internal

- `index.html` — preload link and CSS.
- `src/main.css` — imports the shared tokens; declares no font of its own.
- `styles/brand-tokens.css` — defines the `--font-sans` custom property pointing to "Inter Var", and carries the `@font-face` rule for the landing base path.

### External

- **Browser support** — WOFF2 required. Supported in all modern browsers (Chrome 36+, Firefox 39+, Safari 10+, Edge 14+).

## Notes

- **Latin subset only** — if non-Latin characters are needed, the entire font file must be replaced with a version that includes those characters (e.g., `inter-var-full.woff2` with all scripts). Current subset is sufficient for English marketing copy.
- **Variable font** — Inter is distributed as a variable font. All weights (100–900) are in a single file, smaller than multiple weight files.
- **Font size impact** — 65 KB is served to every visitor. Preload ensures critical path latency is acceptable. Monitor via Core Web Vitals (Largest Contentful Paint).

<!-- MANUAL: -->
