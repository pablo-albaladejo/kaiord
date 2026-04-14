## Context

The SPA currently uses `chrome.runtime.sendMessage(extensionId, msg)` to communicate with bridge extensions. The `extensionId` comes from `VITE_*` env vars baked into the bundle at build time. This violates twelve-factor principles (config in code, non-portable artifacts).

Both extensions already have `externally_connectable` configured for `*.kaiord.com` and `localhost`. The background service workers handle `onMessageExternal` for ping, push, list, etc.

## Goals / Non-Goals

**Goals:**

- Remove build-time extension ID coupling from the SPA
- Extensions self-announce via content scripts injected into SPA pages
- SPA discovers bridges at runtime without any configuration
- Zero-config developer experience (install extension → it works)
- Maintain existing message protocol (`chrome.runtime.sendMessage` for operations)

**Non-Goals:**

- Changing the message protocol between SPA and extensions (ping, push, list, read-week, etc.)
- Supporting non-Chrome browsers (content scripts are Chrome-only, same as current)
- Dynamic bridge plugin system (two known bridges is sufficient)
- Removing `externally_connectable` immediately (keep for backward compat during rollout)

## Decisions

### D1: Content script announces bridge via `window.postMessage`

**Layer**: Infrastructure (extension content scripts)

Each extension adds a lightweight content script (~20 LOC) that runs on `*.kaiord.com` and `localhost:*`. On injection, it posts a message to `window`:

```
{ type: "KAIORD_BRIDGE_ANNOUNCE", bridgeId, extensionId, name, version, protocolVersion, capabilities }
```

The `extensionId` is `chrome.runtime.id` — always correct, even for unpacked extensions.

**Why not `CustomEvent`?** `window.postMessage` is the standard for page ↔ content script communication. CustomEvent works but `postMessage` is more conventional and has origin checking built in.

**Why not `chrome.runtime.connect`?** Requires knowing the extension ID upfront — the same problem we're solving.

### D2: SPA listens for announcements in a bridge discovery adapter

**Layer**: UI adapter (`adapters/bridge/`)

New `bridge-discovery.ts` module:
- Adds a `window.addEventListener("message", ...)` listener on app boot
- Filters for `type === "KAIORD_BRIDGE_ANNOUNCE"` and validates origin
- Extracts `extensionId` from the announcement
- Registers the bridge in the existing bridge registry with the discovered ID
- Content scripts re-inject on page navigation (SPA is single-page, so one injection per load)

The discovery module replaces the current `EXTENSION_ID` constants in `use-garmin-bridge-actions.ts` and `train2go-store.ts`.

### D3: Transport functions receive extensionId as parameter (already do)

**Layer**: UI adapter (transport)

Both `garmin-extension-transport.ts` and `train2go-extension-transport.ts` already accept `extensionId` as a parameter. No changes needed to transport. The change is in **who provides the ID**: discovery module instead of `import.meta.env`.

### D4: Keep `externally_connectable` during transition

**Layer**: Extension manifest

Content scripts can communicate with the background via internal `chrome.runtime.sendMessage` (no ID needed). However, the SPA still uses `chrome.runtime.sendMessage(extensionId, msg)` for operations — this is an **external** message that requires `externally_connectable`.

Keep `externally_connectable` as-is. The difference is the SPA now discovers the ID at runtime instead of having it baked in.

### D5: Content script re-announces on request

**Layer**: Extension content script

The SPA may load before the content script injects (race condition). To handle this:
- Content script announces on injection (`run_at: "document_start"`)
- Content script also listens for `KAIORD_BRIDGE_DISCOVER` messages from the SPA
- SPA sends `window.postMessage({ type: "KAIORD_BRIDGE_DISCOVER" })` if no bridges discovered after 2s
- Content script re-announces on receiving this message

This handles service worker cold starts and slow content script injection.

## Risks / Trade-offs

- **[Risk] Content script timing** → Mitigated by D5 (re-announce on request) and the existing two-stage ping timeout
- **[Risk] Security: spoofed announcements** → Low risk. A malicious page could fake an announcement, but the SPA still validates via `chrome.runtime.sendMessage(extensionId, ping)` which only works with the real extension. The announcement just provides the ID to try.
- **[Trade-off] Extension update required** → Users must reload the extension to get the new content script. Acceptable for a private/early extension.
- **[Trade-off] Both extensions need the same content script** → ~20 LOC duplicated. Not worth extracting to a shared module for this size.
