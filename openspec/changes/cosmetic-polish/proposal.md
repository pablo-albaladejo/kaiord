# Cosmetic Polish: Unified Dark Mode & Mobile Fix

**Status:** proposed
**Branch:** `fix/cosmetic-polish`
**Schema:** kaiord

## Problem

kaiord.com ships three surfaces (landing, docs, editor) that feel visually disconnected:

1. **Editor mobile layout broken at 375px** — Vite scaffold `App.css` adds `padding: 2rem` to `#root`, stealing 64px from a 375px viewport.
2. **VitePress dark mode incomplete** — Only 7 of ~20 dark theme variables overridden. Code blocks, callouts, and interactive states fall back to VitePress warm grays.
3. **Accent color divergence** — Editor uses `#0ea5e9` (sky-500), while landing/docs use `#0284c7` (sky-600).
4. **Font inconsistency** — Landing and docs use system fonts. Editor declares Inter in CSS but never loads the font file.
5. **Sidebar padding uses fragile `!important` overrides.**
6. **Editor body/header use Tailwind `gray` scale** (warm undertone) while brand tokens use `slate` (cool). Visible mismatch.

## Solution

- **Expanded `brand-tokens.css`** — 8 → 22 tokens covering elevations, hover/active states, semantics, code blocks. Slate scale throughout.
- **Complete VitePress dark variable coverage** — All `--vp-c-*` variables mapped to brand tokens.
- **Editor mobile fix** — Delete `App.css` (unused Vite scaffold).
- **Unified accent** — Regenerate editor primary ramp centered on brand `#0284c7`.
- **Self-hosted Inter variable font** — Canonical source + copies committed to git. Absolute paths, per-surface `@font-face` overrides for non-root base paths.
- **Editor structural gray→slate** — Body, LayoutHeader, and MainLayout aligned to brand tokens. Component-level `dark:bg-gray-*` migration is a separate follow-up change (97 files, needs its own scope).

## Scope

### In scope

- `styles/brand-tokens.css` — Expand tokens, add `@font-face`
- `styles/fonts/inter-var-latin.woff2` — Canonical font source
- `packages/*/public/fonts/inter-var-latin.woff2` — Committed copies (3 surfaces)
- `scripts/sync-fonts.sh` — Font update convenience tool
- `packages/docs/.vitepress/theme/custom.css` — Complete dark overrides, sidebar fix, font override
- `packages/docs/.vitepress/config.ts` — Font preload in head
- `packages/workout-spa-editor/src/App.css` — Delete
- `packages/workout-spa-editor/src/App.tsx` — Remove App.css import
- `packages/workout-spa-editor/src/index.css` — Regenerate primary ramp, font override, body bg
- `packages/workout-spa-editor/src/components/templates/MainLayout/LayoutHeader.tsx` — gray-950 → slate-900
- `packages/workout-spa-editor/src/components/templates/MainLayout/MainLayout.tsx` — gray bg → slate if applicable
- `packages/workout-spa-editor/index.html` — Font preload
- `packages/landing/src/main.css` — Switch to Inter via brand token
- `packages/landing/index.html` — Font preload

### Out of scope

- Light mode, component redesigns, new features, content changes
- **Editor component-level `dark:bg-gray-*` → slate migration** (97 files, separate change — documented as backlog)
- `viewport-fit=cover` / safe-area-inset (backlog — sidebar padding may need `max(16px, env(safe-area-inset-left))`)
- Focus-visible styling consistency across surfaces (backlog)

## Font Delivery Architecture

```
styles/fonts/inter-var-latin.woff2              ← canonical source
        │
        │  All copies committed to git (~25KB each, 100KB total)
        │  scripts/sync-fonts.sh for font version updates only
        │
        ├──▶ packages/landing/public/fonts/          → served at /fonts/
        ├──▶ packages/docs/.vitepress/public/fonts/  → served at /docs/fonts/
        └──▶ packages/workout-spa-editor/public/fonts/ → served at /fonts/ (dev) or /editor/fonts/ (prod)
```

**Path strategy per surface:**

| Surface       | Base       | @font-face src                                             | Preload href                          | Notes                 |
| ------------- | ---------- | ---------------------------------------------------------- | ------------------------------------- | --------------------- |
| Landing       | `/`        | `/fonts/inter-var-latin.woff2` (brand-tokens)              | `/fonts/inter-var-latin.woff2`        | Paths match           |
| Docs          | `/docs/`   | `/docs/fonts/inter-var-latin.woff2` (custom.css override)  | `/docs/fonts/inter-var-latin.woff2`   | Override AFTER import |
| Editor (dev)  | `/`        | `/fonts/inter-var-latin.woff2` (brand-tokens)              | `/fonts/inter-var-latin.woff2`        | Works in dev          |
| Editor (prod) | `/editor/` | `/editor/fonts/inter-var-latin.woff2` (index.css override) | `/editor/fonts/inter-var-latin.woff2` | Override AFTER import |

**Critical:** All `<link rel="preload">` tags MUST include `crossorigin` attribute (required for fonts even same-origin, because `@font-face` fetches use CORS mode). Without it, browser downloads font twice.

**Fresh clone:** Font copies committed to git. No script needed for builds.

**Cache busting:** Font filename has no content hash. On font update: rename file, run `sync-fonts.sh`, update all 11 touchpoints (documented in script comments).

## Risks

| Risk                                     | Mitigation                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| VitePress upgrade breaks variables       | Version-pinned comment with exact file path (verify actual version from package.json) |
| Inter FOUT                               | `font-display: swap` + preload. Dark bg. `size-adjust` deferred.                      |
| App.css deletion cascade                 | Visual screenshot at 1440px. Trivially reversible.                                    |
| Primary ramp jump                        | Smooth gradient, luminance-verified                                                   |
| Font drift (4 copies)                    | `scripts/sync-fonts.sh` + script comments listing all touchpoints                     |
| Accent drift (TW4 limitation)            | Sync comment in editor @theme                                                         |
| Editor gray/slate mix at component level | Structural components (body, header) fixed. Full migration scoped separately.         |

## Success Criteria

- [ ] Editor fills full viewport width at 320px and 375px
- [ ] VitePress code blocks, callouts, and tips use navy palette
- [ ] All contrast ratios from design table verified with WebAIM
- [ ] Accent-blue on surface (2.8:1) mitigated via underline on elevated surfaces
- [ ] Purple accent documented as decorative-only
- [ ] Accent blue identical across surfaces (#0284c7)
- [ ] Inter renders on all surfaces (DevTools computed font)
- [ ] Exactly 1 font request per surface (crossorigin verified, no 404, no double-download)
- [ ] Works on fresh clone without sync script
- [ ] Sidebar padding without `!important`, works on mobile drawer
- [ ] No sidebar text overflow at 320px (longest item verified)
- [ ] Brand hover ≠ active (sky-600/700/800)
- [ ] Editor body AND header use slate-900, not gray-950
- [ ] No visual regressions at 1440px
- [ ] Build and lint pass
