# Analytics

The SPA editor uses the `Analytics` port (defined in `@kaiord/core/ports/analytics`) for all telemetry. The production adapter is **[Umami](https://umami.is/)** — an open-source, cookieless, privacy-first analytics service — wired at SPA bootstrap with a runtime opt-in.

## Production wiring

```
src/main.tsx
  ├── getUmamiWebsiteId()                     // reads window.__KAIORD_CONFIG__
  ├── createUmamiAnalytics(websiteId)         // noop if websiteId is undefined
  └── <AnalyticsProvider analytics={analytics}>
```

The adapter (`src/adapters/analytics/umami-analytics.ts`) forwards each `event(name, props)` call to `window.umami.track(name, props)` — the global tracker Umami injects into the page when the website id is present.

Page views are submitted manually. The editor loads the Umami tracker with `data-auto-track="false"` (Umami's automatic History-API tracking would record the full `/editor/…` URL), so `pageView(path)` calls `window.umami.track(props => ({ ...props, url: path }))` with the base-relative wouter path.

When the runtime website id is absent, empty, or still equals the placeholder `__UMAMI_WEBSITE_ID__`, the adapter falls back to `createNoopAnalytics()` from `@kaiord/core` and no events are sent.

## Runtime config injection (12-factor III + V)

The website id is **NOT** baked into the build. The compiled bundle is environment-agnostic — the same artifact ships to every deploy. The id is injected at deploy time via a runtime config object on `window`:

1. `index.html` contains an inline `<script>` block that initializes `window.__KAIORD_CONFIG__` with a placeholder value, e.g.:

   ```html
   <script>
     window.__KAIORD_CONFIG__ = window.__KAIORD_CONFIG__ || {
       umamiWebsiteId: "__UMAMI_WEBSITE_ID__",
     };
   </script>
   ```

2. A second inline `<script>` reads `window.__KAIORD_CONFIG__.umamiWebsiteId`. If it is non-empty AND does not start with `_` (a real website id is a UUID; the un-substituted placeholder starts with `__`), the script appends the Umami tracker `<script>` to `<head>` with the id in `data-website-id` and `data-auto-track="false"`. Otherwise it returns silently — no tracker is loaded. The guard checks the first character rather than comparing against the placeholder literal, because the deploy-time `sed` rewrites every occurrence of `__UMAMI_WEBSITE_ID__` in the file — a literal comparison would be rewritten too and always match.

3. `src/main.tsx` calls `getUmamiWebsiteId()` (`src/lib/runtime-config.ts`) which returns `undefined` for the same "no id" cases, so the analytics adapter selects the no-op path. (This accessor lives in the compiled bundle, which the deploy `sed` never touches, so it safely compares against the placeholder constant.)

4. The `||` fallback in step 1 lets earlier scripts (e.g., Playwright `addInitScript` in e2e tests) pre-seed `window.__KAIORD_CONFIG__` and have those values win.

## Activating analytics in a deploy

The deploy step substitutes the placeholder string inside the deployed `index.html`. The pipeline (`.github/workflows/deploy-site.yml`, "Substitute analytics website id" step) does this with `sed`:

```bash
if [ -n "$UMAMI_WEBSITE_ID" ]; then
  sed -i "s|__UMAMI_WEBSITE_ID__|${UMAMI_WEBSITE_ID}|g" \
    packages/workout-spa-editor/dist/index.html
fi
```

The website id is **public** (it identifies the site to Umami's ingest endpoint) — there are no secrets to handle here. To disable analytics for a deploy, simply skip the substitution step (or leave the secret unset); the placeholder remains and the noop adapter wins.

## Testing analytics locally

For local manual verification:

1. Build the SPA: `pnpm --filter @kaiord/workout-spa-editor build`.
2. Replace the placeholder in the served `index.html`:

   ```bash
   sed -i '' "s|__UMAMI_WEBSITE_ID__|<your-umami-website-id>|g" \
     packages/workout-spa-editor/dist/index.html
   ```

3. Serve `dist/` (e.g. `npx serve packages/workout-spa-editor/dist`) and verify the Umami tracker `<script>` is in the document head and events appear in the Umami dashboard.

In the e2e suite (`e2e/spa-route-refresh.spec.ts`), Playwright's `addInitScript` injects `window.__KAIORD_CONFIG__` and a fake `window.umami` tracker before the SPA loads — the build itself runs without a website id.

## Events emitted

| Event name                    | Source                                                                   | Payload shape                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageView`                    | router (manual, `data-auto-track="false"`)                               | payload modifier sets `{ url: <base-relative path> }`                                                                                                         |
| `route-error`                 | `RouteErrorBoundary` (`src/components/molecules/RouteErrorBoundary.tsx`) | Built by `src/lib/build-route-error-payload.ts`. Fully PII-scrubbed: `route`, `name`, `message ≤ 500`, `componentStack ≤ 1000`, all multi-class allow-listed. |
| `coaching.sync.invoked`       | Train2Go sync flow                                                       | `{ source, profileId, trigger }`                                                                                                                              |
| `coaching.sync.result`        | Train2Go sync flow                                                       | `{ source, profileId, ok, reason?, durationMs }`                                                                                                              |
| `coaching.expand_day.invoked` | Train2Go expand-day flow                                                 | `{ source, profileId }`                                                                                                                                       |

The `route-error` payload is the most sensitive surface: an unscrubbed React error message can leak UUIDs, bearer tokens, emails, and base64 secrets present in user input or query strings. The boundary forwards the scrubbed payload only — see `src/lib/scrub-analytics-string.ts` for the regex allow-list (UUID / Bearer / email / hex / base64url).

## PII-leakage guard

`scripts/check-no-pii-leakage.mjs` is a `pnpm test:scripts`-wired static-source check that fails CI if any `analytics.event` call's first argument (event name) is anything other than a literal string or top-level SCREAMING_SNAKE_CASE constant referencing a literal. This prevents accidental interpolation of user identifiers into event names. The same rule applies to `toast.*` and `console.*` first arguments under `packages/workout-spa-editor/src/{components,hooks,lib}/**`.

## Verifying in staging

1. Deploy the SPA. Confirm the deploy step runs the placeholder substitution.
2. Open the deployed editor in a browser and inspect `<head>`: the Umami tracker `<script>` element with `data-website-id` and `data-auto-track="false"` should be present.
3. Trigger a render error on a routed page (e.g., temporarily throw from a dev-mode route component).
4. Confirm the Umami dashboard shows the `route-error` custom event under the Events view.
5. Inspect the event payload in Umami's "Properties" view: confirm `route` does not contain UUIDs / bearer tokens / emails; confirm `message` and `componentStack` are truncated to ≤ 500 / ≤ 1000 chars.

## Replacing the provider

If a future product decision swaps providers (e.g., to PostHog or Sentry), the change is localised:

1. Add a new adapter at `src/adapters/analytics/<provider>-analytics.ts` implementing the `Analytics` type from `@kaiord/core`.
2. Swap the `createUmamiAnalytics(...)` call in `src/main.tsx` for the new factory.
3. Extend `src/lib/runtime-config.ts` with the new provider's runtime fields if needed; mirror the placeholder pattern in `index.html` and the deploy step.
4. Remove `umami-analytics.{ts,test.ts}` if the Umami adapter is no longer needed.
5. Update this document.

The `Analytics` port is the contract — every adapter implementation only has to satisfy `pageView` and `event`. Consumers (`useAnalytics` hook, `RouteErrorBoundary` analytics prop, the coaching flow's emitter) need no changes.

## Related references

- `packages/core/src/ports/analytics.ts` — the port interface.
- `packages/core/src/adapters/analytics/noop-analytics.ts` — the always-available no-op.
- `packages/workout-spa-editor/src/adapters/analytics/umami-analytics.ts` — the production adapter.
- `packages/workout-spa-editor/src/contexts/analytics-context.tsx` — React context wrapper.
- `packages/workout-spa-editor/src/components/molecules/RouteErrorBoundary.tsx` — the route-error emitter.
- `packages/workout-spa-editor/src/lib/scrub-analytics-string.ts` — the PII regex allow-list.
- `packages/workout-spa-editor/src/lib/runtime-config.ts` — the runtime-config accessor.
- `scripts/check-no-pii-leakage.mjs` — mechanical PII-leak guard run by `pnpm test:scripts`.
