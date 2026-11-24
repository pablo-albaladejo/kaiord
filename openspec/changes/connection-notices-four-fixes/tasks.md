## 1. Single source (seam 1 and 3)

- [x] 1.1 `packages/i18n/src/connection-notice.test.ts` (red first): four fixes, the state map, both locales, an unknown state to Try again, no "signed out".
- [x] 1.2 `packages/_shared/bridge-core/connection-notices.js` + `.d.ts`; `@kaiord/i18n` exports `connectionNotice`, `connectionFix`, `CONNECTION_FIXES`.
- [x] 1.3 Vendored to all five bridges (`BRIDGE_CORE_MASTERS`, `pnpm bridge:sync`).

## 2. State mapping in the App (seam 3)

- [x] 2.1 `connection-state.test.ts` and `bridge-ping-session-probes.test.ts` (red first): every transition per bridge at the message contract, outdated on any action (#1098), a failed Garmin read never signed out (#1100), WHOOP by `connected` alone (#1091).
- [x] 2.2 `session-outcome.ts`, `connection-state.ts`, `classifyEnvelope` probers; discovery accepts another protocol version.
- [x] 2.3 `popup-app-parity.test.ts`: the shipped popup function and the App prober word the same answer the same way.

## 3. App surfaces

- [x] 3.1 Connections card notice, consequence banner, header pill, Settings banner; page-wide install banner removed.
- [x] 3.2 Editor ribbon, Send to Garmin, Send week, placement feedback, Update Garmin (detail and toast), TrainingPeaks send, assistant push toast.
- [x] 3.3 Coaching description and sync, zones toast, Tanita body export, coaching link line.
- [x] 3.4 Every replaced phrasing removed from `en` and `es`.

## 4. Extensions

- [x] 4.1 `renderNotice` shell renderer and its vendored test; five popups render the notice with one fix, English via `EXTENSION_LOCALE`.
- [x] 4.2 Popup tables and `_locales/en` lose the replaced keys; screenshot instructions name the new wording.

## 5. Guard (seam 1)

- [x] 5.1 `scripts/check-connection-notices.test.mjs` (red first), then the guard, wired as `pnpm lint:connection-notices` in `lint:parallel`.

## 6. Quality gates

- [x] 6.1 App unit suite, e2e specs for Connections and for sending with no extension or an outdated one, bridge suites, `pnpm test:scripts`, `pnpm lint`, `pnpm lint:claims`.
- [x] 6.2 Changesets.
