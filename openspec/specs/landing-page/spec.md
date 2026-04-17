> Synced: 2026-04-17

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

The landing page SHALL have a sticky header containing the Kaiord logo wordmark, a "Docs" link pointing to `/docs/`, and primary CTAs ("Try the Editor", "GitHub"). The nav SHALL include smooth-scroll anchor links to each section. On mobile, the nav SHALL collapse to a minimal bar with logo and one CTA.

#### Scenario: Nav persists on scroll

- **WHEN** a user scrolls past the hero section
- **THEN** the sticky nav SHALL remain visible at the top of the viewport with the primary CTAs accessible

#### Scenario: Docs link in nav

- **WHEN** the landing page renders
- **THEN** the sticky nav SHALL include a "Docs" link that navigates to `kaiord.com/docs/`

#### Scenario: Anchor links work

- **WHEN** a user clicks a section link in the nav
- **THEN** the page SHALL smooth-scroll to that section

### Requirement: Hero section with dual CTAs

The hero section SHALL display the tagline "One framework. Every fitness format.", the subtitle "A TypeScript framework for converting between FIT, TCX, ZWO, and Garmin Connect formats. Use the visual editor or build with the SDK.", two call-to-action buttons: "Try the Editor" (primary, filled button) linking to `/editor/` and an install command (secondary) with copy-to-clipboard, and two highlight badges below the CTAs: "100% AI-coded" and "Zero infrastructure".

#### Scenario: User clicks Try the Editor

- **WHEN** a user clicks the "Try the Editor" CTA
- **THEN** the browser navigates to `kaiord.com/editor/`

#### Scenario: Developer sees install command

- **WHEN** the hero section renders
- **THEN** an install command (`npm install @kaiord/core`) SHALL be displayed with tabs for npm, yarn, pnpm, and bun

#### Scenario: Copy to clipboard

- **WHEN** a user clicks the copy icon next to the install command
- **THEN** the command text SHALL be copied to the clipboard AND visual feedback ("Copied!") SHALL be shown for 2 seconds in an `aria-live="polite"` region so assistive technology announces it

### Requirement: User-facing features section

The landing page SHALL include a section showcasing features for end users: Visual Workout Editor, AI Workout Generation, and Garmin Connect integration. This section SHALL appear BEFORE the format hub visual.

#### Scenario: Feature cards display

- **WHEN** the user-facing section renders
- **THEN** three feature cards SHALL be visible with titles, descriptions, and a CTA linking to the editor

### Requirement: Format hub visual section

The landing page SHALL include a visual section showing the format convergence through KRD: FIT, TCX, ZWO, and GCN formats flowing into and out of KRD as the canonical hub. CSS animations SHALL only use `transform` and `opacity` properties for GPU compositing.

#### Scenario: Format hub is visible

- **WHEN** a user scrolls past the user features section
- **THEN** a visual diagram showing format flow (FIT/TCX/ZWO/GCN ↔ KRD) SHALL be displayed with CSS animations

#### Scenario: Reduced motion respected

- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** all CSS animations SHALL be disabled or simplified to static presentation

### Requirement: Developer-facing features section

The landing page SHALL include a section with a code example (4 lines showing FIT → KRD → TCX conversion), a feature grid (TypeScript-first, Hexagonal architecture, Plugin system, CLI, MCP), and links to npm/docs.

#### Scenario: Code example renders with syntax highlighting

- **WHEN** the developer section renders
- **THEN** a syntax-highlighted TypeScript code example SHALL be displayed showing the core conversion API, using build-time pre-highlighted HTML (no runtime JS highlighting library)

### Requirement: Differentiators section

The landing page SHALL include a section highlighting two key differentiators:

1. **100% AI-coded**: Every line of code written by AI agents (Claude Code). No human-written code. This is a real-world showcase of AI-assisted software development at scale.
2. **Zero infrastructure**: Everything runs locally or in-browser with no servers, no accounts, no cloud dependencies. CLI converts files on your machine, SPA runs in the browser, MCP integrates with your local AI tools.

#### Scenario: Differentiators display

- **WHEN** a user scrolls to the differentiators section
- **THEN** two cards SHALL be visible: one explaining the AI-coded nature with a link to the commit history as proof, and one explaining the zero-infra philosophy with examples (CLI, SPA, MCP)

### Requirement: Open source section

The landing page SHALL include a section with capability metrics ("5 format adapters", "100% round-trip safe", "80%+ test coverage"), README badges (CI, coverage, TypeScript), a "Star on GitHub" button (without count), and MIT license reference.

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
