# Tasks: Cosmetic Polish

## Task 1: Delete App.css and fix editor mobile

- [x] Delete `packages/workout-spa-editor/src/App.css`
- [x] Remove `import "./App.css"` from `packages/workout-spa-editor/src/App.tsx`
- [x] Visual screenshot of WelcomeSection at 1440px — confirm no text alignment regression
- [x] Verify editor renders full-width at 320px and 375px

## Task 2: Self-hosted Inter variable font

- [x] Download Inter variable font woff2 (latin subset, ~25KB) from rsms.me/inter
- [x] Place canonical source at `styles/fonts/inter-var-latin.woff2`
- [x] Copy to `packages/landing/public/fonts/inter-var-latin.woff2`
- [x] Copy to `packages/docs/.vitepress/public/fonts/inter-var-latin.woff2`
- [x] Copy to `packages/workout-spa-editor/public/fonts/inter-var-latin.woff2`
- [x] Commit all 4 copies to git
- [x] Create `scripts/sync-fonts.sh` with touchpoint list in comments (10 edits on font update)
- [x] Add `@font-face` in `styles/brand-tokens.css` with absolute `src: url("/fonts/inter-var-latin.woff2")` and `font-display: swap`
- [x] Add `--brand-font-sans` and `--brand-font-mono` tokens
- [x] Add `<link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>` to `packages/landing/index.html`
- [x] Add `<link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>` to `packages/workout-spa-editor/index.html`
- [x] Add preload to VitePress head config with `/docs/fonts/` path and `crossorigin`
- [x] Override `@font-face` in docs `custom.css` AFTER brand-tokens import for `/docs/fonts/` path
- [x] Override `@font-face` in editor `index.css` AFTER brand-tokens import for `/editor/fonts/` path
- [x] Verify: DevTools computed @font-face shows correct path per surface
- [x] Verify: DevTools computed font shows "Inter" on all three surfaces — confirmed via Playwright evaluate()
- [x] Verify: Network tab shows exactly 1 font request per surface (no double-download, no 404)
- [x] Verify in both `pnpm dev` (base=/) and production build (`pnpm build && pnpm preview`)
- [x] Verify: zero requests to `fonts.googleapis.com`
- [x] Verify: `git clone && pnpm install && pnpm -r build` works without running sync script

## Task 3: Expand brand-tokens.css

- [x] Add consumer documentation comment (landing, docs, editor) and light-mode note
- [x] Add elevation: `--brand-bg-elevated` (#334155)
- [x] Add 3 interactive accent states: hover (sky-700), active (sky-800), soft (sky-900)
- [x] Add purple accent with DECORATIVE ONLY comment (3.9:1, fails AA text)
- [x] Add semantic colors: tip (emerald-400), warning (amber-400), danger (red-400)
- [x] Add pre-computed semantic soft backgrounds as solid hex
- [x] Add border soft, code-bg, code-block-bg (#131c2e)
- [x] Verify all 12 contrast ratios from design table using WebAIM contrast checker
- [x] Document accent-blue on surface (2.8:1) mitigation in code comment

## Task 4: Complete VitePress dark theme overrides

- [x] Verify actual VitePress version from `packages/docs/package.json` — use that in pinned comment
- [x] Add version-pinned comment block with exact vars.css path
- [x] Document intentionally skipped variables in comment
- [x] Full dump of VP dark vars — verify no unmapped variable produces visible warm grays
- [x] Map backgrounds: bg, bg-soft, bg-mute (all distinct), gutter
- [x] Map borders: divider, border
- [x] Map brand: brand-1 (sky-600), brand-2 (sky-700), brand-3 (sky-800) — all distinct
- [x] Map semantics: tip, warning, danger + soft — all via tokens
- [x] Map code: code-block-bg, code-bg
- [x] Replace sidebar `!important` with `.VPSidebar.VPSidebar` doubled selector + `overflow-wrap: break-word`
- [x] Update `--vp-font-family-base` → `var(--brand-font-sans)`
- [x] Update `--vp-font-family-mono` → `var(--brand-font-mono)`
- [x] Verify VitePress applies `--vp-c-brand-2` to `.vp-doc a:hover` — if not, add explicit hover rule
- [x] Add underline to `.vp-doc a` — review on link-dense page, use `text-decoration-color` if noisy
- [x] Verify mobile sidebar drawer has correct 16px padding — confirmed via Playwright screenshot at 320px

## Task 5: Align editor accent, fix structural gray→slate

- [x] Regenerate `--color-primary-300` (#67c9f5) and `--color-primary-400` (#2aabea)
- [x] Set `--color-primary-500: #0284c7` with comment `/* Must match --brand-accent-blue */`
- [x] Shift 600-950 accordingly
- [x] Update `--font-sans` → `var(--brand-font-sans)`
- [x] Fix body: `dark:bg-gray-950` → `dark:bg-slate-900` in `index.css`
- [x] Fix `LayoutHeader.tsx`: `dark:bg-gray-950` → `dark:bg-slate-900`, `dark:border-gray-800` → `dark:border-slate-800`
- [x] Fix `MainLayout.tsx`: `dark:bg-gray-900` → `dark:bg-slate-900`
- [x] Fix `HelpDialog.tsx`: audit `dark:bg-gray-*` classes, align to slate
- [x] Fix `MainLayout.stories.tsx`: align all `dark:bg-gray-*` and `dark:border-gray-*` to slate
- [x] Verify: `grep -r "dark:bg-gray" packages/workout-spa-editor/src/components/templates/` returns zero results
- [x] Verify focus rings lighter than buttons, all interactive states correct

## Task 6: Update landing font

- [x] Update `--font-sans` in `packages/landing/src/main.css` → `var(--brand-font-sans)`
- [x] Verify landing renders with Inter font — confirmed via Playwright evaluate()

## Task 7: Visual verification & build

- [x] Editor at 320px, 375px, 667px, 768px, 1440px — full-width, correct accent, Inter, slate-900 body/header
- [x] Docs at 320px, 375px, 667px, 768px, 1440px — code blocks, callouts, sidebar, tips, warnings
- [x] Landing at 320px, 375px, 667px, 768px, 1440px — no regressions, Inter renders
- [x] All surfaces: matching accent blue (#0284c7), Inter font, no warm grays
- [x] VitePress: hover and active states visually distinct on brand links/buttons
- [x] VitePress: link underline renders correctly, reviewed on link-dense page
- [x] VitePress mobile sidebar drawer: 16px padding, no `!important` in computed styles
- [x] Identify longest sidebar text item from `.vitepress/config.ts` sidebar config — "GCN (Garmin Connect)"
- [x] VitePress sidebar at 320px: no horizontal text overflow on longest item — confirmed via screenshot
- [x] `pnpm -r build` passes
- [x] `pnpm lint` passes
- [x] Create backlog issue: editor component-level `dark:bg-gray-*` → slate migration (~90 files outside templates/) — #266
- [x] Create backlog issue: `viewport-fit=cover` + safe-area-inset — #267
- [x] Create backlog issue: focus-visible styling consistency across surfaces — #268
- [x] Create backlog issue: Inter `size-adjust` for CLS optimization (if FOUT is noticeable) — #269
- [x] Create backlog issue: extract shared `@font-face` into single importable CSS file to reduce 3-file duplication — #270
