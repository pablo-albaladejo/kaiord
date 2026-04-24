## 1. Core — Port and Noop Adapter

- [ ] 1.1 Create `packages/core/src/ports/analytics.ts` with `Analytics` type and `AnalyticsEvent` alias
- [ ] 1.2 Create `packages/core/src/adapters/analytics/noop-analytics.ts` with `createNoopAnalytics()`
- [ ] 1.3 Write unit tests for noop adapter (`noop-analytics.test.ts`)
- [ ] 1.4 Export `Analytics`, `AnalyticsEvent`, and `createNoopAnalytics` from `packages/core/src/ports/index.ts` and `packages/core/src/index.ts`

## 2. Landing — Cloudflare Adapter and Wiring

- [ ] 2.1 Add Cloudflare Web Analytics beacon `<script>` tag to `packages/landing/index.html` using Vite's `%VITE_CF_ANALYTICS_TOKEN%` env-replacement pattern; wrap in a Vite `transformIndexHtml` plugin (or equivalent) that removes the `<script>` block entirely when the env var is empty or unset (empty token = tag omitted, no console errors)
- [ ] 2.2 Create `packages/landing/src/types/cf-beacon.d.ts` — ambient TypeScript declaration for `window.cfBeacon` (required for strict-mode compilation)
- [ ] 2.3 Create `packages/landing/src/adapters/analytics/cloudflare-analytics.ts` with `createCloudflareAnalytics(token: string | undefined): Analytics` — returns `createNoopAnalytics()` when token is falsy, otherwise wraps `window.cfBeacon` with `try/catch` guard
- [ ] 2.4 Write unit tests for the landing Cloudflare adapter (`cloudflare-analytics.test.ts`): noop on falsy token, calls beacon when present, silent on beacon absence
- [ ] 2.5 Create `packages/landing/src/analytics.ts` — instantiates and exports the singleton `analytics` object
- [ ] 2.6 Wire `analytics.pageView()` call on page load in `packages/landing/src/main.ts`
- [ ] 2.7 Wire `analytics.event('editor-opened')` on "Try the Editor" CTA click
- [ ] 2.8 Wire `analytics.event('github-opened')` on "Star on GitHub" link click
- [ ] 2.9 Wire `analytics.event('docs-opened')` on "Read the Docs" link click
- [ ] 2.10 Add `VITE_CF_ANALYTICS_TOKEN` to `.env.example` in the landing package (with placeholder value)

## 3. Editor — Cloudflare Adapter, Provider, and Hook

- [ ] 3.1 Add Cloudflare Web Analytics beacon `<script>` tag to `packages/workout-spa-editor/index.html` using the same `%VITE_CF_ANALYTICS_TOKEN%` + `transformIndexHtml` conditional-removal pattern as landing (task 2.1)
- [ ] 3.2 Create `packages/workout-spa-editor/src/types/cf-beacon.d.ts` — ambient TypeScript declaration for `window.cfBeacon`
- [ ] 3.3 Create `packages/workout-spa-editor/src/adapters/analytics/cloudflare-analytics.ts` with `createCloudflareAnalytics(token: string | undefined): Analytics` — returns `createNoopAnalytics()` when token is falsy, wraps `window.cfBeacon` with `try/catch` guard
- [ ] 3.4 Write unit tests for the editor Cloudflare adapter (`cloudflare-analytics.test.ts`): noop on falsy token, calls beacon when present, silent on beacon absence
- [ ] 3.5 Create `packages/workout-spa-editor/src/contexts/analytics-context.tsx` — `AnalyticsContext`, `AnalyticsProvider`, and `useAnalytics()` hook (defaults to noop when no provider ancestor)
- [ ] 3.6 Inject `AnalyticsProvider` with the Cloudflare adapter in `packages/workout-spa-editor/src/main.tsx`
- [ ] 3.7 Wire `analytics.event('editor-loaded')` on app mount (`useEffect` in root component)
- [ ] 3.8 Wire `analytics.event('workout-generated', { provider, sport })` after successful AI generation
- [ ] 3.9 Wire `analytics.event('workout-exported', { format })` after successful export
- [ ] 3.10 Wire `analytics.event('garmin-synced', { result: 'success' | 'failure' })` on Garmin Connect push completion (both outcomes)
- [ ] 3.11 Write unit tests for `useAnalytics()` hook — verify noop default and injected adapter forwarding
- [ ] 3.12 Write call-site tests for each instrumented event: verify `analytics.event` is called with the correct name and props when AI generation completes (`workout-generated`), export completes (`workout-exported`), and Garmin push completes for both success and failure (`garmin-synced`)
- [ ] 3.13 Add `VITE_CF_ANALYTICS_TOKEN` to `.env.example` in the editor package

## 4. Quality and Changeset

- [ ] 4.1 Add an analytics disclosure to both the landing footer and the editor footer (or a shared `/privacy` page linked from both) acknowledging Cloudflare Web Analytics is used — GDPR transparency applies to every page where tracking is active
- [ ] 4.2 Run `pnpm -r build` — verify zero build errors/warnings; inspect built `index.html` to confirm beacon `<script>` is absent when token is unset; grep built `assets/*.js` to confirm no literal Cloudflare token value appears outside the beacon script tag
- [ ] 4.3 Run `pnpm -r test` — verify all tests pass and coverage thresholds hold
- [ ] 4.4 Run `pnpm lint` — verify zero ESLint errors/warnings and zero TypeScript errors
- [ ] 4.5 Create changeset: `pnpm exec changeset` — patch bump for `@kaiord/core` only (new port export); `@kaiord/landing` and `@kaiord/workout-spa-editor` are private packages and require no changeset entry
