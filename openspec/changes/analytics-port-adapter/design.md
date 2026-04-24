## Context

Kaiord currently has zero analytics on kaiord.com (landing) and `/editor/`. The project follows hexagonal architecture strictly — the existing `Logger` port (`packages/core/src/ports/logger.ts`) is the reference pattern for cross-cutting infrastructure. Analytics must follow the same pattern: a port in `core`, a noop adapter as default, and provider-specific adapters in consumer packages.

The chosen provider is **Cloudflare Web Analytics**: free tier, cookieless, GDPR-compliant by default, no consent banner required — coherent with the project's "your data never leaves your device" messaging. DNS is on AWS Route53; Cloudflare is used only as an analytics beacon (no proxy required).

## Goals / Non-Goals

**Goals:**

- Define `Analytics` port in `@kaiord/core` mirroring the `Logger` type
- Provide `createNoopAnalytics()` as the default adapter (no tracking unless injected)
- Wire Cloudflare Web Analytics in `@kaiord/landing` (vanilla TS) and `@kaiord/workout-spa-editor` (React)
- Track key funnel events: page views, CTA clicks, editor interactions
- Export port and noop adapter from `@kaiord/core` public API for OSS consumers

**Non-Goals:**

- A new published `@kaiord/analytics-cloudflare` package (YAGNI — adapters stay private)
- Session recording, heatmaps, or product analytics (Cloudflare free tier: page views + custom events only)
- Any consent banner or cookie management (Cloudflare Analytics is cookieless)
- Tracking inside the core conversion pipeline (`fromBinary`, `toText`, etc.)

## Decisions

### 1. Port shape: two methods only

```typescript
// packages/core/src/ports/analytics.ts
type AnalyticsEvent = Record<string, string | number | boolean>;

type Analytics = {
  pageView: (path: string) => void;
  event: (name: string, props?: AnalyticsEvent) => void;
};
```

**Why**: Mirrors the Cloudflare Web Analytics JS API surface (`window.cfBeacon.pushEvent`). Keeping it minimal avoids over-engineering for a single provider. Properties are typed strictly (`string | number | boolean`, not `unknown`) so adapters can safely serialize them without runtime guards.

**Deliberate divergence from Logger**: The `Logger` port uses `Record<string, unknown>` for context. `Analytics` uses the stricter `Record<string, string | number | boolean>`. This is intentional — log context stays local and never serialized externally, whereas analytics props are shipped to a third-party service. The tighter type prevents callers from accidentally passing complex objects or, critically, PII-containing structures that would pass type-checking but leak data to Cloudflare. **Event properties MUST NOT contain personally identifiable information** (user IDs, emails, file contents, workout names). This constraint is enforced by convention, not the type system alone.

**`pageView(path)` semantics**: The beacon auto-tracks the initial page load for each `index.html`. `pageView` is reserved for manual invocation on SPA route changes. In the current scope (single route per package), `pageView` is called once on landing page load for completeness but is primarily a forward-compatibility hook — if the editor introduces sub-routes, `pageView` enables manual route tracking without changing the port contract.

**Alternative considered**: A single `track(event)` method. Rejected — separating `pageView` from `event` matches how Cloudflare distinguishes page views (automatic) from custom events (manual).

### 2. Noop adapter in core, Cloudflare adapter in consumer packages (Option A)

```
core/adapters/analytics/noop-analytics.ts     ← published with @kaiord/core
landing/src/adapters/analytics/               ← private
workout-spa-editor/src/adapters/analytics/    ← private
```

**Why**: A published `@kaiord/analytics-cloudflare` package would require CI/CD wiring, changesets, and a semantic versioning contract for a single 15-line file. Option A is proportionate to the current scale. If other consumers request the Cloudflare adapter, extract then.

**Alternative considered**: Option B (published package). Rejected as premature.

### 3. Editor injection via React Context

```
AnalyticsContext (React.createContext)
  └── AnalyticsProvider (wraps app in main.tsx)
        └── useAnalytics() hook (consumed by components)
```

**Why**: Consistent with how other ports are injected in the SPA. Existing contexts live in `packages/workout-spa-editor/src/contexts/` (e.g., `garmin-bridge-context.tsx`, `settings-dialog-context.tsx`). `analytics-context.tsx` follows the same convention. Avoids prop-drilling. The provider accepts an `Analytics` value — tests inject a spy, production injects Cloudflare.

```tsx
// main.tsx — production wiring
const analytics = createCloudflareAnalytics(import.meta.env.VITE_CF_ANALYTICS_TOKEN)
<AnalyticsProvider value={analytics}><App /></AnalyticsProvider>

// any test — spy injection
<AnalyticsProvider value={createNoopAnalytics()}><ComponentUnderTest /></AnalyticsProvider>
```

### 4. Landing injection via module-level singleton

```typescript
// landing/src/analytics.ts
import { createCloudflareAnalytics } from "./adapters/analytics/cloudflare-analytics";
export const analytics = createCloudflareAnalytics(
  import.meta.env.VITE_CF_ANALYTICS_TOKEN
);
```

**Why**: The landing is vanilla TS with no framework. A singleton module is idiomatic and simple. The token is injected at build time via Vite env vars.

### 5. Cloudflare beacon script in index.html (both packages)

Cloudflare Web Analytics requires a `<script>` tag in the HTML to load its beacon. The TS adapter calls `window.cfBeacon.pushEvent()` for custom events — this API is only available after the beacon loads.

The adapter guards against the beacon not being available (e.g., blocked by ad blockers or missing token), and wraps `pushEvent` in a `try/catch` to prevent any future beacon SDK regression from propagating into application code:

```typescript
const push = (name: string, props?: AnalyticsEvent) => {
  if (typeof window !== "undefined" && window.cfBeacon) {
    try {
      window.cfBeacon.pushEvent(name, props);
    } catch {
      // beacon errors must not surface to the application
    }
  }
};
```

A `window.cfBeacon` TypeScript ambient declaration is required in each consumer package for strict-mode compilation (`src/types/cf-beacon.d.ts`).

**Why the adapter does NOT accept a `Logger` parameter**: The noop-or-forward design is intentional. Analytics are best-effort telemetry — silently dropping events is the correct production behavior. Adding a `Logger` dependency would couple the adapter to another port, increase the API surface, and risk debug noise leaking into production logs. If troubleshooting is needed, the Cloudflare dashboard is the authoritative source. The catch block remains silent by design.

The beacon `<script>` tag is conditionally emitted only when `VITE_CF_ANALYTICS_TOKEN` is non-empty at build time. This ensures local development without a token produces no beacon load, no console errors, and no invalid-token network requests — the noop adapter is used instead:

```html
<!-- Only injected when VITE_CF_ANALYTICS_TOKEN is set at build time -->
<!-- Vite HTML env replacement: if token is empty string, script tag is omitted -->
```

Concretely, the adapter factory treats an empty/undefined token as a signal to return a noop:

```typescript
export const createCloudflareAnalytics = (
  token: string | undefined
): Analytics => {
  if (!token) return createNoopAnalytics();
  // ... wire up beacon
};
```

**Local dev behavior (explicit)**:

| Environment            | Token set? | Behavior                            |
| ---------------------- | ---------- | ----------------------------------- |
| Local dev (`pnpm dev`) | No         | Noop — no beacon, no console errors |
| CI/CD build            | Yes        | Cloudflare adapter active           |
| Production             | Yes        | Same artifact as CI/CD build        |

### 6. Events to track

| Surface | Event name          | Props                                | Trigger                        |
| ------- | ------------------- | ------------------------------------ | ------------------------------ |
| Landing | (page view)         | —                                    | automatic via beacon           |
| Landing | `editor-opened`     | —                                    | click on "Try the Editor" CTA  |
| Landing | `github-opened`     | —                                    | click on "Star on GitHub" link |
| Landing | `docs-opened`       | —                                    | click on "Read the Docs" link  |
| Editor  | `editor-loaded`     | —                                    | app mount in main.tsx          |
| Editor  | `workout-generated` | `{ provider, sport }`                | AI generation completes        |
| Editor  | `workout-exported`  | `{ format }`                         | export to FIT/TCX/ZWO/GCN      |
| Editor  | `garmin-synced`     | `{ result: 'success' \| 'failure' }` | Garmin Connect push completes  |

`garmin-synced` is fired on both success and failure — the `result` dimension allows computing the sync conversion rate. `workout-generated` includes `provider` (e.g., `claude`, `gpt`, `gemini`) and `sport` for segmentation. No props carry PII.

## Risks / Trade-offs

- **Ad blockers**: Cloudflare beacon may be blocked. The adapter silently no-ops. Acceptable — analytics are directional, not mission-critical.
- **Token exposure**: `VITE_CF_ANALYTICS_TOKEN` is a public beacon token (not a secret API key). Cloudflare Web Analytics tokens are designed to be public — they only allow sending events to your dashboard, not reading data. Baking it into the bundle at build time is a justified deviation from 12-factor III/V: the token is not a secret, GitHub Pages has no runtime config injection, and there is a single deployment environment. If a staging environment is ever added, the token can be a different value per CI job.
- **Empty token in local dev**: When `VITE_CF_ANALYTICS_TOKEN` is not set, `createCloudflareAnalytics` returns a noop and the beacon `<script>` tag is not emitted. This prevents console errors and invalid-token network requests during local development.
- **SPA route changes**: The editor is a single-page app. Cloudflare's beacon auto-tracks the initial page load; route changes within the SPA require manual `pageView` calls if sub-routes are introduced. Current scope: single route, so this is not needed yet.
- **`window.cfBeacon` timing**: The beacon script loads asynchronously. Custom events called before the beacon loads are dropped. Mitigation: `editor-loaded` event is fired on app mount, which is after the beacon script has had time to initialize.
- **PII in event props**: The `AnalyticsEvent` type (`Record<string, string | number | boolean>`) does not prevent PII by type alone. Callers MUST NOT pass user IDs, emails, file contents, or workout names as prop values. This is enforced by convention and code review, not the type system.
- **CSP implications**: The Cloudflare beacon loads from `https://static.cloudflareinsights.com` and connects to `https://cloudflareinsights.com`. If a `Content-Security-Policy` header or `<meta>` CSP is ever added to the site, both origins must be allowlisted in `script-src` and `connect-src`. Currently GitHub Pages does not set CSP headers, so this is not an immediate concern.
- **SRI not applicable**: Cloudflare's beacon URL (`beacon.min.js`) is a mutable, versioned endpoint. Cloudflare does not publish SRI hashes for it, so `integrity` attributes cannot be applied to the `<script>` tag. This is an accepted limitation of using a third-party beacon.
