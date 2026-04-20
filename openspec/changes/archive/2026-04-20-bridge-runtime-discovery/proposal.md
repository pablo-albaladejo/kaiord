> Completed: 2026-04-20

## Why

Bridge extension IDs are currently configured via `VITE_*` env vars, baked into the JS bundle at build time (Factor III / Factor V violation). This means:

- Each build is coupled to specific extension IDs — the artifact is not portable across environments
- Local development requires `.env.local` with the developer's unique unpacked extension ID
- Production requires the Chrome Web Store ID at build time
- A new developer cannot detect extensions without manually configuring env vars

Replacing build-time ID injection with runtime content script announcements makes the SPA fully environment-agnostic.

## What Changes

- **Extensions** (`garmin-bridge`, `train2go-bridge`): Add a content script that injects into `*.kaiord.com` and `localhost:*` pages, announcing bridge availability via `window.postMessage` with the extension's `chrome.runtime.id` and capabilities
- **SPA** (`workout-spa-editor`): Add a bridge discovery module that listens for `window.postMessage` announcements instead of using hardcoded extension IDs
- **SPA**: Remove `VITE_GARMIN_EXTENSION_ID` and `VITE_TRAIN2GO_EXTENSION_ID` usage — transport functions receive `extensionId` dynamically from discovery
- **SPA**: Update bridge registry to register bridges from announcements

This supersedes `spa-bridge-protocol` requirement "V1 bridge discovery via env vars" with a runtime discovery mechanism.

## Capabilities

### New Capabilities

- `bridge-runtime-discovery`: Content script announcement protocol and SPA-side discovery listener

### Modified Capabilities

- `spa-bridge-protocol`: Replace "V1 bridge discovery via env vars" with runtime content script discovery
- `spa-garmin-extension`: Extension detection no longer depends on `VITE_GARMIN_EXTENSION_ID`
- `spa-train2go-extension`: Extension detection no longer depends on `VITE_TRAIN2GO_EXTENSION_ID`

## Impact

- **Packages**: `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge`, `@kaiord/workout-spa-editor`
- **Layers**: Infrastructure (extension content scripts), UI adapters (bridge transport/discovery)
- **No breaking changes** to domain or public API
- **Removes**: `VITE_GARMIN_EXTENSION_ID`, `VITE_TRAIN2GO_EXTENSION_ID` env vars
- **Extensions**: Users must update to the new version (content script injection requires extension reload)
- **Manifest**: `externally_connectable` can be kept for backward compatibility during transition, removed later
