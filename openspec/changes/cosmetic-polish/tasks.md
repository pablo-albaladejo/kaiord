# Tasks: Cosmetic Polish

## Task 1: Delete App.css and fix editor mobile

- [ ] Delete `packages/workout-spa-editor/src/App.css`
- [ ] Remove `import "./App.css"` from `packages/workout-spa-editor/src/App.tsx`
- [ ] Visual screenshot of WelcomeSection at 1440px — confirm no text alignment regression
- [ ] Verify editor renders full-width at 320px and 375px

## Task 2: Self-hosted Inter variable font

- [ ] Download Inter variable font woff2 (latin subset, ~25KB) from rsms.me/inter
- [ ] Place canonical source at `styles/fonts/inter-var-latin.woff2`
- [ ] Copy to `packages/landing/public/fonts/inter-var-latin.woff2`
- [ ] Copy to `packages/docs/.vitepress/public/fonts/inter-var-latin.woff2`
- [ ] Copy to `packages/workout-spa-editor/public/fonts/inter-var-latin.woff2`
- [ ] Commit all 4 copies to git
- [ ] Create `scripts/sync-fonts.sh` with touchpoint list in comments (10 edits on font update)
- [ ] Add `@font-face` in `styles/brand-tokens.css` with absolute `src: url("/fonts/inter-var-latin.woff2")` and `font-display: swap`
- [ ] Add `--brand-font-sans` and `--brand-font-mono` tokens
- [ ] Add `<link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>` to `packages/landing/index.html`
- [ ] Add `<link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>` to `packages/workout-spa-editor/index.html`
- [ ] Add preload to VitePress head config with `/docs/fonts/` path and `crossorigin`
- [ ] Override `@font-face` in docs `custom.css` AFTER brand-tokens import for `/docs/fonts/` path
- [ ] Override `@font-face` in editor `index.css` AFTER brand-tokens import for `/editor/fonts/` path
- [ ] Verify: DevTools computed @font-face shows correct path per surface
- [ ] Verify: DevTools computed font shows "Inter" on all three surfaces
- [ ] Verify: Network tab shows exactly 1 font request per surface (no double-download, no 404)
- [ ] Verify in both `pnpm dev` (base=/) and production build (`pnpm build && pnpm preview`)
- [ ] Verify: zero requests to `fonts.googleapis.com`
- [ ] Verify: `git clone && pnpm install && pnpm -r build` works without running sync script

## Task 3: Expand brand-tokens.css

- [ ] Add consumer documentation comment (landing, docs, editor) and light-mode note
- [ ] Add elevation: `--brand-bg-elevated` (#334155)
- [ ] Add 3 interactive accent states: hover (sky-700), active (sky-800), soft (sky-900)
- [ ] Add purple accent with DECORATIVE ONLY comment (3.9:1, fails AA text)
- [ ] Add semantic colors: tip (emerald-400), warning (amber-400), danger (red-400)
- [ ] Add pre-computed semantic soft backgrounds as solid hex
- [ ] Add border soft, code-bg, code-block-bg (#131c2e)
- [ ] Verify all 12 contrast ratios from design table using WebAIM contrast checker
- [ ] Document accent-blue on surface (2.8:1) mitigation in code comment

## Task 4: Complete VitePress dark theme overrides

- [ ] Verify actual VitePress version from `packages/docs/package.json` — use that in pinned comment
- [ ] Add version-pinned comment block with exact vars.css path
- [ ] Document intentionally skipped variables in comment
- [ ] Full dump of VP dark vars — verify no unmapped variable produces visible warm grays
- [ ] Map backgrounds: bg, bg-soft, bg-mute (all distinct), gutter
- [ ] Map borders: divider, border
- [ ] Map brand: brand-1 (sky-600), brand-2 (sky-700), brand-3 (sky-800) — all distinct
- [ ] Map semantics: tip, warning, danger + soft — all via tokens
- [ ] Map code: code-block-bg, code-bg
- [ ] Replace sidebar `!important` with `.VPSidebar.VPSidebar` doubled selector + `overflow-wrap: break-word`
- [ ] Update `--vp-font-family-base` → `var(--brand-font-sans)`
- [ ] Update `--vp-font-family-mono` → `var(--brand-font-mono)`
- [ ] Verify VitePress applies `--vp-c-brand-2` to `.vp-doc a:hover` — if not, add explicit hover rule
- [ ] Add underline to `.vp-doc a` — review on link-dense page, use `text-decoration-color` if noisy
- [ ] Verify mobile sidebar drawer has correct 16px padding

## Task 5: Align editor accent, fix structural gray→slate

- [ ] Regenerate `--color-primary-300` (#67c9f5) and `--color-primary-400` (#2aabea)
- [ ] Set `--color-primary-500: #0284c7` with comment `/* Must match --brand-accent-blue */`
- [ ] Shift 600-950 accordingly
- [ ] Update `--font-family-sans` → `var(--brand-font-sans)`
- [ ] Fix body: `dark:bg-gray-950` → `dark:bg-slate-900` in `index.css`
- [ ] Fix `LayoutHeader.tsx`: `dark:bg-gray-950` → `dark:bg-slate-900`, `dark:border-gray-800` → `dark:border-slate-800`
- [ ] Fix `MainLayout.tsx`: `dark:bg-gray-900` → `dark:bg-slate-900`
- [ ] Fix `HelpDialog.tsx`: audit `dark:bg-gray-*` classes, align to slate
- [ ] Fix `MainLayout.stories.tsx`: align all `dark:bg-gray-*` and `dark:border-gray-*` to slate
- [ ] Verify: `grep -r "dark:bg-gray" packages/workout-spa-editor/src/components/templates/` returns zero results
- [ ] Verify focus rings lighter than buttons, all interactive states correct

## Task 6: Update landing font

- [ ] Update `--font-sans` in `packages/landing/src/main.css` → `var(--brand-font-sans)`
- [ ] Verify landing renders with Inter font

## Task 7: Visual verification & build

- [ ] Editor at 320px, 375px, 667px, 768px, 1440px — full-width, correct accent, Inter, slate-900 body/header
- [ ] Docs at 320px, 375px, 667px, 768px, 1440px — code blocks, callouts, sidebar, tips, warnings
- [ ] Landing at 320px, 375px, 667px, 768px, 1440px — no regressions, Inter renders
- [ ] All surfaces: matching accent blue (#0284c7), Inter font, no warm grays
- [ ] VitePress: hover and active states visually distinct on brand links/buttons
- [ ] VitePress: link underline renders correctly, reviewed on link-dense page
- [ ] VitePress mobile sidebar drawer: 16px padding, no `!important` in computed styles
- [ ] Identify longest sidebar text item from `.vitepress/config.ts` sidebar config
- [ ] VitePress sidebar at 320px: no horizontal text overflow on longest item
- [ ] `pnpm -r build` passes
- [ ] `pnpm lint` passes
- [ ] Create backlog issue: editor component-level `dark:bg-gray-*` → slate migration (~90 files outside templates/)
- [ ] Create backlog issue: `viewport-fit=cover` + safe-area-inset
- [ ] Create backlog issue: focus-visible styling consistency across surfaces
- [ ] Create backlog issue: Inter `size-adjust` for CLS optimization (if FOUT is noticeable)
- [ ] Create backlog issue: extract shared `@font-face` into single importable CSS file to reduce 3-file duplication
