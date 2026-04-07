## Context

The SPA currently pushes workouts to Garmin Connect through a self-hosted AWS Lambda proxy (`@kaiord/infra`). The proxy exists solely to bypass CORS — Garmin's API doesn't allow browser-origin requests. The Lambda requires CDK deployment, API Gateway, Tailscale tunnel, and the user must configure credentials (username/password) that travel over the network.

A PoC browser extension (`poc-extension/`) proved that a Chrome extension can make authenticated Garmin API calls by piggybacking on the user's existing web session. The extension uses `chrome.webRequest` to capture the CSRF token from Garmin's own requests, then a content script on `connect.garmin.com` makes same-origin API calls where the browser automatically attaches all cookies (including HttpOnly).

## Goals / Non-Goals

**Goals:**

- Create `@kaiord/garmin-bridge` package containing a production-ready Chrome extension
- Redesign SPA Garmin integration to use extension messaging instead of Lambda proxy
- Remove `@kaiord/infra` package and all associated AWS infrastructure references
- Remove Garmin integration tests from CI (keep locally executable)
- Maintain `@kaiord/garmin-connect` for programmatic use (CLI, MCP, tests)

**Non-Goals:**

- Chrome Web Store / Firefox Add-ons publishing (future work)
- Firefox support in v1 (`externally_connectable` is Chrome-only; `window.postMessage` fallback deferred)
- Mobile browser support beyond Firefox Android (deferred with Firefox support)
- Offline/background sync (extension requires Garmin tab open)
- Replacing `@kaiord/garmin-connect` — it serves CLI/MCP/programmatic scenarios

## Decisions

### Decision 1: Extension architecture — content script as API proxy

**Choice**: Content script on `connect.garmin.com` executes `fetch()` calls; background service worker captures CSRF tokens and coordinates messaging.

**Why**: Service worker `fetch()` cannot send browser cookies (forbidden header). Content scripts share the page origin, so the browser attaches all cookies automatically — including HttpOnly `JWT_WEB`.

**Alternatives considered**:
- Background script with manual Cookie header → `Cookie` is a forbidden header in `fetch()`
- `declarativeNetRequest` to modify headers → overly complex, MV3 limitations
- Page script injection → blocked by Garmin's CSP

**Layer**: Infrastructure (adapter)

### Decision 2: SPA ↔ Extension communication via `externally_connectable`

**Choice**: SPA uses `chrome.runtime.sendMessage(extensionId, message)` to communicate with the extension. The extension declares the SPA origins in `externally_connectable.matches`.

**Why**: Native Chrome API, no DOM hacks, works cross-origin. The SPA can detect extension presence by catching the error when the extension is not installed.

**Limitation**: `externally_connectable` is Chrome-only. Firefox does not support this API. V1 is scoped to Chrome; a `window.postMessage` fallback for Firefox is deferred to a follow-up change.

**Alternatives considered**:
- `window.postMessage` → requires content script on SPA origin, less secure, but needed for Firefox (future)
- Native messaging → requires native host binary, defeats simplicity goal
- Shared `localStorage` → not cross-origin

**Layer**: Infrastructure (adapter) — SPA side is a port implementation

### Decision 3: Extension detection via ping with retry

**Choice**: SPA sends a `ping` message to the extension ID. First attempt uses a 2s timeout. If it times out without `chrome.runtime.lastError` (suggesting the SW is waking up), retry once with 4s timeout. If `chrome.runtime.lastError` fires, the extension is not installed. Detection results are cached for 30 seconds.

**Why**: MV3 service workers are lazy-loaded and can take 1-2s to wake from idle. A single 2s timeout causes false negatives. The ping also returns session status and protocol version, so one call handles detection, health check, and compatibility.

**Layer**: Application (SPA use case)

### Decision 4: Delete `@kaiord/infra` entirely

**Choice**: Remove the package completely rather than keeping it dormant.

**Why**: The package contains only the Garmin proxy Lambda stack. No other AWS resources exist. Keeping dead infrastructure code adds maintenance burden and confusion. The CDK stack, deploy workflow, Tailscale config, and alarms are all Garmin-proxy-specific.

**Layer**: Infrastructure (removed)

### Decision 5: Keep `@kaiord/garmin-connect` unchanged

**Choice**: Do not modify or remove the OAuth-based Garmin Connect client.

**Why**: It serves CLI (`kaiord push`), MCP server, and programmatic/CI use cases where no browser is available. The extension replaces only the SPA→Garmin path.

**Layer**: Infrastructure (adapter, unchanged)

### Decision 6: Garmin integration tests local-only

**Choice**: Remove `integration-garmin` job from `ci.yml`. Keep test files and `vitest.integration.config.ts` in `@kaiord/garmin-connect` for local execution.

**Why**: Integration tests require Tailscale tunnel, Garmin credentials, and are prone to 429 rate limits. They add CI complexity and flakiness without proportional value. Local execution with `pnpm --filter @kaiord/garmin-connect test:integration` remains available.

**Layer**: CI/CD

### Decision 7: SPA Garmin state — replace credentials with extension status

**Choice**: Replace the Zustand `garmin-store` (username, password, lambdaUrl) with extension-focused state: `extensionInstalled`, `sessionActive`, `pushing`, `lastError`, `lastDetectionTimestamp`.

**Why**: No credentials to store or transmit. The SPA only needs to know: is the extension there, and can it reach Garmin? Detection results cached for 30s via `lastDetectionTimestamp` to avoid repeated pings on navigation.

**Layer**: Application (SPA state management)

### Decision 8: Package structure — plain JS extension with unit tests

**Choice**: `@kaiord/garmin-bridge` ships plain JS files (manifest.json, background.js, content.js). No TypeScript, no bundler. Testable logic is extracted into importable modules with vitest unit tests using mocked Chrome APIs.

**Why**: Browser extensions load raw JS. A build step adds complexity for minimal benefit in a small extension. However, the code handles CSRF tokens and authenticated API calls, so unit tests are mandatory. Chrome APIs are mocked with lightweight stubs.

**Alternative considered**: TypeScript + esbuild → unnecessary for current scope.

**Layer**: Infrastructure (new package)

### Decision 9: Content script enforces path/method allowlist

**Choice**: The content script validates every `garmin-fetch` request against a strict allowlist of permitted API paths and HTTP methods before executing any `fetch()`. Requests outside the allowlist are rejected without making a network call.

**Why**: Principle of least privilege. Without an allowlist, any origin in `externally_connectable` could use the extension as a generic Garmin API proxy — deleting workouts, modifying profiles, accessing health data. The allowlist restricts to workout read/write operations only.

**Allowed paths**:
- `GET /workout-service/workouts` (with query params)
- `POST /workout-service/workout`

**Layer**: Infrastructure (adapter, security boundary)

### Decision 10: Protocol version in ping response

**Choice**: The extension includes a `protocolVersion: number` field in the ping response. The SPA validates it against a list of supported versions. On mismatch, the SPA shows "Update your extension" instead of cryptic failures.

**Why**: The SPA and extension are independently updated. Without version negotiation, message contract changes cause silent failures. A single integer comparison prevents this with minimal complexity.

**Layer**: Infrastructure (adapter protocol)

### Decision 11: CSRF token stored in chrome.storage.session

**Choice**: Use `chrome.storage.session` to persist the CSRF token instead of a `let` variable in the service worker.

**Why**: MV3 service workers are terminated after ~30s of inactivity. A `let` variable is lost on termination, causing all subsequent API calls to fail with 403 until the user navigates Garmin Connect again. `chrome.storage.session` is encrypted, memory-only (not persisted to disk), survives service worker restarts, and is automatically cleared when the browser session ends. No additional permissions required.

**Layer**: Infrastructure (adapter, MV3 lifecycle)

## Risks / Trade-offs

**[Risk] Extension requires Garmin Connect tab open** → Acceptable trade-off. The popup and SPA guide the user to open Garmin Connect. The extension supports an `open-garmin` action that auto-opens the tab.

**[Risk] MV3 service worker idle termination** → Mitigated by using `chrome.storage.session` for CSRF token persistence. Token survives SW restarts, cleared only on browser session end.

**[Risk] CSRF token captured only after user navigates Garmin** → The token is captured passively from Garmin's own API calls. Any navigation (loading dashboard, viewing activities) triggers it. SPA shows clear status when token is not yet available. The `open-garmin` action opens the dashboard which triggers capture automatically.

**[Risk] Garmin may change CSRF mechanism** → Low probability (stable for years). If it changes, only the extension needs updating — SPA and core packages are unaffected.

**[Risk] Extension not in Web Store yet** → Users must install via "Load unpacked" during development. Acceptable for post-MVP open-source. SPA install prompt includes manual install instructions.

**[Risk] Breaking change for existing SPA users using Lambda** → Mitigated by clear migration guide. The Lambda approach was already self-hosted and manual.

**[Risk] Content script on a domain we don't control** → Garmin could change their API paths, CSRF header name, or add CSP rules that affect our extension. The extension is small and isolated — updates are straightforward. Content script captures a pristine `fetch` reference at `document_start` to prevent monkey-patching.

**[Trade-off] Two Garmin auth paths coexist** → Extension (web session) for SPA, OAuth (garmin-connect) for CLI/MCP. This is intentional — each serves its audience optimally.

**[Trade-off] Chrome-only in v1** → Firefox requires a `window.postMessage` fallback due to lack of `externally_connectable`. Deferred to reduce complexity.

## Migration Plan

1. Create `@kaiord/garmin-bridge` package from PoC code
2. Document CDK stack teardown procedure
3. Update SPA to use extension messaging, remove Lambda code
4. Remove `@kaiord/infra` package
5. Update CI/CD (remove integration-garmin job, deploy-infra workflow, changeset config, release workflow)
6. Clean up PoC directories
7. Update documentation and create migration guide

**Rollback**: If extension approach fails, `@kaiord/garmin-connect` + a proxy (Lambda or CF Worker) remains viable. The OAuth client is untouched.

## Open Questions

- Extension ID will change when published to Chrome Web Store — SPA needs a config mechanism for the ID (handled via `VITE_GARMIN_EXTENSION_ID` env var)
- Firefox support requires `window.postMessage` fallback since `externally_connectable` is not supported — deferred to a follow-up change
- Chrome Web Store review for `webRequest` + `host_permissions` — prepare privacy justification document
- Should the extension auto-open a Garmin Connect tab when none is found? (Yes — `open-garmin` action added)
