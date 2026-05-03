# Analytics

The SPA editor uses the `AnalyticsPort` interface (defined in `@kaiord/core/ports/analytics-port`) for all telemetry. The production adapter is **CloudFlare Web Analytics**, wired at SPA bootstrap with a runtime opt-in.

## Production wiring

```
src/main.tsx
  ├── createCloudflareAnalytics(import.meta.env.VITE_CF_ANALYTICS_TOKEN)
  └── <AnalyticsProvider analytics={analytics}>
```

The adapter (`src/adapters/analytics/cloudflare-analytics.ts`) forwards each `event(name, props)` call to `window.cfBeacon.pushEvent(name, props)` — the global beacon CloudFlare injects into the page when the analytics token is configured.

When `VITE_CF_ANALYTICS_TOKEN` is absent or empty, the adapter falls back to `createNoopAnalytics()` from `@kaiord/core` and no events are sent.

## Activating analytics in a deploy

Set the `VITE_CF_ANALYTICS_TOKEN` build-time env var to the CloudFlare Web Analytics site token. The token is **public** (it identifies the site to CloudFlare's beacon endpoint) — there are no secrets to handle here. The build embeds it; no additional runtime config is required.

To disable analytics for a deploy, leave the var unset (or set it to the empty string).

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

1. Deploy the SPA with `VITE_CF_ANALYTICS_TOKEN` set to the staging-site token.
2. Trigger a render error on a routed page (e.g., temporarily throw from a dev-mode route component).
3. Confirm the CloudFlare Web Analytics dashboard shows the `route-error` custom event.
4. Inspect the event payload in CloudFlare's "Custom Events" view: confirm `route` does not contain UUIDs / bearer tokens / emails; confirm `message` and `componentStack` are truncated to ≤ 500 / ≤ 1000 chars.

## Replacing the provider

If a future product decision swaps providers (e.g., to PostHog or Sentry), the change is localised:

1. Add a new adapter at `src/adapters/analytics/<provider>-analytics.ts` implementing the `Analytics` type from `@kaiord/core`.
2. Swap the `createCloudflareAnalytics(...)` call in `src/main.tsx` for the new factory.
3. Remove `cloudflare-analytics.{ts,test.ts}` if the CloudFlare adapter is no longer needed.
4. Update this document.

The `AnalyticsPort` interface is the contract — every adapter implementation only has to satisfy `pageView` and `event`. Consumers (`useAnalytics` hook, `RouteErrorBoundary` analytics prop, the coaching flow's emitter) need no changes.

## Related references

- `packages/core/src/ports/analytics-port.ts` — the port interface.
- `packages/core/src/adapters/analytics/noop-analytics.ts` — the always-available no-op.
- `packages/workout-spa-editor/src/adapters/analytics/cloudflare-analytics.ts` — the production adapter.
- `packages/workout-spa-editor/src/contexts/analytics-context.tsx` — React context wrapper.
- `packages/workout-spa-editor/src/components/molecules/RouteErrorBoundary.tsx` — the route-error emitter.
- `packages/workout-spa-editor/src/lib/scrub-analytics-string.ts` — the PII regex allow-list.
- `scripts/check-no-pii-leakage.mjs` — mechanical PII-leak guard run by `pnpm test:scripts`.
