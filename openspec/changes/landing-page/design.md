## Context

Kaiord owns `kaiord.com` (Route 53 delegation to GitHub Pages). The current deployment serves the workout SPA editor directly at the root with no landing page, no branding, and default Vite metadata. The monorepo already uses pnpm workspaces with packages for core, adapters, CLI, MCP, and the SPA editor.

Research of 12 top OSS landing pages (Vite, Astro, Tailwind, Bun, tRPC, shadcn/ui, etc.) identified consistent patterns: dark mode default, hero with install command, code examples over descriptions, quantified claims, and dual CTAs. Expert review by 5 specialists (UX, Frontend Architecture, OSS Marketing, SEO/Performance, CI/CD) identified 15 improvements incorporated into this design.

## Goals / Non-Goals

**Goals:**

- Create a compelling landing page at `kaiord.com/` that communicates Kaiord's value to both users and developers
- Establish visual brand identity (logo, favicon, OG image, shared color tokens)
- Move SPA editor to `kaiord.com/editor/` without breaking functionality
- Unified deploy pipeline: single workflow builds and deploys both landing + editor
- SEO-ready: structured data, sitemap, robots.txt, meta description, Twitter Cards
- Performance-budgeted: LCP < 1.5s, CLS = 0, TBT < 50ms, < 200KB gzipped

**Non-Goals:**

- Server-side rendering or dynamic content (purely static)
- Blog, documentation site, or changelog (future work — acknowledged as key organic traffic driver)
- Custom domain for the editor (stays under same domain)
- Internationalization (English only)
- Analytics integration (future work)
- Interactive converter widget on landing (future work — v1 uses static code examples)

## Decisions

### D1: Vite static site for landing (not Astro/Next.js)

The landing is a single page with no routing, no content collections, no SSR needs. Astro and Next.js add complexity for zero benefit here. Vite with vanilla TypeScript + Tailwind CSS 4 produces the smallest, fastest output and is already the monorepo's build tool.

**Alternatives considered:**

- **Astro**: Better for multi-page content sites; overkill for a single landing page. Adds a new framework dependency.
- **Plain HTML/CSS**: Simpler but loses Tailwind, TypeScript, and component reuse. Harder to maintain.

### D2: New package `packages/landing/` in monorepo

Keeps everything in one repo, shares tooling (ESLint, Prettier, Tailwind config), and enables a single deploy workflow. The landing package is `private: true` (not published to npm). **Zero workspace `@kaiord/*` dependencies** — this keeps the build fast and avoids triggering rebuilds when core packages change.

### D3: Deployment merge strategy

The deploy workflow builds both packages independently using targeted filters (`pnpm --filter @kaiord/landing... build` and `pnpm --filter @kaiord/workout-spa-editor... build`), then merges their `dist/` outputs:

```
dist/               ← landing build output (index.html, assets/)
dist/CNAME          ← "kaiord.com" (preserves custom domain)
dist/.nojekyll      ← disables Jekyll processing
dist/404.html       ← branded 404 page with links to / and /editor/
dist/editor/        ← SPA editor build output (copied here)
```

The SPA editor's `VITE_BASE_PATH` is set to `/editor/` **only in the workflow env var** (not in .env or vite.config.ts defaults, which remain `/` for local dev).

**Artifact verification step** before upload checks: `index.html`, `editor/index.html`, `CNAME`, `.nojekyll`, `404.html`.

The workflow **always builds both packages** on any trigger — path filters control when the workflow runs, not what it builds, since the merged artifact must always be complete.

**Alternatives considered:**

- **Separate workflows**: Simpler per-workflow but creates race conditions on GitHub Pages deployment (only one active deployment at a time per repo).
- **Subdomain**: Requires additional DNS setup and a separate GitHub Pages source, adding operational overhead.

### D4: Logo as inline SVG component

The logo lives as a `.svg` file in `packages/landing/src/assets/` and is inlined at build time by Vite. This avoids extra HTTP requests and enables CSS-based theming (color changes with dark mode). The same SVG is copied to the editor package for header branding. Logo must work at 16px (favicon) through 200px (hero), so geometric simplicity is key.

### D5: Dark mode only (no toggle on landing)

The landing page is dark mode only. This is consistent with 10/12 top OSS sites studied, makes code examples pop with syntax highlighting, and avoids the complexity of a theme toggle for a static marketing page. The editor retains its existing light/dark toggle. **Contrast must meet WCAG AA** (4.5:1 body text, 3:1 large text) — sky blue `#0284c7` on dark backgrounds requires specific validation.

### D6: Shared brand color tokens

Brand colors are extracted into a shared CSS file at the repo root (`styles/brand-tokens.css`) — outside any package to avoid cross-package source imports. Semantic tokens: `--brand-bg-primary`, `--brand-bg-surface`, `--brand-text-primary`, `--brand-text-secondary`, `--brand-text-muted`, `--brand-accent-blue` (`#0284c7`), `--brand-accent-purple` (`#9333ea`), `--brand-border`. Both landing and editor `@import` this file via relative path. This prevents color drift without creating workspace dependencies.

### D7: No JavaScript framework for landing

The landing page is static HTML with Tailwind CSS. Animations use CSS only (`transform` and `opacity` properties exclusively for GPU compositing and zero layout shift). No React, no hydration, no client-side routing. Interactive elements (package manager tabs, copy-to-clipboard) use vanilla JS `<script>` tags. All animations respect `prefers-reduced-motion: reduce`.

### D8: Build-time syntax highlighting (no runtime JS)

Code examples use pre-highlighted HTML with CSS classes generated at build time (e.g., Shiki via Vite plugin or hand-crafted `<span>` elements with Tailwind color classes). No runtime highlighting library (Prism, highlight.js) is loaded. This guarantees zero CLS from unstyled code flashing and zero JS cost for syntax highlighting. The highlighted HTML is committed or generated during build.

### D9: System font stack (no web fonts)

The landing uses the system font stack (`font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`) for body text and a monospace stack for code blocks. This eliminates FOIT/FOUT, has zero font loading cost, and achieves optimal LCP. Consistent with the editor which already uses system fonts.

### D10: Section ordering — value before architecture

Based on expert review, sections are ordered to lead with user value before technical architecture:

1. **Sticky nav** (logo + CTAs, always visible)
2. **Hero** (tagline + subtitle + dual CTAs + install command + highlight badges: "100% AI-coded" + "Zero infrastructure")
3. **User features** (what you can do: editor, AI workouts, Garmin)
4. **Format hub** (how it works: FIT/TCX/ZWO/GCN ↔ KRD convergence)
5. **Developer features** (code example + feature grid + npm/docs links)
6. **Differentiators** (100% AI-coded with commit history proof + zero infra philosophy)
7. **Open source** (capabilities > star count for early-stage credibility)
8. **Footer** (logo, GitHub, npm, MIT, "Built by Pablo Albaladejo" + LinkedIn)

### D11: Simplified 404.html (no SPA redirect)

The editor has no client-side router (no react-router, no deep links). A 404.html with SPA redirect JS is unnecessary complexity. Instead, the 404.html is a simple branded page with the Kaiord logo and links to `/` (landing) and `/editor/` (editor). Dark background matching the landing to avoid flash.

### D12: Social proof strategy for early-stage project

Raw star/download counts can hurt credibility when low. Instead of displaying numbers, the open source section leads with **capability metrics**: "5 format adapters", "100% round-trip safe", "80%+ test coverage", "Hexagonal architecture". A simple "Star on GitHub" button (without count) and README badges (CI, coverage, TypeScript) provide credibility without exposing low numbers. Star count display can be enabled once > 100 stars.

## Risks / Trade-offs

**[Coupled deployment]** → Both landing and editor deploy together. A landing-only change triggers a full rebuild. Mitigation: targeted `--filter` builds keep it fast. Rollback: use `workflow_dispatch` on last known-good main commit SHA, or revert the breaking commit.

**[SPA editor path change]** → Moving from `/` to `/editor/` breaks existing bookmarks/links. Mitigation: GitHub Pages already redirects `pablo-albaladejo.github.io/kaiord` → `kaiord.com`. Old root URL now shows the landing page with a prominent "Try the Editor" CTA. No SEO impact (site was not indexed).

**[Logo quality]** → AI-generated or hand-crafted SVG may not meet quality bar. Mitigation: Start with a clean, minimal SVG (text + simple geometric shape). Must work at 16px for favicon. Iterate in future changes. The logo is a single SVG file, trivially replaceable.

**[Workflow rename]** → Renaming `deploy-spa-editor.yml` to `deploy-site.yml` requires updating the self-reference path trigger in the same commit, and deleting the old file. If not atomic, duplicate workflows could race. Mitigation: single commit with old file deleted and new file created with correct self-reference.

**[Limited discoverability]** → Without a blog or docs site, organic search traffic will be limited. Mitigation: SEO fundamentals (structured data, sitemap, meta description) maximize what a single page can achieve. Docs site is a documented future non-goal.
