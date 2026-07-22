# @kaiord/tanita-bridge

Chrome extension (Manifest V3) that bridges the Kaiord editor to
[MyTANITA](https://mytanita.eu). It fetches the user's own body-composition
**CSV export** directly from their logged-in `mytanita.eu` session — no
password is ever entered or sent to a Kaiord-hosted server — and returns the
raw CSV to the Kaiord SPA for parsing.

This package is `private: true` and is not published to npm. The release
workflow packages it as a Chrome Web Store artifact.

## Purpose

- Read the user's MyTANITA CSV export by issuing a single
  `fetch("https://mytanita.eu/en/user/export-csv", { credentials: "include" })`
  from the background service worker. The HttpOnly `TANITASESS` session
  cookie travels automatically; the extension never reads or stores it.
- **SW-direct, no relay**: the fetch happens in the service worker itself —
  there is no content script on `mytanita.eu`. The cookie session (verified by
  the connector research) is sufficient.
- Return **raw CSV text only**. Parsing lives in `@kaiord/tanita` and runs
  SPA-side; this bridge does not import it.
- Report session presence as a boolean (`ping` / `checkSession`) for the SPA
  connection pill, never exposing any cookie value.

The only contract is the `chrome.runtime` message shape, documented inline in
`background.js`:

- `read-export-csv` → `{ ok: true, data: { csv: "<raw text>" } }`, or an error
  envelope with `needsReauth: true` when the session is dead.
- `ping` / `checkSession` → the bridge manifest plus `{ authenticated }`.

## Least-privilege manifest

- `permissions`: `["storage"]` only — **no** `cookies`, `webRequest`,
  `declarativeNetRequest*`, `tabs`, or `scripting`.
- `host_permissions`: `["https://mytanita.eu/*"]` — a single disclosed host.
- `content_scripts`: only the announce-only `bridge-identity.js` +
  `kaiord-announce.js` pair on Kaiord origins — nothing on `mytanita.eu`.

## Build entrypoint

This is a browser extension, not a library — it has no `main` / `exports`.
Load it from the package directory via `chrome://extensions/` → "Load
unpacked". Manifest entrypoints:

- `manifest.json` — development manifest (used for "Load unpacked").
- `manifest.prod.json` — production manifest used when packaging for the store.
- `background.js` — service worker (SW-direct CSV fetch, action routing).
- `session-fetch.js` — vendored identity-free cookie transport (loaded via
  `importScripts`).
- `kaiord-announce.js` — content script injected into Kaiord origins that
  announces the extension's presence and ID to the SPA.
- `popup.html` / `popup.js` / `popup.css` — extension toolbar popup.

## How to test

```bash
# Run the unit-test suite (vitest + jsdom + a chrome-mock helper)
pnpm --filter @kaiord/tanita-bridge test

# Watch mode while iterating
pnpm --filter @kaiord/tanita-bridge test:watch

# Coverage report
pnpm --filter @kaiord/tanita-bridge test:coverage
```

For manual integration checks against a real MyTANITA session, see
[TESTING.md](./TESTING.md).

## License

MIT — see [LICENSE](../../LICENSE).
