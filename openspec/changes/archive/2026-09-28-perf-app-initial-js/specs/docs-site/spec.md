## MODIFIED Requirements

### Requirement: Performance budget

The docs site SHALL achieve Lighthouse Performance >= 90 on mobile (3 runs, median). LCP SHALL be under 1.5s. CLS SHALL be under 0.05. Total JS SHALL be under 150KB gzipped. The site SHALL download exactly one web font file: the brand Inter, self-hosted at `/docs/fonts/inter-var-latin.woff2`, copied at build time from the canonical `styles/fonts/inter-var-latin.woff2`. The theme SHALL extend `vitepress/theme-without-fonts`, and no page or theme file SHALL import `vitepress/theme`, so the Inter subsets VitePress bundles never ship. The `head` font preload and the `@font-face` `src` SHALL name that same file, and it SHALL exist in the build. MiniSearch index SHALL be lazy-loaded.

#### Scenario: Lighthouse passes

- **WHEN** Lighthouse is run on the deployed docs
- **THEN** Performance SHALL be >= 90 and exactly one web font download (`inter-var-latin.woff2`, status 200) SHALL be detected

#### Scenario: The preloaded font is missing from the build

- **WHEN** the docs build does not contain `fonts/inter-var-latin.woff2`, or contains any other `.woff2`
- **THEN** `packages/docs/scripts/single-font.test.mjs` fails under `REQUIRE_DOCS_DIST=1` (CI `build` job and deploy)

#### Scenario: The deployed font answers 404

- **WHEN** the deploy smoke requests `https://kaiord.com/docs/fonts/inter-var-latin.woff2`
- **THEN** any status other than 200 after the retries fails the deploy
