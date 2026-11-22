## Why

Every extension let any `kaiord.com` subdomain talk to it. The manifests
declared `https://*.kaiord.com/*` for `externally_connectable` and for the
announce content script, and the shared envelope guard accepted
`^https://([a-z0-9-]+\.)?kaiord\.com$`. The Kaiord App is served from one
origin, `https://kaiord.com` (`www` 301s to the apex), so every other
subdomain was a page that could borrow the athlete's Session through an
extension without being the App. Refused origins also got an answer, an error
envelope that confirmed the extension was installed. Issue #1638, user story
69 of #1670.

## What Changes

- The shared envelope guard (`packages/_shared/bridge-core/bridge-envelope.js`,
  vendored into all five bridges) accepts the exact origin
  `https://kaiord.com`, compared as a string. Any other origin, a subdomain
  and `www` included, or a sender with no origin, gets **no answer**: the
  guard returns `false` without calling `sendResponse`.
- The Vite dev origins (`http://localhost:5173`, `http://localhost:5174`) are
  accepted only when the loaded manifest's `externally_connectable.matches`
  declares them. The development `manifest.json` does; the packaged
  `manifest.prod.json` does not, so a store build refuses them at runtime as
  well as in Chrome.
- All ten manifests (`manifest.json` and `manifest.prod.json` of garmin,
  train2go, tanita, trainingpeaks and whoop) declare `https://kaiord.com/*`
  instead of `https://*.kaiord.com/*`, for `externally_connectable` and for
  the announce content script.
- New root guard `scripts/check-bridge-exact-origin.mjs`
  (`pnpm lint:bridge-exact-origin`, `R-BridgeExactOrigin`) fails on a wildcard
  origin in any manifest, a dev origin in a production manifest, a wildcard
  extension id, or runtime code that matches the App origin by pattern.
- The store and privacy texts, the public privacy policy and its guard, the
  privacy-surface golden and the bridge READMEs/AGENTS describe the exact
  origin.

## Capabilities

### Modified Capabilities

- `bridge-core`: exact-origin gate, no answer to other origins, dev origins
  bound to the loaded manifest; new root guard.
- `garmin-bridge`, `train2go-bridge`, `whoop-bridge`: manifest and announce
  matches narrowed to `https://kaiord.com/*`.
- `extension-store-publish`: the production manifest declares
  `https://kaiord.com/*` only.
- `bridge-runtime-discovery`: the announce script runs on the exact App
  origin only.
- `privacy-policy`: the policy discloses the exact origin.

## Impact

- The Kaiord App at `https://kaiord.com/app` is unaffected. Anything served
  from another `kaiord.com` host (a preview, a staging host) can no longer
  reach an extension.
- The protocol envelope and its version are unchanged; only refused origins
  lose their error reply. The SPA never ran on a refused origin, so it reads
  no reply that disappears.
- The active `add-a2a-endpoint` change restates the privacy-policy runtime
  discovery disclosure; its delta now names the exact origin too, so archiving
  it does not bring the wildcard back.
