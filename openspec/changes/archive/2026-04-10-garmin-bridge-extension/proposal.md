> Completed: 2026-04-10

## Why

The current Garmin Connect integration requires a self-hosted AWS infrastructure (CDK stack with API Gateway, Lambda, Tailscale tunnel) to proxy API calls from the SPA. This creates three problems: credentials (username/password) travel over the network, infrastructure is complex to deploy and maintain, and rate limits are not mitigated by the proxy. A browser extension that piggybacks on the user's existing Garmin web session eliminates all three issues — zero servers, zero credentials in transit, zero infrastructure.

## What Changes

- **New package `@kaiord/garmin-bridge`**: Chrome extension (v1 Chrome-only; Firefox support planned as follow-up) that enables the SPA to read and push workouts to Garmin Connect via the user's browser session. Uses `chrome.webRequest` to capture CSRF tokens and content scripts for same-origin API calls.
- **SPA Garmin flow redesign**: Replace Lambda-based push with extension-based communication. Add extension detection, install prompt, and session status UI. Remove all Lambda/proxy code, env vars, and credential storage.
- **BREAKING**: Delete `@kaiord/infra` package entirely (contains only the Garmin proxy Lambda stack).
- **BREAKING**: Remove `deploy-infra.yml` GitHub Actions workflow.
- Remove Garmin integration tests from CI (keep for local execution only). Unit tests for `@kaiord/garmin-connect` remain in CI.
- Scope v1 to Chrome only; Firefox support deferred (`externally_connectable` is Chrome-specific).
- Delete `poc-cf-worker/` and `poc-extension/` local PoC directories.

## Capabilities

### New Capabilities

- `garmin-bridge`: Browser extension for SPA-to-Garmin communication via web session (CSRF capture, content script API calls, externally_connectable messaging)
- `spa-garmin-extension`: SPA integration with the Garmin Bridge extension (detection, install prompt, session status, push/list via extension messaging)

### Modified Capabilities

- `adapter-contracts`: Add browser extension adapter pattern alongside existing API adapter pattern. The extension acts as a new type of adapter — not a format adapter or API client, but a browser-mediated bridge.

## Impact

- **Packages affected**: `@kaiord/garmin-bridge` (new), `@kaiord/workout-spa-editor` (modified), `@kaiord/infra` (deleted)
- **Packages unchanged**: `@kaiord/garmin-connect` (kept for CLI/MCP/programmatic use), `@kaiord/garmin` (format adapter unchanged)
- **CI/CD**: Remove `integration-garmin` job from `ci.yml`, delete `deploy-infra.yml`, update `.changeset/config.json`, update test matrix
- **AWS**: Entire CDK stack can be torn down (API Gateway, Lambda, CloudWatch alarms)
- **Public API**: No changes to `@kaiord/core` or format adapter APIs
- **Breaking for SPA users**: Garmin push requires extension installation instead of Lambda URL configuration
- **Browser support**: Chrome (and Chromium-based) only in v1. Firefox lacks `externally_connectable` API.
