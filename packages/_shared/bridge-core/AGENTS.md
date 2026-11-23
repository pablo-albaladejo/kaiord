<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-11-09 -->

# bridge-core

## Purpose

Masters for the code every Kaiord bridge extension shares. Each master is
vendored **byte-identically** into its consumer bridges by
`scripts/sync-bridge-core.mjs` (`pnpm bridge:sync`) and locked by
`scripts/check-bridge-core-parity.test.mjs`. Bridges never import across
packages at runtime — sharing is copy-at-sync-time, keeping
`scripts/package-extension.sh`'s flat-file packaging untouched. Normative
contract: `openspec/specs/bridge-core/spec.md`.

Per-bridge identity (`id`, `name`, `capabilities`) lives ONLY in each
bridge's `bridge-identity.js` (loaded before the announce core) and in its
`BRIDGE_MANIFEST` literal in `background.js`; the parity guard asserts the
two agree and that no master contains identity values. The one per-bridge
visual value — the header monogram glyph (`G`, `T2`, `Wh`, `Ta`, `TP`) — is
markup in each bridge's `popup.html`, not a token in the shared `popup.css`.

All five bridges share ONE 340px popup shell (`popup.css` +
`bridge-popup-shell.js`); the header monogram is the only per-bridge variable,
and no provider brand hue appears in any bridge package. The popup follows the
theme picked in the Kaiord app: the SPA sends its preference as the external
`set-theme` action, `bridge-theme.js` stores it and applies `data-theme` before
first paint, and `system` (or no preference yet) follows
`prefers-color-scheme`. The shell's `--kd-*` palettes are copied from
`styles/brand-tokens.css` (dark on `:root`, light in two identical blocks) and
pinned by `scripts/check-bridge-popup-tokens-parity.test.mjs`.

## Key Files

| File                               | Consumers                       | Description                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bridge-envelope.js`               | all bridges                     | Envelope builders + `createDispatch`/`createExternalDispatch`/`createInternalDispatch` (own pages only, no content script) + SPA-origin guard.                                                                                                                                                                                                                 |
| `session-fetch.js`                 | tanita, train2go, trainingpeaks | Cookie-session transport for SW-direct bridges: `credentials:"include"`, `redirect:"manual"`, caller-supplied path allowlist; maps a redirect or a 401 to `needsReauth`, and a 403 keeps its status like any other failure.                                                                                                                                    |
| `bridge-telemetry.js`              | garmin, train2go                | Swallowed-error telemetry (`logSwallowed`, capped `bridgeTelemetry` log in `chrome.storage.local`) and the worker's `loadScript` (importScripts, or require under Node).                                                                                                                                                                                       |
| `bearer-fetch.js`                  | garmin, trainingpeaks           | `Authorization: Bearer` transport (`credentials:"omit"`): JSON or multipart body, one retry on 401 via the caller's `refreshToken`, then `needsReauth`; `raw: true` hands the answer over unread. Wrapped in one scope object so it never collides in a worker.                                                                                                |
| `bridge-request-gate.js`           | all bridges                     | The thin Bridge's `request` gate: only `method`, `path` and a declared `body`; an entry of the bridge's closed list; a body only where the entry names a schema, matched against it. Anything else is `Request not allowed`, `retryable: false`.                                                                                                               |
| `bridge-answer.js`                 | all bridges                     | The `request` answer `{ status, contentType, body }`, the Platform's answer unread but for its Session secrets: every HTML `<input>`/`<meta>` named token/csrf/xsrf/session/nonce, an inline csrf token's value, and every JSON credential key. Nothing to remove: byte for byte. Also `toBridgeError`: a failed request as the Error the envelope serialises. |
| `kaiord-announce.js`               | all bridges                     | Announce content script core; reads `globalThis.KAIORD_BRIDGE_IDENTITY` (its `protocolVersion`, default 1).                                                                                                                                                                                                                                                    |
| `bridge-popup-utils.js`            | all bridges                     | Popup i18n machinery (`msg`, `uiLocale`, `localizePage`), `$`, `withTimeout`, `relativeAgo`, `formatSinceDate`, `renderRetry`.                                                                                                                                                                                                                                 |
| `bridge-popup-shell.js`            | all bridges                     | Shell renderers: `renderStatusBlock`, `renderChips`, `renderConsequence`, `renderSkeleton`, `renderCtas`, `renderNotice`, and `renderBrokenConnection` (a notice the popup worded, dated by a known outage, the monogram muted until then).                                                                                                                    |
| `bridge-popup-health.js`           | all bridges                     | Outage boundary (`bridgeHealth` in `chrome.storage.local`): when a bridge was first observed broken, cleared on success.                                                                                                                                                                                                                                       |
| `bridge-popup-snapshot.js`         | garmin, train2go                | Athlete card + snapshot freshness (`STALE_SNAPSHOT_THRESHOLD_DAYS` vendored literal).                                                                                                                                                                                                                                                                          |
| `connection-notices.js`            | all bridges                     | The four Connection fixes and their one en/es wording, read by every popup and by the App via `@kaiord/i18n`; beside them `REASONS` (a sign-in that cannot serve, e.g. `no-account-id` → Sign in), `NOT_CHECKED` (why a check asked nothing: `would-mint-token`, `no-token-captured`) and the one exception `NO_TAB` (Open {platform}); typed by `.d.ts`.      |
| `popup.css`                        | all bridges                     | The unified 340px popup shell (`--kd-*` light + dark palettes, layout, components).                                                                                                                                                                                                                                                                            |
| `bridge-theme.js`                  | all bridges                     | App theme preference: `set-theme` validation + `chrome.storage.local` write (SW); `data-theme` before first paint (popup).                                                                                                                                                                                                                                     |
| `profile-snapshot.js`              | garmin, train2go                | Plain-JS snapshot validator mirroring the @kaiord/core Zod schema.                                                                                                                                                                                                                                                                                             |
| `test/chrome-mock.js`              | all bridges                     | Superset chrome API mock for vitest (neutral identity values).                                                                                                                                                                                                                                                                                                 |
| `test/bridge-envelope.test.js`     | all bridges                     | Vendored unit tests for the envelope module.                                                                                                                                                                                                                                                                                                                   |
| `test/bearer-fetch.test.js`        | garmin, trainingpeaks           | Vendored unit tests for the Bearer transport.                                                                                                                                                                                                                                                                                                                  |
| `test/bridge-request-gate.test.js` | all bridges                     | Vendored unit tests for the request gate (refusals, schema shapes).                                                                                                                                                                                                                                                                                            |
| `test/bridge-answer.test.js`       | all bridges                     | Vendored unit tests for the answer: what is removed from HTML and JSON, and what is kept.                                                                                                                                                                                                                                                                      |
| `test/bridge-popup-shell.test.js`  | all bridges                     | Vendored unit tests for the shell renderers (jsdom env, CJS `require`).                                                                                                                                                                                                                                                                                        |
| `test/bridge-popup-health.test.js` | all bridges                     | Vendored unit tests for the health record (callback-form storage stub, CJS `require`).                                                                                                                                                                                                                                                                         |
| `test/bridge-theme.test.js`        | all bridges                     | Vendored unit tests for the theme module (validation, storage, light/dark/system/missing, mirror).                                                                                                                                                                                                                                                             |
| `test/session-fetch.test.js`       | tanita, train2go, trainingpeaks | Vendored unit tests for the cookie-session transport (neutral origin and allowlist).                                                                                                                                                                                                                                                                           |
| `test/bridge-popup-utils.test.js`  | all bridges                     | Vendored unit tests for the popup utilities, incl. `withTimeout` and `renderRetry` (jsdom env).                                                                                                                                                                                                                                                                |
| `test/kaiord-announce.test.js`     | all bridges                     | Vendored unit tests for the announce core; reads the bridge's own `bridge-identity.js` instead of repeating it.                                                                                                                                                                                                                                                |
| `test/popup-locales.test.js`       | all bridges                     | Each popup in English and Spanish, against the bridge's own `popup.html`, scripts and `_locales`: name, page language, notice.                                                                                                                                                                                                                                 |

## For AI Agents

### Working In This Directory

- **Edit only the masters.** Vendored copies in `packages/*-bridge/` are
  generated; hand-edits fail the parity guard. After editing, run
  `pnpm bridge:sync` then `pnpm test:scripts`.
- **No identity values in masters.** Bridge ids, display names, capability
  tokens, and integration hostnames are rejected by the master-purity check.
- **Adding a master:** extend `BRIDGE_CORE_MASTERS` in
  `scripts/sync-bridge-core.mjs` (declare the consumer set), sync, and keep
  the bridge-core spec's master list in step.
- **Load order matters:** popup masters assume classic-script global scoping
  (utils before shell before health before snapshot before the site
  `popup.js`); the announce core assumes `bridge-identity.js` loaded first. The
  shell renderers take `$`/`msg` as arguments so each is also unit-testable
  through a CJS `require`.
- **The health record is popup-owned.** `recordProbe` is called from each
  `popup.js` after its session probe, never from `background.js`: nothing
  polls, and a new popup→background action would widen a surface the
  privacy-surface guard enumerates. Only a CONCLUSIVE probe is folded in — a
  worker timeout says nothing about the upstream session and must not open an
  outage.
- **Popup strings live per bridge, in English and Spanish.** Every string a
  popup shows arrives as a message key from that bridge's `_locales/en` or
  `_locales/es` (Chrome picks the catalog from the browser's UI language), or
  from the shared Connection notices in the language `uiLocale()` reads.
  `popup.html` holds no words: an element names its message with `data-i18n`
  or `data-i18n-aria-label`, filled by `localizePage()`. The
  `KAIORD_POPUP_MESSAGES` table is the English fallback for jsdom and repeats
  `_locales/en` word for word (`scripts/check-bridge-popup-message-parity.test.mjs`,
  `scripts/check-bridge-locales-en-es.test.mjs`, R-BridgeLocalesEnglishSpanish).

### Testing Requirements

- `pnpm test:scripts` — parity (byte, purity, identity↔manifest) + sync unit
  tests, including the check that each test master is vendored to exactly the
  bridges of its runtime master.
- Each consumer bridge's vitest suite exercises its vendored copies
  (every `test/*.test.js` master listed above), so a drifted copy fails where it is
  actually used, not only in the parity guard.
