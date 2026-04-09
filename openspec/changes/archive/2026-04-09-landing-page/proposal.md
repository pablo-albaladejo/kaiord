## Why

Kaiord now owns the `kaiord.com` domain (Route 53 → GitHub Pages), but the site opens directly to the workout SPA editor with no branding, no value proposition, and default Vite favicon/title. There is no landing page explaining what Kaiord is, who it's for, or why it matters. Open-source projects live or die by their first impression — a compelling landing page is the single highest-leverage marketing asset for driving adoption by both end-users and developers.

## What Changes

- **New `@kaiord/landing` package** (`packages/landing/`): Static landing page built with Vite + Tailwind CSS 4, dark mode by default.
- **Landing page sections**: Sticky nav, hero with dual CTAs (primary: "Try the Editor", secondary: install command), user-facing features, format hub visual, developer-facing features (code examples, architecture, CLI/MCP), open-source section (capability metrics, "Star on GitHub"), footer.
- **Kaiord logo**: SVG symbol (hub/convergence concept) + "kaiord" wordmark, reusable across landing and editor.
- **Branding assets**: favicon.ico, apple-touch-icon.png, OG image (1200x630, < 100KB), shared brand color tokens, proper meta tags (OG, Twitter Cards, structured data).
- **SEO fundamentals**: `robots.txt`, `sitemap.xml`, canonical URLs, `<meta description>`, JSON-LD structured data (`SoftwareSourceCode`).
- **Deployment restructure**: Landing serves from `kaiord.com/`, SPA editor moves to `kaiord.com/editor/`. Deploy workflow merges both builds into a single GitHub Pages artifact with CNAME, .nojekyll, and branded 404.html.
- **Editor branding update**: Replace default Vite favicon, update page title from "workout-spa-editor" to "Kaiord Editor", add OG and Twitter Card meta tags.
- **Performance budget**: LCP < 1.5s, CLS = 0, TBT < 50ms, total page weight < 200KB gzipped.

## Capabilities

### New Capabilities

- `landing-page`: Static landing page for kaiord.com with sticky nav, hero, feature sections, code examples, and CTAs targeting both users and developers. Includes SEO fundamentals and performance budgets.
- `branding`: Kaiord logo (SVG), favicon, apple-touch-icon, OG image, Twitter Cards, shared brand color tokens, and structured data reusable across packages.

### Modified Capabilities

<!-- No existing spec-level behavior changes. The SPA editor functionality remains identical; only its serving path changes from / to /editor/. -->

## Impact

- **New package**: `packages/landing/` (Vite static site, Tailwind CSS 4, zero workspace dependencies)
- **Modified package**: `@kaiord/workout-spa-editor` — base path changes to `/editor/` via workflow env var (local dev unchanged at `/`), updated favicon/title/meta
- **Modified workflow**: `.github/workflows/deploy-spa-editor.yml` — renamed to `deploy-site.yml` in a single commit (self-reference path updated), builds landing + editor with targeted filters, merges dist outputs, verifies artifact before deploy
- **New shared assets**: Brand color tokens CSS file, logo SVG, favicon, OG image
- **New deployment files**: CNAME (`kaiord.com`) and .nojekyll in landing `public/`, branded 404.html
- **CI/CD**: No changes to test/lint/release pipelines; landing has no publishable npm package
- **DNS/Hosting**: No changes needed — `kaiord.com` already points to GitHub Pages
- **Hexagonal layers**: None affected — this is purely a frontend/deployment change, no domain/port/adapter modifications
