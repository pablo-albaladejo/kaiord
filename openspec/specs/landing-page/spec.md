> Synced: 2026-05-31

# Landing Page

## Purpose

Public landing page at `/` — content, layout, accessibility, performance, and SEO requirements that present Kaiord to first-time visitors and lead into the docs and editor.

## Requirements

### Requirement: Landing page serves at root path

The landing page SHALL be served at `kaiord.com/` as a static HTML page built from the `packages/landing/` package. The `<html>` element SHALL include `lang="en"`.

#### Scenario: User visits kaiord.com

- **WHEN** a user navigates to `https://kaiord.com/`
- **THEN** the landing page loads with the hero section visible in the first viewport

#### Scenario: Landing page is static

- **WHEN** the landing page is built
- **THEN** the output SHALL be static HTML + CSS + minimal JS with no framework hydration

### Requirement: Sticky navigation

The landing page SHALL have a sticky header containing the Kaiord logo wordmark, smooth-scroll anchor links to the in-page sections ("Features", "Developers", "Open Source"), a "Docs" link pointing to `/docs/`, a "GitHub" link, and a primary "Try the Editor" CTA linking to `/editor/`. On mobile (below ~860px) the nav SHALL collapse to a minimal bar with logo, a "Docs" link, and the "Try the Editor" CTA.

#### Scenario: Nav persists on scroll

- **WHEN** a user scrolls past the hero section
- **THEN** the sticky nav SHALL remain visible at the top of the viewport with the primary CTAs accessible

#### Scenario: Docs link in nav

- **WHEN** the landing page renders
- **THEN** the sticky nav SHALL include a "Docs" link that navigates to `kaiord.com/docs/`

#### Scenario: Anchor links work

- **WHEN** a user clicks a section link in the nav
- **THEN** the page SHALL smooth-scroll to that section

### Requirement: Hero with audience fork

The hero SHALL present an explicit audience fork rather than a single product pitch: a centered eyebrow pill, the neutral headline "One framework. Every fitness format." (the second line accented), and the subtitle "Whether you train or you build — pick your path." Below the headline the hero SHALL display two equal path cards, side-by-side on desktop and stacked on mobile:

1. **For athletes — "Use the editor"** (sky accent): copy, an editor device mockup, and a primary "Open the Editor" CTA linking to `/editor/`.
2. **For developers — "Build with the SDK"** (purple accent): copy, the `convert.ts` code block, a static `npm i @kaiord/core` row, and a soft "Read the Docs" CTA linking to `/docs/`.

The hero SHALL NOT display "100% AI-coded" or "Zero infrastructure" badges (the AI-coded claim is demoted to a single line near the open-source section; see Differentiators).

#### Scenario: User clicks Open the Editor

- **WHEN** a user clicks the athlete card's "Open the Editor" CTA
- **THEN** the browser navigates to `kaiord.com/editor/`

#### Scenario: Developer reads the docs

- **WHEN** a user clicks the developer card's "Read the Docs" CTA
- **THEN** the browser navigates to `kaiord.com/docs/`

#### Scenario: Cards stack on mobile

- **WHEN** the viewport is below ~860px
- **THEN** the two path cards SHALL stack vertically (athletes above developers) instead of sitting side-by-side

### Requirement: User-facing showcase section

The landing page SHALL include an athlete-facing showcase section (`id="features"`) with the eyebrow "For athletes" and heading "Plan, generate, sync.". It SHALL pair an editor device mockup with three feature rows — Visual workout editor, AI workout generation, and One-tap Garmin sync. This section SHALL appear BEFORE the format hub visual.

#### Scenario: Showcase renders

- **WHEN** the showcase section renders
- **THEN** the editor mockup and three feature rows (each with an icon, title, and description) SHALL be visible

### Requirement: Format hub visual section

The landing page SHALL include a visual section ("One hub. Every format.") showing format convergence through KRD as a **radial** diagram: a central KRD hub with `.FIT`, `.TCX`, `.ZWO`, and `.GCN` arranged around it (N/W/E/S) and bidirectional connectors between each format and the hub. CSS animations SHALL only use `transform` and `opacity` properties for GPU compositing.

#### Scenario: Format hub is visible

- **WHEN** a user scrolls past the showcase section
- **THEN** a radial diagram with the KRD hub centered and FIT/TCX/ZWO/GCN around it (bidirectional connectors) SHALL be displayed with CSS animations

#### Scenario: Reduced motion respected

- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** all CSS animations SHALL be disabled or simplified to static presentation

### Requirement: Developer-facing features section

The landing page SHALL include a developer section (`id="developers"`, "Convert fitness data in 4 lines.") containing: an interactive install-command widget (npm/yarn/pnpm/bun tabs on desktop, native `<select>` on mobile, with a copy-to-clipboard button), the `convert.ts` code example (4 lines showing FIT → KRD → TCX conversion), and a six-item capability grid (TypeScript-first, Hexagonal architecture, Plugin system, CLI, MCP server, 5 format adapters).

#### Scenario: Code example renders with syntax highlighting

- **WHEN** the developer section renders
- **THEN** a syntax-highlighted TypeScript code example SHALL be displayed showing the core conversion API, using build-time pre-highlighted HTML (no runtime JS highlighting library)

#### Scenario: Install command tabs

- **WHEN** the developer section renders
- **THEN** an install command (`npm i @kaiord/core`) SHALL be shown with package-manager tabs for npm, yarn, pnpm, and bun (a native `<select>` on mobile); selecting one SHALL swap the displayed command

#### Scenario: Copy to clipboard

- **WHEN** a user clicks the copy button next to the install command
- **THEN** the command text SHALL be copied to the clipboard, the icon SHALL briefly flip to a checkmark, AND visual feedback ("Copied!") SHALL be announced in an `aria-live="polite"` region, reverting after ~1.4 seconds

### Requirement: Differentiators section

The landing page SHALL include a differentiators section with ONE prominent card and ONE demoted line:

1. **Zero infrastructure** (prominent card, "No servers. No accounts. No cloud."): everything runs locally or in-browser with no servers, accounts, or cloud dependencies — CLI converts files on your machine, the SPA editor runs in the browser, the MCP server integrates with local AI tools. The card SHALL include chips: CLI, SPA editor, MCP, Browser extension.
2. **AI-coded** (single demoted line, NOT a full card): "Every line — domain, adapters, editor, this page — written by AI agents." followed by a "See the commits →" link to the commit history.

#### Scenario: Differentiators display

- **WHEN** a user scrolls to the differentiators section
- **THEN** the prominent "Zero infrastructure" card SHALL be visible with its chips, followed by a single demoted AI-coded line with a "See the commits" link to the commit history

### Requirement: Open source section

The landing page SHALL include an open-source section (`id="open-source"`, "Built in the open.") with four stat cards — "5" (format adapters), "100%" (round-trip safe), "MIT" (licensed), and "0" (backend services) — and a "Star on GitHub" button (without count).

#### Scenario: Open source links work

- **WHEN** a user clicks the "Star on GitHub" button
- **THEN** the browser navigates to `https://github.com/pablo-albaladejo/kaiord`

### Requirement: Footer

The landing page SHALL include a footer with the Kaiord logo, GitHub link, npm link, MIT license reference, and personal attribution: "Built by Pablo Albaladejo" with a link to his LinkedIn profile. The footer SHALL also include a link to his GitHub profile.

#### Scenario: Footer renders

- **WHEN** the page is scrolled to the bottom
- **THEN** the footer SHALL display with all links functional including the author attribution link to LinkedIn

#### Scenario: Author discoverability

- **WHEN** a visitor wants to know who built Kaiord
- **THEN** the footer SHALL display "Built by Pablo Albaladejo" as a clickable link to his LinkedIn profile

### Requirement: Dark mode default

The landing page SHALL render in dark mode with no theme toggle. Background SHALL be dark, text SHALL be light, and code examples SHALL use dark syntax highlighting.

#### Scenario: Landing loads in dark mode

- **WHEN** the landing page loads
- **THEN** the `<html>` element SHALL have dark background colors regardless of system preference

### Requirement: Responsive layout

The landing page SHALL be responsive and render correctly on mobile (360px), tablet (768px), and desktop (1280px+) viewports.

#### Scenario: Mobile layout

- **WHEN** the viewport is 360px wide
- **THEN** all sections SHALL stack vertically, feature grids SHALL display as single column, install command SHALL show a native `<select>` dropdown (defaulting to npm) instead of tabs, and text SHALL remain readable

#### Scenario: Mobile code example overflow

- **WHEN** the code example overflows horizontally on mobile
- **THEN** a visual gradient fade on the right edge SHALL indicate scrollable content

### Requirement: Accessibility

The landing page SHALL meet WCAG 2.2 AA compliance. All interactive elements SHALL be keyboard-accessible with visible focus indicators and a minimum touch target of 44x44px on mobile viewports. Semantic HTML landmarks SHALL be used (`<header>`, `<main>`, `<section>`, `<nav>`, `<footer>`). Color combinations SHALL meet WCAG AA contrast ratios (4.5:1 body text, 3:1 large text). External links (GitHub, npm) SHALL open in new tabs with `target="_blank"` and `rel="noopener noreferrer"`.

#### Scenario: Keyboard navigation

- **WHEN** a user navigates the page using only the keyboard
- **THEN** every interactive element (CTAs, links, tabs, copy button) SHALL be reachable via Tab and activatable via Enter/Space with visible focus indicators

#### Scenario: Screen reader

- **WHEN** the format hub animation is read by a screen reader
- **THEN** an `aria-label` or descriptive text alternative SHALL convey the format convergence concept

#### Scenario: Skip to main content

- **WHEN** a keyboard user presses Tab as the first action on the page
- **THEN** a visually-hidden "Skip to main content" link SHALL become visible and, when activated, move focus to the `<main>` element

### Requirement: Performance budget

The landing page SHALL achieve a Lighthouse Performance score of 95+ on mobile. LCP SHALL be under 1.5s on 4G. CLS SHALL be 0. TBT SHALL be under 50ms. Total transfer size SHALL be under 200KB gzipped (excluding OG image). The LCP-critical element in the hero SHALL use `fetchpriority="high"`. Below-fold images (if any) SHALL use `loading="lazy"`. All visual assets on the landing page SHALL be SVG or CSS-only (no raster images on-page; the OG PNG is for social sharing only).

#### Scenario: Lighthouse audit passes

- **WHEN** Lighthouse is run on the deployed landing page in mobile emulation
- **THEN** the Performance score SHALL be 95 or higher

### Requirement: SEO fundamentals

The landing page SHALL include: `robots.txt` (allow `/`, disallow `/editor/`, allow `/docs/`), `sitemap.xml` with `<lastmod>` and documentation page URLs, `<link rel="canonical">` pointing to `https://kaiord.com/`, and JSON-LD structured data (`@type: SoftwareSourceCode` with name, description, url, programmingLanguage, license, codeRepository, and `author` with `@type: Person`, name "Pablo Albaladejo", and sameAs linking to LinkedIn and GitHub profiles).

#### Scenario: Search engine crawl

- **WHEN** a search engine crawls `kaiord.com`
- **THEN** `robots.txt` SHALL be accessible at `/robots.txt`, `sitemap.xml` at `/sitemap.xml`, and structured data SHALL be valid per Google Rich Results Test

#### Scenario: Docs crawlable

- **WHEN** a search engine crawls `kaiord.com/robots.txt`
- **THEN** `/docs/` SHALL be allowed (not disallowed)

#### Scenario: Docs in sitemap

- **WHEN** a search engine reads `kaiord.com/sitemap.xml`
- **THEN** documentation URLs SHALL be included

### Requirement: SPA editor served at /editor/ path

The SPA editor SHALL be served at `kaiord.com/editor/` with full functionality preserved. The editor's `VITE_BASE_PATH` SHALL be set to `/editor/` in the deploy workflow env var only (local dev remains at `/`).

#### Scenario: Editor loads at /editor/

- **WHEN** a user navigates to `https://kaiord.com/editor/`
- **THEN** the workout SPA editor loads and functions identically to the current deployment

#### Scenario: Local dev unaffected

- **WHEN** a developer runs `pnpm --filter @kaiord/workout-spa-editor dev`
- **THEN** the editor SHALL serve at `localhost:5173/` with base path `/`

### Requirement: Branded 404 page

A `404.html` SHALL be served for any non-existent path. It SHALL display the Kaiord logo on a dark background with links to `/` (landing) and `/editor/` (editor). No SPA redirect JS is needed (the editor has no client-side router).

#### Scenario: User hits non-existent path

- **WHEN** a user navigates to `kaiord.com/nonexistent`
- **THEN** a branded 404 page SHALL be displayed with links to the landing page and editor

### Requirement: Unified deployment with verification

A single GitHub Actions workflow SHALL build both the landing page and the SPA editor using targeted filters, merge their outputs, verify the artifact structure, and deploy to GitHub Pages. The merged artifact SHALL include CNAME and .nojekyll at root.

#### Scenario: Deploy workflow produces verified merged output

- **WHEN** the deploy workflow runs
- **THEN** the output artifact SHALL contain `index.html` (landing), `editor/index.html` (editor), `CNAME`, `.nojekyll`, `404.html`, `robots.txt`, and `sitemap.xml` at root — all verified before upload
