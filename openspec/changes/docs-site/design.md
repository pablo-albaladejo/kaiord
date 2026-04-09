## Context

Kaiord has kaiord.com (landing) and kaiord.com/editor/ (SPA) deployed via GitHub Pages with a merged dist strategy. The monorepo has 20+ existing doc files in `docs/`, READMEs per package, and OpenSpec specs. TSDoc coverage is ~30%. Research of 12 top OSS projects identified VitePress as the best fit (used by Vite, Vue.js) and Twoslash as the strongest anti-drift mechanism (used by Vite, tRPC).

## Goals / Non-Goals

**Goals:**

- Public documentation site at kaiord.com/docs/ with guides, API reference, and format specs
- Zero doc drift: type-checked examples, auto-generated reference, CI checks, AI hook
- Consistent branding with landing page (dark mode, logo, colors, fonts)
- LLM-friendly output (llms.txt) as first-class feature
- Per-page SEO: unique title, meta description, OG tags, canonical URLs
- Performance-budgeted: LCP < 1.5s, CLS < 0.05, < 150KB JS gzipped

**Non-Goals:**

- Internationalization (English only)
- Doc versioning (single version, latest only)
- Blog or changelog (future work)
- Interactive playground/REPL (future work)
- Rewriting existing docs from scratch (migrate first, improve iteratively)

## Decisions

### D1: VitePress 2.x (not Fumadocs, Docusaurus, or Starlight)

VitePress is Vite-native, produces static HTML, uses Markdown (not MDX), has built-in search (MiniSearch), and is the lightest option (~50KB). Same ecosystem as the monorepo. Fumadocs and Docusaurus require Next.js/Webpack respectively, adding framework weight. Starlight (Astro) is good but adds a new SSG dependency.

**Alternatives considered:**

- **Fumadocs**: Rising star (Zod, Prisma, Turborepo use it), but Next.js-based. Requires `next export` for static. Heavier.
- **Docusaurus**: Mature, good versioning, but Webpack-based. Heaviest option.
- **Starlight**: Astro-based, excellent i18n. Overkill for English-only.

### D2: Same-repo package `packages/docs/`

Docs in the same repo as code ensures:

- Code + docs changes in the same PR
- Twoslash compiles against local package types (not published versions)
- Single CI pipeline validates everything
- No sync between repos needed

The docs package declares all `@kaiord/*` packages as `devDependencies` so `pnpm --filter @kaiord/docs... build` transitively builds everything Twoslash needs.

### D3: Three-way deploy merge

Extends the existing two-way merge (landing + editor) to three-way:

```text
dist/               ← landing (packages/landing/dist)
dist/editor/        ← SPA editor (packages/workout-spa-editor/dist)
dist/docs/          ← VitePress (packages/docs/.vitepress/dist)
```

VitePress `base` config set to `/docs/`. Same CNAME, .nojekyll, 404.html at root.

### D4: Twoslash type-checked code examples

`@shikijs/vitepress-twoslash` compiles TypeScript code blocks in Markdown against real types. If `fromBinary()` signature changes in `@kaiord/core` and a doc example uses the old signature, VitePress build fails. This is the **primary anti-drift mechanism**.

Requires: all `@kaiord/*` packages declared as devDependencies in docs package.json, so `--filter ...` builds them first.

### D5: TypeDoc auto-generated API reference (gitignored, build-time only)

`typedoc` + `typedoc-plugin-markdown` generates Markdown files from TSDoc comments at build time. Generated files are **gitignored** (not committed) to avoid noisy PR diffs and merge conflicts. They are generated during the prebuild step in CI and locally.

Packages covered: core, fit, tcx, zwo, garmin, garmin-connect, cli, mcp.

### D6: Claude Code pre-commit hook for doc sync (advisory, exit 0)

A hook in `.claude/settings.local.json` triggers on pre-commit. A shell script checks `git diff --cached --name-only` — if `packages/*/src/` files are staged but no `packages/docs/` files are staged, it prints a reminder. If docs are also staged, it passes silently. **Exit code is always 0 (advisory, not blocking)** — blocking commits on doc changes would be too aggressive since many code changes legitimately don't affect docs. The real gate is Twoslash in CI (build fails if code examples drift).

### D7: Content structure with Quick Start first

Sidebar ordered by developer journey (progressive disclosure — guides first, reference last):

```text
packages/docs/
├── .vitepress/
│   └── config.ts          ← VitePress config, nav, sidebar, sitemap
├── guide/
│   ├── quick-start.md     ← NEW: 5-minute install→convert→done tutorial
│   ├── why-kaiord.md      ← NEW: problem framing, search-friendly
│   ├── getting-started.md ← Migrated from docs/getting-started.md
│   ├── architecture.md    ← Migrated from docs/architecture.md
│   ├── testing.md         ← Migrated from docs/testing.md
│   └── contributing.md    ← Migrated from CONTRIBUTING.md
├── formats/
│   ├── krd.md             ← Migrated from docs/krd-format.md
│   ├── fit.md             ← From packages/fit/README.md
│   ├── tcx.md             ← From packages/tcx/README.md
│   ├── zwo.md             ← From packages/zwo/README.md
│   └── gcn.md             ← From packages/garmin/README.md
├── api/                   ← AUTO-GENERATED by TypeDoc (gitignored)
│   ├── core.md
│   ├── fit.md
│   ├── tcx.md
│   ├── zwo.md
│   ├── garmin.md
│   ├── cli.md
│   └── mcp.md
├── cli/
│   └── commands.md        ← CLI command reference
├── mcp/
│   └── tools.md           ← MCP tool reference
└── index.md               ← Docs home: hero + 3-step visual + feature cards
```

Sidebar order: Quick Start > Why Kaiord > Guides > Formats > CLI > MCP > API Reference

Pages with 3+ headings show a sticky "On this page" outline sidebar (VitePress `outline` config). Code blocks have copy-to-clipboard button enabled (`markdown: { codeCopyButton: true }` or VitePress default). Footer includes GitHub Releases link for project activity signal.

### D8: Search and LLM support

VitePress built-in MiniSearch for local full-text search with Cmd+K shortcut. MiniSearch indexes all pages including auto-generated API reference (configured via VitePress `search` options). Zero-results state shows links to Quick Start and Formats overview.

`vitepress-plugin-llms` generates `llms.txt` as a first-class feature. Verification task includes feeding llms.txt to an LLM and testing 5 questions about Kaiord's API.

### D9: CI anti-drift checks

Added to the existing CI pipeline:

- **VitePress build** (includes Twoslash compilation) — fails if code examples are invalid
- **Link checker** — fails if internal links are broken
- **cspell** — fails on typos in doc content

These run on every PR that touches `packages/docs/**` or source packages.

### D10: Per-page SEO via VitePress frontmatter

Every documentation page uses VitePress frontmatter for unique `title` and `description`. VitePress auto-generates `<title>`, `<meta name="description">`, and `<link rel="canonical">` from these. OG tags injected via `head` config in `.vitepress/config.ts`.

VitePress built-in `sitemap` config (`sitemap: { hostname: 'https://kaiord.com' }`) auto-generates sitemap.xml for all doc pages. **Sitemap merge strategy**: the deploy script replaces the landing's static `sitemap.xml` with VitePress's auto-generated one (which includes all doc pages), then prepends the landing root URL entry. Single sitemap at `dist/sitemap.xml`.

### D11: JSON-LD structured data for docs

Each doc page includes JSON-LD via VitePress `transformHead` hook: `BreadcrumbList` for navigation hierarchy and `TechArticle` with author (Pablo Albaladejo). The docs home page uses `WebSite` schema with `SearchAction` for sitelinks search box eligibility.

### D12: OG image and per-page OG tags for docs

A default docs OG image (`docs-og-image.png`, 1200x630, < 100KB) is used for all doc pages via VitePress `head` config. Same dark background + Kaiord logo style as landing OG image, with "Documentation" subtitle. Per-page `og:title` and `og:description` are generated from VitePress frontmatter via `transformPageData` hook — each page gets unique OG metadata, not just the shared image.

### D13: System font stack and performance budget

The docs site uses the system font stack (no web font downloads) consistent with the landing page. Performance targets: LCP < 1.5s, CLS < 0.05, INP < 100ms, total JS < 150KB gzipped. MiniSearch index is lazy-loaded and does not block initial render.

### D14: Docs 404 page

VitePress custom 404 page (`not-found` layout) displays Kaiord branding on dark background with a search box and links to Quick Start and docs home. Consistent with the landing 404 pattern.

### D15: Mobile navigation

VitePress default sidebar collapses to hamburger on mobile (< 768px). Sidebar sections are collapsible. Search accessible from mobile nav via the hamburger menu. Touch targets meet 44x44px minimum.

## Risks / Trade-offs

**[TSDoc coverage gap]** → Current ~30% coverage means auto-generated API docs will be sparse initially. Mitigation: prioritize TSDoc for public API surface (exported functions/types). Internal implementation docs can wait.

**[Build time increase]** → TypeDoc + Twoslash + VitePress adds ~30-60s to CI. Mitigation: only run docs build when relevant paths change (path filters in CI).

**[Content migration effort]** → 20+ existing doc files need review and reformatting for VitePress. Mitigation: migrate as-is first, improve formatting iteratively. Don't block launch on perfect content.

**[Three-way merge complexity]** → Adding a third package to the deploy merge increases failure surface. Mitigation: artifact verification step checks for `docs/index.html`. Rollback: if docs build fails, the workflow fails before upload (verification step). If a broken deploy reaches production, use `workflow_dispatch` on last known-good SHA. Docs-only rollback is not possible since the deploy is a single artifact — but since docs failures are caught pre-deploy (Twoslash + verification), this risk is minimal.

**[Sitemap merge]** → Two sitemaps need merging. Mitigation: VitePress sitemap is primary; deploy script prepends landing root URL entry. Single sitemap at `dist/sitemap.xml`.
