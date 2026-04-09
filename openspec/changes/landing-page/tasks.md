## 1. Branding Assets

- [x] 1.1 Design Kaiord logo SVG (hub/convergence symbol + "kaiord" wordmark), must work at 16px–200px, on dark and light backgrounds
- [x] 1.2 Create favicon.ico (16x16, 32x32, 48x48) from logo symbol
- [x] 1.3 Create apple-touch-icon.png (180x180) from logo symbol
- [x] 1.4 Create OG image (1200x630 PNG, < 100KB) with logo, tagline, and brand colors on dark background
- [x] 1.5 Create shared brand color tokens at `styles/brand-tokens.css` (repo root, outside any package) with semantic variables (`--brand-bg-primary`, `--brand-bg-surface`, `--brand-text-primary`, `--brand-text-secondary`, `--brand-text-muted`, `--brand-accent-blue`, `--brand-accent-purple`, `--brand-border`)

## 2. Landing Package Setup

- [x] 2.1 Scaffold `packages/landing/` with package.json (private: true, zero `@kaiord/*` dependencies), tsconfig.json, Vite config, Tailwind CSS 4 with system font stack
- [x] 2.2 Configure ESLint and Prettier for the landing package
- [x] 2.3 Add CNAME (`kaiord.com`), .nojekyll, robots.txt (allow `/`, disallow `/editor/`), and sitemap.xml (generate `<lastmod>` from build timestamp via Vite plugin or build script) to `packages/landing/public/`
- [x] 2.4 Create `index.html` with: `lang="en"`, meta description, canonical URL, OG tags, Twitter Card tags, `<meta name="theme-color">` matching `--brand-bg-primary`, JSON-LD structured data (`SoftwareSourceCode`), favicon links, page title
- [x] 2.5 Verify `styles/brand-tokens.css` is covered by root Prettier config (add to format script if needed)

## 3. Deployment Pipeline (validate early)

- [x] 3.1 Verify editor's `vite.config.ts` reads `process.env.VITE_BASE_PATH || '/'` for `base` option, then set `VITE_BASE_PATH=/editor/` in workflow env var only (local dev unchanged at `/`)
- [x] 3.2 Create branded 404.html with Kaiord logo on dark background, links to `/` and `/editor/` (no SPA redirect JS)
- [x] 3.3 Rename workflow `deploy-spa-editor.yml` → `deploy-site.yml` in a **single atomic commit**: delete old file, create new file with updated self-reference path trigger, add `packages/landing/**` and `styles/**` to path triggers (retain all existing paths: core, fit, tcx, zwo, garmin, workout-spa-editor), use targeted builds (`pnpm --filter @kaiord/landing... build && pnpm --filter @kaiord/workout-spa-editor... build`)
- [x] 3.4 Audit `packages/workout-spa-editor/public/` for files that would conflict with landing root (CNAME, robots.txt, .nojekyll) and remove/relocate if present
- [x] 3.5 Add merge step: copy editor dist into `dist/editor/`, verify artifact (`index.html`, `editor/index.html`, `CNAME`, `.nojekyll`, `404.html`, `robots.txt`, `sitemap.xml`)
- [ ] 3.6 Deploy minimal placeholder landing page and verify: kaiord.com/ loads, kaiord.com/editor/ works, kaiord.com/nonexistent shows 404

## 4. Landing Page Sections

- [x] 4.1 Build sticky nav: logo wordmark + "Try the Editor" + "GitHub" links, smooth-scroll anchors, mobile-collapsed minimal bar
- [x] 4.2 Build hero section: tagline ("One framework. Every fitness format."), subtitle explaining what Kaiord does, primary CTA ("Try the Editor" → /editor/), install command with npm/yarn/pnpm/bun tabs (native `<select>` dropdown on mobile, default npm) and copy-to-clipboard with "Copied!" feedback (`aria-live="polite"`), highlight badges below CTAs: "100% AI-coded" + "Zero infrastructure"
- [x] 4.3 Build user-facing features section: three cards (Visual Editor, AI Workouts, Garmin Connect) with CTA to editor
- [x] 4.4 Build format hub visual: animated CSS diagram (transform/opacity only) showing FIT/TCX/ZWO/GCN ↔ KRD convergence, with `prefers-reduced-motion` fallback to static and `aria-label` for screen readers
- [x] 4.5 Build developer-facing section: build-time pre-highlighted code example (4-line FIT→KRD→TCX, no runtime JS highlighter), feature grid (TypeScript, Hexagonal, Plugin, CLI, MCP)
- [x] 4.6 Build differentiators section: two cards — "100% AI-coded" (every line by AI agents, link to commit history as proof) and "Zero infrastructure" (CLI, SPA, MCP all run locally, no servers/accounts needed)
- [x] 4.7 Build open source section: capability metrics ("5 format adapters", "100% round-trip safe", "80%+ test coverage"), README badges (CI, coverage, TS), "Star on GitHub" button (no count), MIT license
- [x] 4.8 Build footer: logo, GitHub link, npm link, MIT license, "Built by Pablo Albaladejo" with link to LinkedIn profile and GitHub profile
- [x] 4.9 Ensure responsive layout: mobile (360px), tablet (768px), desktop (1280px+) — install tabs become dropdown on mobile, code example has horizontal scroll with gradient fade hint
- [x] 4.10 Add skip-to-content link (visually hidden, visible on Tab focus, jumps to `<main>`)
- [x] 4.11 Verify WCAG AA: keyboard navigation with visible focus indicators, 44x44px touch targets on mobile, semantic landmarks (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`), contrast ratios (4.5:1 body, 3:1 large text), external links with `target="_blank" rel="noopener"`

## 5. Editor Branding Update

- [x] 5.1 Update SPA editor favicon to Kaiord favicon (replace vite.svg)
- [x] 5.2 Update SPA editor page title from "workout-spa-editor" to "Kaiord Editor"
- [x] 5.3 Add OG, Twitter Card, and meta description tags to SPA editor index.html
- [x] 5.4 Update editor header logo to use Kaiord logo SVG (replace current lightning bolt)
- [x] 5.5 Import shared brand color tokens (`styles/brand-tokens.css`) in editor CSS via relative path (no workspace dependency on landing)

## 6. Verification

- [ ] 6.1 Verify landing page loads at `kaiord.com/` with all sections rendered and sticky nav working
- [ ] 6.2 Verify editor loads at `kaiord.com/editor/` with full functionality
- [ ] 6.3 Verify `kaiord.com/nonexistent` shows branded 404 page
- [ ] 6.4 Verify OG and Twitter Card tags render correctly (Facebook Sharing Debugger, Twitter Card Validator)
- [ ] 6.5 Verify responsive layout on 360px, 768px, and 1280px viewports
- [ ] 6.6 Verify favicon displays correctly on both landing and editor
- [ ] 6.7 Run Lighthouse: Performance >= 95, Accessibility >= 95, SEO = 100
- [ ] 6.8 Verify `robots.txt`, `sitemap.xml`, and JSON-LD structured data are accessible and valid
- [ ] 6.9 Verify copy-to-clipboard works for install command
- [ ] 6.10 Verify `prefers-reduced-motion: reduce` disables animations
- [ ] 6.11 Verify local dev: `pnpm --filter @kaiord/workout-spa-editor dev` serves at localhost:5173/

## 7. Finalize

- [ ] 7.1 Run `pnpm lint:fix` and ensure zero warnings/errors
- [ ] 7.2 Update npm package READMEs and GitHub repo description/website to link to kaiord.com
- [ ] 7.3 Create changeset for the change
- [ ] 7.4 Create PR with all changes
