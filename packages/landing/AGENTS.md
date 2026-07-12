<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# @kaiord/landing AGENTS.md

## Purpose

Marketing landing page for kaiord.com — a static single-page site built with Vite and Tailwind CSS v4. Introduces Kaiord, links to the docs site and workout SPA editor, and displays install commands for `@kaiord/core`. Contains no business logic or data persistence; purely presentation and marketing.

## Key Files

- **`index.html`** - Main page structure, hero, features grid, format hub diagram, code example, differentiators, and footer. Hand-authored, semantic HTML. Includes JSON-LD schema and OG meta tags.
- **`src/main.ts`** - Entrypoint. Manages package manager tabs (desktop WAI-ARIA tabs with arrow key navigation + mobile select), copy-to-clipboard, smooth anchor link scrolling, and analytics initialization.
- **`src/main.css`** - Tailwind imports + custom animations (fade-in-left, fade-in-right, pulse-slow). Imports shared brand tokens from `styles/brand-tokens.css`. Focus-visible ring styling unified across landing/docs/editor.
- **`src/analytics.ts`** - Creates the Umami analytics client, conditionally noop when no website id.
- **`src/setup-analytics.ts`** - Wires up analytics: tracks page views and click events (editor-opened, docs-opened, github-opened) on link selectors.
- **`vite.config.ts`** - Defines `conditionalUmami` plugin: strips UMAMI markers if no website id, otherwise inlines website id in the script tag.
- **`src/adapters/analytics/umami-analytics.ts`** - Factory to create Analytics from core, wraps window.umami with error handling.
- **`src/adapters/analytics/umami-analytics.test.ts`** - vitest tests for website id falsy, tracker available, tracker absent, and track throwing.
- **`src/types/umami.d.ts`** - TypeScript ambient types for window.umami.
- **`public/`** - Static assets: favicon (svg + png), apple-touch-icon, robots.txt, sitemap.xml, og-image.png, CNAME, 404.html, .nojekyll.
- **`public/fonts/`** - Inter variable font (latin subset, WOFF2).

## Subdirectories

See:

- **`src/AGENTS.md`** - TypeScript source files structure.
- **`src/adapters/`** - Analytics adapter (Umami).
- **`src/types/`** - TypeScript declarations.
- **`public/`** - Static assets and fonts.

## For AI Agents

### Working In This Directory

- **Zero backend** — this is a static site. No API routes, no server. All functionality client-side.
- **Vite + Tailwind v4** — modern SPA build tooling. Build target: `dist/` (HTML + CSS + JS).
- **Brand tokens** — import `@import "../../../styles/brand-tokens.css"` in CSS to access design system (colors, fonts, spacing). Do NOT hardcode colors.
- **Environment variable** — `VITE_UMAMI_WEBSITE_ID` controls whether the Umami tracker is inlined or stripped. Accessed via `import.meta.env.VITE_UMAMI_WEBSITE_ID` in TypeScript.
- **Monorepo reference** — depends on `@kaiord/core` (type-only: `Analytics`, `AnalyticsEvent`, `createNoopAnalytics`). No runtime conversion or data processing happens here.

### Testing Requirements

- **vitest** — `pnpm --filter @kaiord/landing test`
- **jsdom** — tests run in jsdom environment (suitable for DOM manipulation tests).
- **Test coverage** — analytics adapter and DOM setup should be tested. No coverage minimum specified; aim for practical coverage.
- **AAA pattern** — every test must have `// Arrange`, `// Act`, `// Assert` blocks.
- **Titles** — every `it()` title must start with `"should "`.

### Common Patterns

- **Package manager selector** — desktop: WAI-ARIA tabs with left/right arrow navigation. Mobile: HTML `<select>`. Both update the displayed command.
- **Smooth scroll** — `scrollIntoView({ behavior: "smooth" })` for anchor links.
- **Copy to clipboard** — `navigator.clipboard.writeText()`. Gracefully fails in insecure contexts (HTTP).
- **Analytics flow** — on DOMContentLoaded, call `setupAnalytics()` which registers click handlers and initial pageView.

## Dependencies

### Internal

- `@kaiord/core` — type-only import: `Analytics`, `AnalyticsEvent`, `createNoopAnalytics()`. No runtime dependency.

### External

- **`@tailwindcss/vite`** v4.2.4 — Tailwind CSS v4 Vite plugin.
- **`tailwindcss`** v4.2.4 — Tailwind CSS engine.
- **`vite`** v8.0.9 — Build tool.
- **`vitest`** v4.1.5 — Test runner.
- **`jsdom`** v29.1.1 — DOM environment for tests.
- **`typescript`** ~6.0.3 — Type checking.
- **`prettier`** — via monorepo root (formatting only, not explicitly listed in package.json).

## Notes

- **Vite plugin: conditionalUmami** — Custom plugin in `vite.config.ts`. Uses regex to strip `<!-- UMAMI_START -->...<!-- UMAMI_END -->` if no website id, or remove comments and substitute `%VITE_UMAMI_WEBSITE_ID%` if present. Runs during HTML transform.
- **Focus-visible styling** — Unified with docs and editor via shared CSS in `src/main.css`. 2px outline, currentColor, 2px offset.
- **No personal data** — Site uses Umami (open-source, cookieless, no personal data collected). Disclosure in footer.

<!-- MANUAL: -->
