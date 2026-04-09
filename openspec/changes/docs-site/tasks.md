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

- [ ] 2.1 Create `guide/quick-start.md`: <=10 steps from `pnpm add` to working FIT->TCX conversion, self-contained, Twoslash type-checked. Opens with "By the end of this guide, you'll convert a Garmin FIT file to TCX in 4 lines of TypeScript."
- [ ] 2.2 Create `guide/why-kaiord.md`: problem framing (fragmented formats, no unified TS SDK), search-friendly terms, comparison table vs parsing libraries individually (fitparse, gpx-parser, etc.)
- [ ] 2.3 Migrate Getting Started guide from `docs/getting-started.md` to `packages/docs/guide/getting-started.md`
- [ ] 2.4 Migrate Architecture guide from `docs/architecture.md` to `packages/docs/guide/architecture.md`
- [ ] 2.5 Migrate KRD Format spec from `docs/krd-format.md` to `packages/docs/formats/krd.md`
- [ ] 2.6 Migrate Testing guide from `docs/testing.md` to `packages/docs/guide/testing.md`
- [ ] 2.7 Create format adapter pages: `formats/fit.md`, `formats/tcx.md`, `formats/zwo.md`, `formats/gcn.md` from package READMEs. Each page SHALL end with a CTA linking to Quick Start for conversion funnel ("Ready to convert? Follow the Quick Start ->").
- [ ] 2.8 Create CLI command reference at `cli/commands.md`
- [ ] 2.9 Create MCP tool reference at `mcp/tools.md`
- [ ] 2.10 Add Twoslash type-checked code examples to key pages (quick-start, format pages, API overview)
- [ ] 2.11 Add VitePress frontmatter (`title`, `description`) to every page for per-page SEO

## 3. Auto-Generation Pipeline

- [ ] 3.1 Create TypeDoc config (`typedoc.json`) covering all public packages with typedoc-plugin-markdown output, configure first-sentence extraction for descriptions
- [ ] 3.2 Wire prebuild script into `packages/docs/package.json` prebuild step
- [ ] 3.3 Verify auto-generated API reference builds correctly with VitePress and is indexed by MiniSearch

## 4. Deploy Pipeline

- [ ] 4.1 Update `deploy-site.yml`: add `packages/docs/**` to path triggers, add docs build step (`pnpm --filter @kaiord/docs... build`), add `docs/index.html` to artifact verification, add pnpm store cache (`actions/cache`) to speed up repeat builds when only .md files change
- [ ] 4.2 Update merge step to copy VitePress output (`.vitepress/dist`) into `dist/docs/`
- [ ] 4.3 Add sitemap merge script in workflow: copy VitePress sitemap to `dist/sitemap.xml`, prepend landing root URL entry (`https://kaiord.com/`)
- [ ] 4.4 Update landing `robots.txt` to allow `/docs/`
- [ ] 4.5 Add `lang="en"` to VitePress HTML config

## 5. Landing Page Update

- [ ] 5.1 Add "Docs" link to landing page sticky nav (desktop nav links + mobile)
- [ ] 5.2 Add docs link to developer section or hero

## 6. Anti-Drift CI

- [ ] 6.1 Add cspell config (`.cspell.json`) with project dictionary for Kaiord-specific terms
- [ ] 6.2 Add link checker script or VitePress plugin for internal link validation
- [ ] 6.3 Verify Twoslash type-checking: create an intentionally broken example, confirm build fails, fix it
- [ ] 6.4 Add docs-specific lint/check scripts to `packages/docs/package.json`

## 7. Claude Code Hook

- [ ] 7.1 Create shell script (`scripts/check-docs-sync.sh`) that checks `git diff --cached --name-only` for src changes without docs changes
- [ ] 7.2 Add pre-commit hook to `.claude/settings.local.json` referencing the script
- [ ] 7.3 Test hook: commit only src changes (reminder appears), commit src+docs (silent pass)

## 8. Verification

- [ ] 8.1 Verify docs load at `kaiord.com/docs/` with all pages rendered
- [ ] 8.2 Verify search works: Cmd+K opens modal, type query, results appear, zero-results shows fallback links
- [ ] 8.3 Verify `llms.txt` is accessible at `kaiord.com/docs/llms.txt` -- feed to LLM and test 5 questions about Kaiord's API
- [ ] 8.4 Verify Twoslash code examples render with type information tooltips
- [ ] 8.5 Verify auto-generated API reference pages are present and accurate
- [ ] 8.6 Verify responsive: mobile sidebar hamburger, collapsible sections, 44px touch targets
- [ ] 8.7 Verify landing page "Docs" link works
- [ ] 8.8 Run Lighthouse: Performance >= 90, Accessibility >= 95, SEO >= 95, no web font downloads
- [ ] 8.9 Verify per-page meta tags: unique title and description on every page
- [ ] 8.10 Verify auto-generated sitemap includes all doc pages
- [ ] 8.11 Verify JSON-LD structured data (BreadcrumbList + TechArticle) on doc pages via Rich Results Test
- [ ] 8.12 Verify OG image renders on social sharing for doc pages
- [ ] 8.13 Verify "On this page" outline appears on pages with 3+ headings
- [ ] 8.14 Verify code block copy-to-clipboard works
- [ ] 8.15 Verify docs 404 page shows search + navigation links

## 9. Finalize

- [ ] 9.1 Run `pnpm lint:fix` and ensure zero warnings/errors
- [ ] 9.2 Create changeset
- [ ] 9.3 Create PR
