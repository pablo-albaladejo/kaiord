<!-- Parent: ../AGENTS.md -->

# tanita-bridge

## Purpose

Chrome extension (MV3, plain JS) bridging the Kaiord editor to MyTANITA. The
flagship **SW-direct** source transport: the background service worker fetches
the user's own body-composition **CSV export** from
`https://mytanita.eu/en/user/export-csv` with `credentials:"include"`, so the
HttpOnly `TANITASESS` session cookie travels automatically. No password, no
`cookies` permission, no content script on `mytanita.eu`.

**Thin Bridge** (`docs/adr/0004-thin-bridge-smart-connector.md`, protocol
version 2): the App reaches it only through `{ action: "request", method,
path, body? }`, which runs only an entry of the closed `ALLOWED` list in
`background.js` (method + path pattern, and for a write the name of the body
schema the vendored `bridge-request-gate.js` checks it against) and answers
MyTANITA's answer unread but for its Session secrets (removed by
the vendored `bridge-answer.js`) as `{ status, contentType, body }`. What to ask for,
how to read it, pacing and retries are the App's Connector (`packages/workout-spa-editor/src/adapters/tanita/`, which also tells a login page from the export). The App
falls back to the protocol-1 actions for the store version. The internal
channel uses `createInternalDispatch`: only the popup is answered, never a
content script (`test/thin-bridge.test.js`).
Parsing lives in `@kaiord/tanita`, App-side.

## Key Files

| File                                    | Description                                                                                                                                                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `background.js`                         | Service worker: closed list, `request`, HEAD Session check, popup gate.                                                                                                                                                                                           |
| `personal-fields.js`                    | The one declaration of the personal fields of the Platform's answers that no Connector reads, starting from the vendored `personal-identity.js`; `bridge-answer.js` removes them by name from every answer (ADR 0004, `openspec/changes/bridges-owner-decisions`) |
| `session-fetch.js`                      | Vendored identity-free cookie transport (bridge-core master).                                                                                                                                                                                                     |
| `bridge-identity.js`                    | Per-bridge identity consumed by the vendored announce core.                                                                                                                                                                                                       |
| `popup.js` / `popup.html` / `popup.css` | Shared bridge shell: status block, capability chips, fix-first CTA pair.                                                                                                                                                                                          |
| `manifest.json` / `manifest.prod.json`  | MV3 manifest (`storage` only; host: `https://mytanita.eu/*`).                                                                                                                                                                                                     |

### Public texts

`store-listing.md` (Short and Detailed Description, English and Spanish),
`privacy-justification.md`, `extDescription` in `_locales/en/messages.json`
and `_locales/es/messages.json`, and the "Kaiord for Tanita
Extension" section of `packages/docs/legal/privacy-policy.md` are a registered
claims surface: every sentence is an entry in `claims/tanita.json` with its
proof (`pnpm lint:claims`, see `claims/README.md`). The extension is named
"Kaiord for Tanita" in both languages, and no athlete-facing text says "bridge"
(`pnpm lint:retired-terms`).
`test/export-confinement.test.js` proves the listing's promises at the message
contract: requests go only to the export (a GET or a HEAD), a session check is
one HEAD that reads no body and answers only the typed outcome (`signed-out`
only on a bounce to the login page), the export is handed over unchanged, and
only the theme is stored by the service worker.

### Vendored bridge-core files

`bridge-envelope.js`, `bridge-answer.js`, `session-fetch.js`, `kaiord-announce.js`,
`bridge-popup-utils.js`, `bridge-popup-shell.js`, `popup.css`, and
`test/{chrome-mock,bridge-envelope.test,bridge-popup-shell.test}.js` are
byte-identical vendored copies of `packages/_shared/bridge-core/` masters —
never edit them here; edit the master and run `pnpm bridge:sync` (guard:
`scripts/check-bridge-core-parity.test.mjs`). The `session-fetch.js` master is
identity-free: the Tanita host, path, and allowlist live in `background.js`,
never in the master. Identity values in `bridge-identity.js` must match
`BRIDGE_MANIFEST` in `background.js`.

## For AI Agents

- Plain JavaScript by design (strict-TS exception in root `CLAUDE.md`);
  correctness lives in the vitest suite (`pnpm test` / `test:coverage`).
- The bridge NEVER parses CSV and NEVER imports `@kaiord/tanita` — it returns
  MyTANITA's answer unread; the App's Connector tells a login page from the
  export and parses it.
- External dispatch is origin-pinned and action-allowlisted via the vendored
  envelope. `EXTERNAL_ACTIONS`: `ping` / `checkSession` / `request` /
  `set-theme`.
- The session cookie is never read, stored, or logged; a Session check is a
  `HEAD` of the export and answers only `{ session, authenticated }`. It
  never downloads the export (#1643, spec: bridge-core).
- English and Spanish: `_locales/en/` (default) and `_locales/es/`, same keys,
  chosen by the browser's UI language; the name is "Kaiord for Tanita" in both
  (R-BridgeLocalesEnglishSpanish, `scripts/check-bridge-locales-en-es.test.mjs`).
