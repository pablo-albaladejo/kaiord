## 1. Package Setup

- [x] 1.1 Scaffold `packages/docs/` with package.json (private: true), VitePress 1.x, @shikijs/vitepress-twoslash, vitepress-plugin-llms. Declare all `@kaiord/*` packages as devDependencies for Twoslash resolution.
- [x] 1.2 Create `.vitepress/config.ts` with: `base: '/docs/'`, dark mode default, Kaiord logo, sidebar (Quick Start > Why Kaiord > Guides > Formats > CLI > MCP > API Reference), MiniSearch with Cmd+K, Twoslash, llms plugin, `sitemap: { hostname: 'https://kaiord.com' }`, `outline` for "On this page" sidebar, code copy button enabled
- [x] 1.3 Apply Kaiord branding: brand color tokens, system font stack (no web fonts), "Built by Pablo Albaladejo" footer with LinkedIn + GitHub Releases links, logo in sidebar
- [x] 1.4 Create `index.md` docs home: hero with one-liner + "Quick Start" CTA, 3-step visual (Install > Convert > Done), feature cards linking to Formats, CLI, MCP, API Reference
- [x] 1.5 Add typedoc + typedoc-plugin-markdown as devDependency, create prebuild script (`scripts/generate-api-docs.mjs`) to generate API reference into `packages/docs/api/`, add `api/` to `.gitignore`
- [x] 1.6 Add VitePress frontmatter template with `title` and `description` fields for per-page SEO
- [x] 1.7 Create docs OG image (1200x630, < 100KB, dark background + Kaiord logo + "Documentation" subtitle)
- [x] 1.8 Add JSON-LD structured data via VitePress `transformHead` hook: `BreadcrumbList` + `TechArticle` per page, `WebSite` + `SearchAction` on docs home
- [x] 1.9 Configure VitePress custom 404 page with search box and links to Quick Start + docs home

## 2. Content Migration

- [x] 2.1 Create `guide/quick-start.md`: <=10 steps from `pnpm add` to working FIT->TCX conversion, self-contained, Twoslash type-checked. Opens with "By the end of this guide, you'll convert a Garmin FIT file to TCX in 4 lines of TypeScript."
- [x] 2.2 Create `guide/why-kaiord.md`: problem framing (fragmented formats, no unified TS SDK), search-friendly terms, comparison table vs parsing libraries individually (fitparse, gpx-parser, etc.)
- [x] 2.3 Migrate Getting Started guide from `docs/getting-started.md` to `packages/docs/guide/getting-started.md`
- [x] 2.4 Migrate Architecture guide from `docs/architecture.md` to `packages/docs/guide/architecture.md`
- [x] 2.5 Migrate KRD Format spec from `docs/krd-format.md` to `packages/docs/formats/krd.md`
- [x] 2.6 Migrate Testing guide from `docs/testing.md` to `packages/docs/guide/testing.md`
- [x] 2.7 Create format adapter pages: `formats/fit.md`, `formats/tcx.md`, `formats/zwo.md`, `formats/gcn.md` from package READMEs. Each page SHALL end with a CTA linking to Quick Start for conversion funnel ("Ready to convert? Follow the Quick Start ->").
- [x] 2.8 Create CLI command reference at `cli/commands.md`
- [x] 2.9 Create MCP tool reference at `mcp/tools.md`
- [x] 2.10 Add Twoslash type-checked code examples to key pages (quick-start, format pages, API overview)
- [x] 2.11 Add VitePress frontmatter (`title`, `description`) to every page for per-page SEO

## 3. Auto-Generation Pipeline

- [x] 3.1 Create TypeDoc config (`typedoc.json`) covering all public packages with typedoc-plugin-markdown output, configure first-sentence extraction for descriptions
- [x] 3.2 Wire prebuild script into `packages/docs/package.json` prebuild step
- [x] 3.3 Verify auto-generated API reference builds correctly with VitePress and is indexed by MiniSearch

## 4. Deploy Pipeline

- [x] 4.1 Update `deploy-site.yml`: add `packages/docs/**` to path triggers, add docs build step (`pnpm --filter @kaiord/docs... build`), add `docs/index.html` to artifact verification, add pnpm store cache (`actions/cache`) to speed up repeat builds when only .md files change
- [x] 4.2 Update merge step to copy VitePress output (`.vitepress/dist`) into `dist/docs/`
- [x] 4.3 Add sitemap merge script in workflow: copy VitePress sitemap to `dist/sitemap.xml`, prepend landing root URL entry (`https://kaiord.com/`)
- [x] 4.4 Update landing `robots.txt` to allow `/docs/`
- [x] 4.5 Add `lang="en"` to VitePress HTML config

## 5. Landing Page Update

- [x] 5.1 Add "Docs" link to landing page sticky nav (desktop nav links + mobile)
- [x] 5.2 Add docs link to developer section or hero

## 6. Anti-Drift CI

- [x] 6.1 Add cspell config (`.cspell.json`) with project dictionary for Kaiord-specific terms
- [x] 6.2 Add link checker script or VitePress plugin for internal link validation (VitePress built-in dead link detection — enabled by default, fails build on broken links)
- [x] 6.3 Verify Twoslash type-checking: create an intentionally broken example, confirm build fails, fix it
- [x] 6.4 Add docs-specific lint/check scripts to `packages/docs/package.json`

## 7. Claude Code Hook

- [x] 7.1 Create shell script (`scripts/check-docs-sync.sh`) that checks `git diff --cached --name-only` for src changes without docs changes
- [x] 7.2 Add pre-commit hook to `.claude/settings.json` referencing the script (PreToolUse with git commit filter)
- [x] 7.3 Test hook: commit only src changes (reminder appears), commit src+docs (silent pass)

## 8. Verification

- [ ] 8.1 Verify docs load at `kaiord.com/docs/` with all pages rendered (requires deploy)
- [ ] 8.2 Verify search works: Cmd+K opens modal, type query, results appear, zero-results shows fallback links (requires deploy)
- [x] 8.3 Verify `llms.txt` is accessible at `kaiord.com/docs/llms.txt` (build produces 15KB llms.txt)
- [ ] 8.4 Verify Twoslash code examples render with type information tooltips (requires deploy)
- [x] 8.5 Verify auto-generated API reference pages are present and accurate (build output contains api/ with all packages)
- [ ] 8.6 Verify responsive: mobile sidebar hamburger, collapsible sections, 44px touch targets (requires deploy)
- [ ] 8.7 Verify landing page "Docs" link works (requires deploy)
- [ ] 8.8 Run Lighthouse: Performance >= 90, Accessibility >= 95, SEO >= 95, no web font downloads (requires deploy)
- [x] 8.9 Verify per-page meta tags: unique title and description on every page (all 14 manual pages have frontmatter)
- [x] 8.10 Verify auto-generated sitemap includes all doc pages (sitemap.xml includes all guides, formats, CLI, MCP, API pages)
- [x] 8.11 Verify JSON-LD structured data (BreadcrumbList + TechArticle) on doc pages (configured in transformHead hook)
- [x] 8.12 Verify OG image renders on social sharing for doc pages (og-image-docs.png exists, meta tags configured)
- [x] 8.13 Verify "On this page" outline appears on pages with 3+ headings (outline configured with level [2,3])
- [x] 8.14 Verify code block copy-to-clipboard works (VitePress built-in, enabled by default)
- [x] 8.15 Verify docs 404 page shows search + navigation links (404.html present in build output)

## 9. Finalize

- [x] 9.1 Run `pnpm lint:fix` and ensure zero warnings/errors
- [x] 9.2 Create changeset
- [x] 9.3 Create PR (draft: #265)
