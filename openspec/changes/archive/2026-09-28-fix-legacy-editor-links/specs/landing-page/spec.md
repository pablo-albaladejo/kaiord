## RENAMED Requirements

- FROM: `### Requirement: SPA editor served at /editor/ path`
- TO: `### Requirement: SPA editor served at /app/ path`

## MODIFIED Requirements

### Requirement: Sticky navigation

The landing page SHALL have a sticky header containing the Kaiord logo wordmark, smooth-scroll anchor links to the in-page sections ("Features", "Developers", "Open Source"), a "Docs" link pointing to `/docs/`, a "GitHub" link, and a primary "Try the Editor" CTA linking to `/app/`. On mobile (below ~860px) the nav SHALL collapse to a minimal bar with logo, a "Docs" link, and the "Try the Editor" CTA.

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

1. **For athletes — "Use the editor"** (sky accent): copy, an editor device mockup, and a primary "Open the Editor" CTA linking to `/app/`.
2. **For developers — "Build with the SDK"** (purple accent): copy, the `convert.ts` code block, a static `npm i @kaiord/core` row, and a soft "Read the Docs" CTA linking to `/docs/`.

The hero SHALL NOT display "100% AI-coded" or "Zero infrastructure" badges (the AI-coded claim is demoted to a single line near the open-source section; see Differentiators).

#### Scenario: User clicks Open the Editor

- **WHEN** a user clicks the athlete card's "Open the Editor" CTA
- **THEN** the browser navigates to `kaiord.com/app/`

#### Scenario: Developer reads the docs

- **WHEN** a user clicks the developer card's "Read the Docs" CTA
- **THEN** the browser navigates to `kaiord.com/docs/`

#### Scenario: Cards stack on mobile

- **WHEN** the viewport is below ~860px
- **THEN** the two path cards SHALL stack vertically (athletes above developers) instead of sitting side-by-side

### Requirement: SEO fundamentals

The landing page SHALL include: `robots.txt` (allow everything, `/docs/` and the legacy `/editor/` included: `/editor/` SHALL stay crawlable so engines read its canonical to `/app/`), `sitemap.xml` with `<lastmod>` and documentation page URLs, `<link rel="canonical">` pointing to `https://kaiord.com/`, and JSON-LD structured data (`@type: SoftwareSourceCode` with name, description, url, programmingLanguage, license, codeRepository, and `author` with `@type: Person`, name "Pablo Albaladejo", and sameAs linking to LinkedIn and GitHub profiles).

#### Scenario: Search engine crawl

- **WHEN** a search engine crawls `kaiord.com`
- **THEN** `robots.txt` SHALL be accessible at `/robots.txt`, `sitemap.xml` at `/sitemap.xml`, and structured data SHALL be valid per Google Rich Results Test

#### Scenario: Docs crawlable

- **WHEN** a search engine crawls `kaiord.com/robots.txt`
- **THEN** `/docs/` SHALL be allowed (not disallowed)

#### Scenario: Docs in sitemap

- **WHEN** a search engine reads `kaiord.com/sitemap.xml`
- **THEN** documentation URLs SHALL be included

### Requirement: SPA editor served at /app/ path

The SPA editor SHALL be served at `kaiord.com/app/` with full functionality preserved. The editor's `VITE_BASE_PATH` SHALL be set to `/app/` in the deploy workflow env var only (local dev remains at `/`). The legacy `kaiord.com/editor/` URL SHALL answer 200 with a page whose `rel="canonical"` is `https://kaiord.com/app/` and that redirects immediately to the editor; it SHALL NOT carry `noindex`. Site content SHALL link `/app/`, never `/editor/`.

#### Scenario: Editor loads at /app/

- **WHEN** a user navigates to `https://kaiord.com/app/`
- **THEN** the workout SPA editor loads and functions identically to the current deployment

#### Scenario: Editor loads at /editor/

- **WHEN** a user navigates to the legacy `https://kaiord.com/editor/`
- **THEN** the response status SHALL be 200
- **AND** the page SHALL carry `<link rel="canonical" href="https://kaiord.com/app/">` and no `noindex`
- **AND** the browser SHALL land on the editor at `/app/` immediately

#### Scenario: Content never links the legacy path

- **WHEN** a built landing, docs or SPA page links `https://kaiord.com/editor/`
- **THEN** `scripts/check-site-links.mjs` SHALL fail, naming the file and the link

#### Scenario: Local dev unaffected

- **WHEN** a developer runs `pnpm --filter @kaiord/workout-spa-editor dev`
- **THEN** the editor SHALL serve at `localhost:5173/` with base path `/`

### Requirement: Branded 404 page

A `404.html` SHALL be served for any non-existent path. It SHALL display the Kaiord logo on a dark background with links to `/` (landing) and `/app/` (editor). It SHALL carry the legacy path bridge in `<head>`, the redirect script `scripts/inject-spa-fallback.mjs` injects at deploy time so `/editor/<route>` URLs reach the matching `/app/#/<route>` (see spa-routing "Legacy path URLs bridge into the fragment form").

#### Scenario: User hits non-existent path

- **WHEN** a user navigates to `kaiord.com/nonexistent`
- **THEN** a branded 404 page SHALL be displayed with links to the landing page and editor

### Requirement: Unified deployment with verification

A single GitHub Actions workflow SHALL build both the landing page and the SPA editor using targeted filters, merge their outputs, verify the artifact structure, and deploy to GitHub Pages. The merged artifact SHALL include CNAME and .nojekyll at root.

#### Scenario: Deploy workflow produces verified merged output

- **WHEN** the deploy workflow runs
- **THEN** the output artifact SHALL contain `index.html` (landing), `app/index.html` (editor), `editor/index.html` (the legacy `/editor/` page), `CNAME`, `.nojekyll`, `404.html`, `robots.txt`, and `sitemap.xml` at root — all verified before upload
