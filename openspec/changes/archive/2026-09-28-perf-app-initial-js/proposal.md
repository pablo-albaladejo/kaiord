> Completed: 2026-09-28

# Proposal: SPA initial-JS budget and a single docs font

## Why

The SEO audit reported `/app/` below 70 on Lighthouse mobile and asked for
route-level splitting, with telemetry, AI, health and sync behind `import()`.
Nothing in CI measured what the SPA loads before its first route renders, so a
static import could pull a lazy page back into the entry graph unnoticed.

The docs preloaded `/docs/fonts/inter-var-latin.woff2` and pointed their
`@font-face` at it, but no build step put the file there: in production the
preload was a 404, and the docs fell back to the 16 Inter subsets VitePress
bundles (through `vitepress/theme`, imported by `theme/index.ts` and by
`index.md`).

## What Changes

- SPA: `HealthSubRouter` and `NewWorkoutRoute` load lazily, still inside
  `guard()`; the Google Drive cloud sync and its encryption load on first
  sync use (`createLazyCloudSync`). Usage telemetry and the AI SDK were
  already outside the entry graph. `vite.config.ts` `codeSplitting.groups`
  stays: removing it measured no gain.
- `scripts/check-spa-initial-js.mjs` (`pnpm size:spa`) sums the gzip of the
  entry script and the modulepreloads in the SPA's `dist/index.html`; the
  CI `size-limit` job runs it with a budget of the measured size x 1.05.
- Docs: the theme and `index.md` use `vitepress/theme-without-fonts`;
  `scripts/copy-brand-font.mjs` copies `styles/fonts/inter-var-latin.woff2`
  into the gitignored `public/fonts/` at build; `single-font.test.mjs`
  checks the preload and the `@font-face` name one file that exists and is
  the only `.woff2` in the build; the deploy smoke requires a 200 on it.

## Capabilities

### Modified Capabilities

- `docs-site`: "Performance budget" now requires exactly one self-hosted
  Inter file instead of system fonts only.
- `spa-quality-gates`: adds "SPA initial JS budget" and "/app Lighthouse
  mobile score".

## Impact

- `packages/workout-spa-editor/src/{AppRoutes.tsx,lazy-pages.ts,main.tsx}`,
  `src/adapters/cloud-sync/{lazy-cloud-sync,create-app-cloud-sync}.ts`
- `packages/docs/{index.md,.gitignore,package.json}`,
  `.vitepress/theme/index.ts`, `scripts/{copy-brand-font.mjs,single-font.test.mjs}`
- `scripts/check-spa-initial-js.mjs`, `package.json` (`size:spa`),
  `.github/workflows/{ci.yml,deploy-site.yml}`, `docs/seo-observatory.md`
- No export of `packages/workout-spa-editor/design-system.ts` moves or
  changes name.
