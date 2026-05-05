# Analytics

The SPA editor uses the `AnalyticsPort` interface (defined in `@kaiord/core/ports/analytics-port`) for all telemetry. The production adapter is **CloudFlare Web Analytics**, wired at SPA bootstrap with a runtime opt-in.

## Production wiring

```
src/main.tsx
  ├── getCfAnalyticsToken()                    // reads window.__KAIORD_CONFIG__
  ├── createCloudflareAnalytics(token)         // noop if token is undefined
  └── <AnalyticsProvider analytics={analytics}>
```

The adapter (`src/adapters/analytics/cloudflare-analytics.ts`) forwards each `event(name, props)` call to `window.cfBeacon.pushEvent(name, props)` — the global beacon CloudFlare injects into the page when the analytics token is present.

When the runtime token is absent, empty, or still equals the placeholder `__CF_ANALYTICS_TOKEN__`, the adapter falls back to `createNoopAnalytics()` from `@kaiord/core` and no events are sent.

## Runtime config injection (12-factor III + V)

The token is **NOT** baked into the build. The compiled bundle is environment-agnostic — the same artifact ships to every deploy. The token is injected at deploy time via a runtime config object on `window`:

1. `index.html` contains an inline `<script>` block that initializes `window.__KAIORD_CONFIG__` with a placeholder value, e.g.:

   ```html
   <script>
     window.__KAIORD_CONFIG__ = window.__KAIORD_CONFIG__ || {
       cfAnalyticsToken: "__CF_ANALYTICS_TOKEN__",
     };
   </script>
   ```

2. A second inline `<script>` reads `window.__KAIORD_CONFIG__.cfAnalyticsToken`. If it is non-empty AND not equal to the placeholder, the script appends the Cloudflare beacon `<script>` to `<head>` with the token in `data-cf-beacon`. Otherwise it returns silently — no beacon is loaded.

3. `src/main.tsx` calls `getCfAnalyticsToken()` (`src/lib/runtime-config.ts`) which returns `undefined` for the same "no token" cases, so the analytics adapter selects the no-op path.

4. The `||` fallback in step 1 lets earlier scripts (e.g., Playwright `addInitScript` in e2e tests) pre-seed `window.__KAIORD_CONFIG__` and have those values win.

## Activating analytics in a deploy

The deploy step substitutes the placeholder string inside the deployed `index.html`. The current pipeline (`.github/workflows/deploy-site.yml`, "Substitute analytics token" step) does this with `sed`:

```bash
if [ -n "$CF_ANALYTICS_TOKEN" ]; then
  sed -i "s|__CF_ANALYTICS_TOKEN__|${CF_ANALYTICS_TOKEN}|g" \
    packages/workout-spa-editor/dist/index.html
fi
```

The token is **public** (it identifies the site to CloudFlare's beacon endpoint) — there are no secrets to handle here. To disable analytics for a deploy, simply skip the substitution step (or leave the secret unset); the placeholder remains and the noop adapter wins.

## Testing analytics locally

For local manual verification:

1. Build the SPA: `pnpm --filter @kaiord/workout-spa-editor build`.
2. Replace the placeholder in the served `index.html`:

   ```bash
   sed -i '' "s|__CF_ANALYTICS_TOKEN__|<your-cf-token>|g" \
     packages/workout-spa-editor/dist/index.html
   ```

3. Serve `dist/` (e.g. `npx serve packages/workout-spa-editor/dist`) and verify the Cloudflare beacon `<script>` is in the document head and `pageView` events appear in the CloudFlare dashboard.

In the e2e suite (`e2e/spa-route-refresh.spec.ts`), Playwright's `addInitScript` injects `window.__KAIORD_CONFIG__` and a fake `window.cfBeacon` before the SPA loads — the build itself runs without a token.

## Events emitted

| Event name                    | Source                                                                   | Payload shape                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pageView`                    | router                                                                   | `{ path }`                                                                                                                                                    |
| `route-error`                 | `RouteErrorBoundary` (`src/components/molecules/RouteErrorBoundary.tsx`) | Built by `src/lib/build-route-error-payload.ts`. Fully PII-scrubbed: `route`, `name`, `message ≤ 500`, `componentStack ≤ 1000`, all multi-class allow-listed. |
| `coaching.sync.invoked`       | Train2Go sync flow                                                       | `{ source, profileId, trigger }`                                                                                                                              |
| `coaching.sync.result`        | Train2Go sync flow                                                       | `{ source, profileId, ok, reason?, durationMs }`                                                                                                              |
| `coaching.expand_day.invoked` | Train2Go expand-day flow                                                 | `{ source, profileId }`                                                                                                                                       |

The `route-error` payload is the most sensitive surface: an unscrubbed React error message can leak UUIDs, bearer tokens, emails, and base64 secrets present in user input or query strings. The boundary forwards the scrubbed payload only — see `src/lib/scrub-analytics-string.ts` for the regex allow-list (UUID / Bearer / email / hex / base64url).

## PII-leakage guard

`scripts/check-no-pii-leakage.mjs` is a `pnpm test:scripts`-wired static-source check that fails CI if any `analytics.event` call's first argument (event name) is anything other than a literal string or top-level SCREAMING_SNAKE_CASE constant referencing a literal. This prevents accidental interpolation of user identifiers into event names. The same rule applies to `toast.*` and `console.*` first arguments under `packages/workout-spa-editor/src/{components,hooks,lib}/**`.

## Verifying in staging

1. Deploy the SPA. Confirm the deploy step runs the placeholder substitution.
2. Open the deployed editor in a browser and inspect `<head>`: the Cloudflare beacon `<script>` element with `data-cf-beacon` should be present.
3. Trigger a render error on a routed page (e.g., temporarily throw from a dev-mode route component).
4. Confirm the CloudFlare Web Analytics dashboard shows the `route-error` custom event.
5. Inspect the event payload in CloudFlare's "Custom Events" view: confirm `route` does not contain UUIDs / bearer tokens / emails; confirm `message` and `componentStack` are truncated to ≤ 500 / ≤ 1000 chars.

## Replacing the provider

If a future product decision swaps providers (e.g., to PostHog or Sentry), the change is localised:

1. Add a new adapter at `src/adapters/analytics/<provider>-analytics.ts` implementing the `Analytics` type from `@kaiord/core`.
2. Swap the `createCloudflareAnalytics(...)` call in `src/main.tsx` for the new factory.
3. Extend `src/lib/runtime-config.ts` with the new provider's runtime fields if needed; mirror the placeholder pattern in `index.html` and the deploy step.
4. Remove `cloudflare-analytics.{ts,test.ts}` if the CloudFlare adapter is no longer needed.
5. Update this document.

The `AnalyticsPort` interface is the contract — every adapter implementation only has to satisfy `pageView` and `event`. Consumers (`useAnalytics` hook, `RouteErrorBoundary` analytics prop, the coaching flow's emitter) need no changes.

## Related references

- `packages/core/src/ports/analytics-port.ts` — the port interface.
- `packages/core/src/adapters/analytics/noop-analytics.ts` — the always-available no-op.
- `packages/workout-spa-editor/src/adapters/analytics/cloudflare-analytics.ts` — the production adapter.
- `packages/workout-spa-editor/src/contexts/analytics-context.tsx` — React context wrapper.
- `packages/workout-spa-editor/src/components/molecules/RouteErrorBoundary.tsx` — the route-error emitter.
- `packages/workout-spa-editor/src/lib/scrub-analytics-string.ts` — the PII regex allow-list.
- `packages/workout-spa-editor/src/lib/runtime-config.ts` — the runtime-config accessor.
- `scripts/check-no-pii-leakage.mjs` — mechanical PII-leak guard run by `pnpm test:scripts`.
