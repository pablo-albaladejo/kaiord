---
"@kaiord/garmin-bridge": patch
"@kaiord/train2go-bridge": patch
---

Make `kaiord-announce.js` resilient to "Extension context invalidated". When the bridge is reloaded, Chrome terminates the script's runtime context but does not remove its `window.message` listener (the listener is bound to the page, not the extension). The next `KAIORD_BRIDGE_DISCOVER` would otherwise call `chrome.runtime.id` / `chrome.runtime.getManifest()` and throw an uncaught error in the page console. The listener now detects the invalidated context, bails, and removes itself so future discover requests are silent — the new content script (re-injected on `onInstalled` for tabs covered by `host_permissions`, or via the next page load otherwise) takes over cleanly.
