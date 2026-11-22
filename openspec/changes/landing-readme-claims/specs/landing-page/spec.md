## MODIFIED Requirements

### Requirement: Sticky navigation

The landing page SHALL have a sticky header containing the Kaiord logo wordmark, smooth-scroll anchor links to the in-page sections ("Features", "Health", "Connections", "Developers"), a "Docs" link pointing to `/docs/`, a "GitHub" link, and a primary "Open the App" CTA linking to `/app/`. On mobile (below ~860px) the nav SHALL collapse to a minimal bar with logo, a "Docs" link, and the "Open the App" CTA.

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

The hero SHALL present an explicit audience fork rather than a single product pitch: a centered eyebrow pill, the headline "Your training and health data. In one place." (the second line accented), and the subtitle "Whether you train or you build — pick your path." Below the headline the hero SHALL display two equal path cards, side-by-side on desktop and stacked on mobile:

1. **For athletes — "Kaiord App"**: copy, a device mockup of the App, and a primary "Open the App" CTA linking to `/app/`.
2. **For developers — "Kaiord SDK"**: copy, the `convert.ts` code block, a static install row for the packages the code block imports, and a soft "Read the Docs" CTA linking to `/docs/`.

The hero SHALL NOT display "100% AI-coded" or "No accounts" badges (the AI-coded claim is demoted to a single line near the open-source section; see Differentiators).

#### Scenario: User clicks Open the Editor

- **WHEN** a user clicks the athlete card's "Open the App" CTA
- **THEN** the browser navigates to `kaiord.com/app/`

#### Scenario: Developer reads the docs

- **WHEN** a user clicks the developer card's "Read the Docs" CTA
- **THEN** the browser navigates to `kaiord.com/docs/`

#### Scenario: Cards stack on mobile

- **WHEN** the viewport is below ~860px
- **THEN** the two path cards SHALL stack vertically (athletes above developers) instead of sitting side-by-side

### Requirement: User-facing showcase section

The landing page SHALL include an athlete-facing showcase section (`id="features"`) with the eyebrow "For athletes" and heading "Your week, from plan to watch.". It SHALL pair a device mockup of the App with three feature rows — Workout builder, Where each workout stands, and Templates. This section SHALL appear BEFORE the format visual.

#### Scenario: Showcase renders

- **WHEN** the showcase section renders
- **THEN** the mockup and three feature rows (each with an icon, title, and description) SHALL be visible

### Requirement: Format hub visual section

The landing page SHALL include a visual section ("One model. Four formats.") showing that every format adapter converts to and from KRD, the Kaiord SDK's internal canonical model, as a **radial** diagram: a central KRD hub with `.FIT`, `.TCX`, `.ZWO`, and `.GCN` arranged around it (N/W/E/S) and bidirectional connectors between each format and the hub. The section SHALL NOT call the conversions lossless or round-trip safe. CSS animations SHALL only use `transform` and `opacity` properties for GPU compositing.

#### Scenario: Format hub is visible

- **WHEN** a user scrolls past the showcase section
- **THEN** a radial diagram with the KRD hub centered and FIT/TCX/ZWO/GCN around it (bidirectional connectors) SHALL be displayed with CSS animations

#### Scenario: Reduced motion respected

- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** all CSS animations SHALL be disabled or simplified to static presentation

### Requirement: Developer-facing features section

The landing page SHALL include a developer section (`id="developers"`, "Convert a workout in TypeScript.") containing: an interactive install-command widget (npm/yarn/pnpm/bun tabs on desktop, native `<select>` on mobile, with a copy-to-clipboard button), the `convert.ts` code example (FIT → KRD → TCX with `fromBinary` and `toText` from `@kaiord/core`, run as published by `packages/cli/src/tests/landing-code-example.test.ts`), and a six-item capability grid (TypeScript-first, Hexagonal architecture, Your own adapters, CLI, MCP server, 4 formats).

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

1. **No accounts** (prominent card, "No accounts. No user data on Kaiord's servers."): the athlete's data lives in IndexedDB on their device and leaves it only to destinations they set up — the AI provider whose key they enter, the platforms they connect through their extensions, and their own Google Drive if they turn on sync; Kaiord's own servers only serve the site and convert workouts in transit, and store nothing. The card SHALL include chips: CLI, Kaiord App, MCP, Browser extensions.
2. **AI-coded** (single demoted line, NOT a full card): "Every line — domain, adapters, editor, this page — written by AI agents." followed by a "See the commits →" link to the commit history.

#### Scenario: Differentiators display

- **WHEN** a user scrolls to the differentiators section
- **THEN** the prominent "No accounts" card SHALL be visible with its chips, followed by a single demoted AI-coded line with a "See the commits" link to the commit history

### Requirement: Open source section

The landing page SHALL include an open-source section (`id="open-source"`, "Built in the open.") with four stat cards — "4" (formats), "5" (browser extensions), "MIT" (licensed), and "0" (accounts) — each count proven by a file or test in `claims/landing.json`, and a "Star on GitHub" button (without count).

#### Scenario: Open source links work

- **WHEN** a user clicks the "Star on GitHub" button
- **THEN** the browser navigates to `https://github.com/pablo-albaladejo/kaiord`
