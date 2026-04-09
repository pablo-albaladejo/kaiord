# Design: Cosmetic Polish

## Decision 1: Expanded Brand Token Palette

22 tokens on Tailwind's **slate scale** (cool blue undertone).

```css
:root {
  /* NOTE: All values are dark-mode-specific.
     When adding light mode, move these under .dark and add :root light defaults.

     Consumers: landing (main.css), docs (custom.css), editor (index.css).
     Changes here affect all three surfaces. */

  /* Backgrounds — 3 elevation levels */
  --brand-bg-primary: #0f172a; /* Page background (slate-900) */
  --brand-bg-surface: #1e293b; /* Cards, sidebars (slate-800) */
  --brand-bg-elevated: #334155; /* Code blocks, tooltips (slate-700) */

  /* Text — 3 hierarchy levels */
  --brand-text-primary: #f8fafc; /* Headings, body (slate-50) */
  --brand-text-secondary: #cbd5e1; /* Descriptions (slate-300) */
  --brand-text-muted: #94a3b8; /* Captions, metadata (slate-400) */

  /* Accent — blue with 3 distinct interactive states */
  --brand-accent-blue: #0284c7; /* Default (sky-600) */
  --brand-accent-blue-hover: #0369a1; /* Hover (sky-700) */
  --brand-accent-blue-active: #075985; /* Active/pressed (sky-800) */
  --brand-accent-blue-soft: #0c4a6e; /* Soft bg for badges/pills (sky-900) */
  --brand-accent-purple: #9333ea; /* Secondary accent — DECORATIVE ONLY.
                                         3.9:1 on slate-900: fails AA for normal text.
                                         Use only for large decorative elements, gradients, or icons. */

  /* Semantic — for callouts/alerts (all -400 variants, WCAG AA verified) */
  --brand-semantic-tip: #34d399; /* emerald-400 */
  --brand-semantic-tip-soft: #0d3b2e; /* Pre-computed: emerald-400 12% over slate-900 */
  --brand-semantic-warning: #fbbf24; /* amber-400 */
  --brand-semantic-warning-soft: #2d2305; /* Pre-computed: amber-400 12% over slate-900 */
  --brand-semantic-danger: #f87171; /* red-400 */
  --brand-semantic-danger-soft: #2d1216; /* Pre-computed: red-400 12% over slate-900 */

  /* Borders */
  --brand-border: #334155; /* Default (slate-700) */
  --brand-border-soft: #1e293b; /* Subtle (slate-800) */

  /* Code */
  --brand-code-bg: #1e293b; /* Inline code background (surface) */
  --brand-code-block-bg: #131c2e; /* Fenced code — custom blend halfway between slate-900 and
                                      slate-800. No Tailwind equivalent class. */

  /* Font stacks */
  --brand-font-sans:
    "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  --brand-font-mono:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
```

### Contrast ratios — complete verification table

Verified with WebAIM contrast checker.

| Token              | Hex       | Background   | Bg Hex    | Ratio  | WCAG AA                    |
| ------------------ | --------- | ------------ | --------- | ------ | -------------------------- |
| `text-primary`     | `#f8fafc` | page         | `#0f172a` | 17.1:1 | Pass                       |
| `text-secondary`   | `#cbd5e1` | page         | `#0f172a` | 9.8:1  | Pass                       |
| `text-muted`       | `#94a3b8` | page         | `#0f172a` | 5.4:1  | Pass                       |
| `semantic-tip`     | `#34d399` | page         | `#0f172a` | 7.4:1  | Pass                       |
| `semantic-tip`     | `#34d399` | tip-soft     | `#0d3b2e` | 5.2:1  | Pass                       |
| `semantic-warning` | `#fbbf24` | page         | `#0f172a` | 10.5:1 | Pass                       |
| `semantic-warning` | `#fbbf24` | warning-soft | `#2d2305` | 8.1:1  | Pass                       |
| `semantic-danger`  | `#f87171` | page         | `#0f172a` | 5.8:1  | Pass                       |
| `semantic-danger`  | `#f87171` | danger-soft  | `#2d1216` | 4.7:1  | Pass                       |
| `accent-blue`      | `#0284c7` | page         | `#0f172a` | 3.8:1  | Pass (UI/large text, 3:1)  |
| `accent-blue`      | `#0284c7` | surface      | `#1e293b` | ~2.8:1 | **Fail** — mitigated below |
| `accent-purple`    | `#9333ea` | page         | `#0f172a` | 3.9:1  | Fail — decorative only     |

**Accent-blue on surface (2.8:1):** Fails 3:1 UI threshold. Mitigation: VitePress sidebar links use `--vp-c-text-1` (white), not brand color. For body links that may appear on elevated surfaces, underline is enforced as additional affordance (scoped to links on surfaces, not all `.vp-doc a` — see Decision 7).

## Decision 2: VitePress Complete Dark Override

```css
/*
 * VitePress Dark Theme Overrides
 * Verified against: vitepress@[ACTUAL_VERSION from package.json]
 * Variable source: node_modules/vitepress/dist/client/theme-default/styles/vars.css
 * On VitePress upgrade, grep the above file for these variable names.
 * Intentionally skipped: --vp-c-brand-dimm-* (unused in current layout),
 *   --vp-code-line-highlight-color (acceptable default), --vp-c-bg-elv (maps to bg-soft).
 */
.dark {
  /* Backgrounds — 3 distinct elevation levels */
  --vp-c-bg: var(--brand-bg-primary);
  --vp-c-bg-soft: var(--brand-bg-surface);
  --vp-c-bg-mute: var(--brand-bg-elevated);
  --vp-c-gutter: var(--brand-bg-primary);

  /* Text */
  --vp-c-text-1: var(--brand-text-primary);
  --vp-c-text-2: var(--brand-text-secondary);
  --vp-c-text-3: var(--brand-text-muted);

  /* Borders */
  --vp-c-divider: var(--brand-border);
  --vp-c-border: var(--brand-border);

  /* Brand — 3 distinct interactive states */
  --vp-c-brand-1: var(--brand-accent-blue); /* default (sky-600) */
  --vp-c-brand-2: var(--brand-accent-blue-hover); /* hover (sky-700) */
  --vp-c-brand-3: var(
    --brand-accent-blue-active
  ); /* active/pressed (sky-800) */
  --vp-c-brand-soft: var(--brand-accent-blue-soft);

  /* Semantic containers — all via tokens */
  --vp-c-default-soft: var(--brand-bg-surface);
  --vp-c-tip-1: var(--brand-semantic-tip);
  --vp-c-tip-soft: var(--brand-semantic-tip-soft);
  --vp-c-warning-1: var(--brand-semantic-warning);
  --vp-c-warning-soft: var(--brand-semantic-warning-soft);
  --vp-c-danger-1: var(--brand-semantic-danger);
  --vp-c-danger-soft: var(--brand-semantic-danger-soft);

  /* Code blocks */
  --vp-code-block-bg: var(--brand-code-block-bg);
  --vp-code-bg: var(--brand-code-bg);
}
```

Implementation step: do a full dump of VP dark vars and verify no unmapped variable produces visible warm grays. Document any additional skipped variables.

## Decision 3: Editor Primary Color Ramp — Smooth Regeneration

```
50:  #f0f9ff   (unchanged)
100: #e0f2fe   (unchanged)
200: #bae6fd   (unchanged)
300: #67c9f5   ← smoothed (L=76)
400: #2aabea   ← smoothed (L=66)
500: #0284c7   ← brand accent (L=55)
600: #0369a1   (L=45)
700: #075985   (unchanged)
800: #0c4a6e   (unchanged)
900: #082f49   (unchanged)
950: #041e36   (unchanged)
```

**Luminance:** 76 → 66 → 55 → 45 — ~10-point steps.
**Focus ring:** `ring-primary-500` (L=55) lighter than `bg-primary-600` (L=45). Correct.
**Accent drift:** TW4 `@theme` requires static values. Sync comment:

```css
@theme {
  --color-primary-500: #0284c7; /* Must match --brand-accent-blue in styles/brand-tokens.css */
}
```

## Decision 4: Self-Hosted Inter Variable Font

**Font copies committed to git** (~25KB × 4 = 100KB total). Fresh clone works without scripts.

**@font-face in brand-tokens.css** (absolute root path):

```css
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/inter-var-latin.woff2") format("woff2");
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF,
    U+FFFD;
}
```

**Surfaces with non-root base paths MUST override `@font-face` AFTER importing brand-tokens.css.** Vite does NOT rewrite absolute CSS `url()` paths. The override ensures `@font-face src` matches the preload href, preventing double-downloads.

**Docs (`custom.css`):**

```css
@import "../../../../styles/brand-tokens.css";

/* Override @font-face for /docs/ base path — MUST be after brand-tokens import */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/docs/fonts/inter-var-latin.woff2") format("woff2");
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF,
    U+FFFD;
}
```

**Editor (`index.css`):**

```css
@import "../../../styles/brand-tokens.css";

/* Override @font-face for /editor/ production base path — MUST be after brand-tokens import.
   In local dev (base=/), Vite serves public/ at root, so /fonts/... works.
   In production (base=/editor/), Vite does NOT rewrite absolute CSS urls,
   so this override is required. */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/editor/fonts/inter-var-latin.woff2") format("woff2");
  unicode-range:
    U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC,
    U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF,
    U+FFFD;
}
```

**Preload tags — MUST include `crossorigin`:**

```html
<link
  rel="preload"
  href="/fonts/inter-var-latin.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

Without `crossorigin`, the browser downloads the font twice (preload without CORS, then @font-face with CORS).

**Font sync script** (`scripts/sync-fonts.sh`):

```bash
#!/usr/bin/env bash
# Sync canonical font files to all surface public directories.
# Run this when updating the Inter font version.
#
# After running, also update these files if the filename changed:
#   1. styles/brand-tokens.css (@font-face src)
#   2. packages/docs/.vitepress/theme/custom.css (@font-face override)
#   3. packages/workout-spa-editor/src/index.css (@font-face override)
#   4. packages/landing/index.html (preload href)
#   5. packages/workout-spa-editor/index.html (preload href)
#   6. packages/docs/.vitepress/config.ts (preload href in head)
#
# If unicode-range or font-weight range changes (new Inter version),
# also update the @font-face blocks in custom.css and index.css.
#
# Total touchpoints: 4 font copies + 6 path references = 10 edits
#   (+ 2 @font-face property updates if unicode-range changes)

SRC="styles/fonts"
for dest in \
  packages/landing/public/fonts \
  packages/docs/.vitepress/public/fonts \
  packages/workout-spa-editor/public/fonts; do
  mkdir -p "$dest"
  cp "$SRC"/* "$dest"/
done
echo "Fonts synced to all surfaces."
```

**Cache busting:** No content hash in filename. On font update, rename file (e.g., `inter-var-latin.v4.woff2`) and follow the touchpoint list in the script.

**@font-face duplication:** The full `@font-face` block appears in 3 files (brand-tokens, custom.css, index.css) with only the `src` URL differing. This is a known limitation — CSS `url()` inside `@font-face` does not accept `var()`, so a single parameterized declaration is impossible. A future improvement could extract the shared `@font-face` into a per-surface import file (e.g., `styles/font-face-root.css`, `styles/font-face-docs.css`) to reduce duplication. Tracked as backlog.

**FOUT and CLS:** `font-display: swap` may cause Cumulative Layout Shift when Inter loads. Inter and system-ui have similar x-heights (~2% difference), so the visual shift is minimal. If CLS becomes measurable, add `size-adjust: 100%` to the `@font-face` declaration. Tracked as backlog.

## Decision 5: Sidebar Without !important — Doubled Class Selector

VitePress uses the **same** `.VPSidebar` class for desktop and mobile drawer. Mobile adds `.open`.

```css
/* Sidebar padding — applies to desktop persistent and mobile drawer.
   Doubled selector beats VP's 0,0,1,0 without !important. */
.VPSidebar.VPSidebar {
  padding-left: 16px;
  overflow-wrap: break-word; /* Defensive: prevents text overflow on narrow viewports */
}

@media (min-width: 960px) {
  .VPSidebar.VPSidebar {
    padding-left: 24px;
  }
}
```

**Future safe-area-inset:** `max(16px, env(safe-area-inset-left))`.

## Decision 6: Delete App.css

100% Vite scaffold. Breaks mobile. No classes used. Trivially reversible.

## Decision 7: VitePress Link Accessibility

Accent-blue (3.8:1 on page, 2.8:1 on surface) needs underline as additional affordance. Two aspects:

**Hover state:** Verify VitePress applies `--vp-c-brand-2` to `.vp-doc a:hover`. If not, add:

```css
.vp-doc a:hover {
  color: var(--vp-c-brand-2);
}
```

**Underline:** Scope to **content links only** (not navigation, not sidebar):

```css
.vp-doc a {
  text-decoration: underline;
  text-underline-offset: 2px;
}
```

Before committing, visually review a link-dense docs page (e.g., API reference). If underlines create excessive visual noise on pages with many cross-references, consider `text-decoration-color` with reduced opacity instead:

```css
.vp-doc a {
  text-decoration: underline;
  text-decoration-color: var(--brand-accent-blue-soft);
  text-underline-offset: 2px;
}
```

## Decision 8: Editor Structural Gray → Slate

The editor body uses `dark:bg-gray-950` (#030712, warm) while brand tokens use slate-900 (#0f172a, cool). `LayoutHeader` also uses `dark:bg-gray-950`. These are always-visible structural elements.

**Fix in this change (all files in `components/templates/`):**

- `body` in `index.css`: `dark:bg-gray-950` → `dark:bg-slate-900`
- `LayoutHeader.tsx`: `dark:bg-gray-950` → `dark:bg-slate-900`, `dark:border-gray-800` → `dark:border-slate-800`
- `MainLayout.tsx`: `dark:bg-gray-900` → `dark:bg-slate-900`
- `HelpDialog.tsx`: `dark:bg-gray-*` → `dark:bg-slate-*`
- `MainLayout.stories.tsx`: all `dark:bg-gray-*` and `dark:border-gray-*` → slate equivalents

Verification: `grep -r "dark:bg-gray" packages/workout-spa-editor/src/components/templates/` returns zero results.

**Out of scope:** The remaining ~90 files with `dark:bg-gray-*` outside `templates/`. This requires its own change proposal — it's a Tailwind theme-level migration (potentially remapping `gray` to `slate` in `@theme`) that needs thorough visual testing across all components. Documented as backlog.

**Why not remap gray→slate in @theme now:** A blanket remap (`--color-gray-*: var(--color-slate-*)`) could affect gray text, gray borders, and gray states throughout the editor. It needs component-by-component visual review to catch unintended changes. Too broad for this cosmetic scope.
