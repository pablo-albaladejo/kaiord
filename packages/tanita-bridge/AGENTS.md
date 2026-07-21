<!-- Parent: ../AGENTS.md -->

# tanita-bridge

## Purpose

Chrome extension (MV3, plain JS) bridging the Kaiord editor to MyTANITA. The
flagship **SW-direct** source transport: the background service worker fetches
the user's own body-composition **CSV export** from
`https://mytanita.eu/en/user/export-csv` with `credentials:"include"`, so the
HttpOnly `TANITASESS` session cookie travels automatically. No password, no
`cookies` permission, no content script on `mytanita.eu`. Raw CSV is returned
verbatim; parsing lives in `@kaiord/tanita`, called SPA-side.

## Key Files

| File                                    | Description                                                          |
| --------------------------------------- | -------------------------------------------------------------------- |
| `background.js`                         | Service worker: SW-direct CSV fetch, path allowlist, action routing. |
| `session-fetch.js`                      | Vendored identity-free cookie transport (bridge-core master).        |
| `bridge-identity.js`                    | Per-bridge identity consumed by the vendored announce core.          |
| `popup.js` / `popup.html` / `popup.css` | Session-status popup + a deep link to MyTANITA.                      |
| `manifest.json` / `manifest.prod.json`  | MV3 manifest (`storage` only; host: `https://mytanita.eu/*`).        |

### Vendored bridge-core files

`bridge-envelope.js`, `session-fetch.js`, `kaiord-announce.js`,
`bridge-popup-utils.js`, and `test/{chrome-mock,bridge-envelope.test}.js` are
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
  raw text; the SPA parses.
- External dispatch is origin-pinned and action-allowlisted via the vendored
  envelope. `EXTERNAL_ACTIONS`: `ping` / `checkSession` / `read-export-csv`.
- The session cookie is never read, stored, or logged; session presence is a
  boolean only.
- English-only: `_locales/en/` is the sole locale (hard constraint).
