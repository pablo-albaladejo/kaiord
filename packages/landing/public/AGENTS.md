<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# public/ AGENTS.md

## Purpose

Static assets served by Vite during development and included in the production build. Contains favicons, social metadata images, SEO files, and font assets. All files are served as-is; no processing occurs.

## Key Files

- **`favicon.svg`** — SVG favicon (modern browsers prefer SVG). Kaiord logo hexagon with compass rose.
- **`favicon.png`** — PNG fallback favicon (32x32, legacy browser support).
- **`apple-touch-icon.png`** — iOS home screen icon. Apple devices load this when bookmarking or adding to home screen.
- **`og-image.png`** — Open Graph image. Used by social platforms (Twitter, Facebook, LinkedIn) when sharing the link.
- **`robots.txt`** — SEO directive for search engines. Allows all crawlers.
- **`sitemap.xml`** — XML sitemap for search engines. Lists the single landing page (/).
- **`404.html`** — Custom 404 error page. Deployed to GitHub Pages as fallback.
- **`CNAME`** — GitHub Pages configuration. Points subdomain to kaiord.com.
- **`.nojekyll`** — Disables Jekyll processing on GitHub Pages. Forces direct HTML serving.

## Subdirectories

- **`fonts/`** — Web font files.

## For AI Agents

### Working In This Directory

- **Vite public folder** — all files in `public/` are copied to `dist/` as-is during build. Paths are absolute from root: `/favicon.svg`, `/robots.txt`, etc.
- **No processing** — unlike `src/`, these files are not transformed. What you put here is what gets deployed.
- **Git tracking** — SVG and text files are tracked in Git. Large binary images (PNG, WOFF2) are usually tracked but can be LFS if needed.
- **Cache busting** — static assets have far-future cache headers on production (Cloudflare). SVG and HTML can be updated; fonts use far-future expiry.

### Testing Requirements

- **No automated tests** — static assets are not tested. Manual verification: open `public/robots.txt`, check `CNAME` content, verify image dimensions.
- **Visual inspection** — favicons render correctly in browser tab and iOS home screen.
- **SEO inspection** — `sitemap.xml` and `robots.txt` are readable and valid XML/text.

### Common Patterns

- **Preload fonts** — `index.html` includes `<link rel="preload" href="/fonts/..." as="font" crossorigin>` to prioritize font loading.
- **Favicon link tags** — multiple tags for SVG (modern), PNG (fallback), and apple-touch-icon.
- **JSON-LD schema** — structured data in `index.html` references `/og-image.png` for social sharing.
- **Redirects via 404.html** — GitHub Pages routes 404s to custom 404.html which can redirect or show help.

## Dependencies

### Internal

- `index.html` — references all public assets via absolute paths.
- `src/main.css` — may reference `public/fonts/` via Tailwind or CSS imports.

### External

None.

## Notes

- **GitHub Pages deployment** — `.nojekyll` and `CNAME` are GitHub-specific. Landing page is deployed to `pablo-albaladejo/kaiord` GitHub Pages at the custom domain `kaiord.com`.
- **OG image** — 1200x630px PNG optimized for social platforms. Kaiord branding.
- **Sitemap** — minimal; only the single landing page. Tools may crawl anyway, but proper sitemap helps.
- **Apple touch icon** — 180x180px PNG (Apple's standard). iOS adds rounded corners and shine effect automatically.

<!-- MANUAL: -->
