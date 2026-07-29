## 1. Mount the connection model

- [x] 1.1 Mount `useBridgeConnectionsBootstrap()` in `use-store-hydration.ts` and replace the "intentionally NOT mounted" comment with the reason it now runs.
- [x] 1.2 Flip `use-bridge-connections-bootstrap.test.ts`'s wiring assertion from "not mounted" to "mounted", in the same change.
- [x] 1.3 Correct the hook's own doc comment, which still said it was not mounted.

## 2. Attention derivation

- [x] 2.1 Add `connection-attention.ts` with `needsAttention`, `countInstalled` and `buildAttention(connections, t)` — a pure module taking a `Translate`, so its copy is asserted without rendering.
- [x] 2.2 Define "needs attention" as `error !== null || needsReauth`. Establish from `bridge-session-probes.ts` + `bridge-connection-refresh.ts` that `discovered && !sessionActive` would flag `tanita-bridge` forever, and pin it with a test. See design.md D1.
- [x] 2.3 Restrict the consequence line to `lastSyncAt` (survives a reload), `needsReauth` and `error`. Ship no "broken since" — `lastCheckedAt` is when the SPA last probed, not when the source broke. See design.md D3.
- [x] 2.4 Take the date branch only when exactly one connection is affected, so one source's date is never attached to a set.
- [x] 2.5 Ignore a `lastSyncAt` that does not parse as a date rather than rendering `Invalid Date`.
- [x] 2.6 Leave `action` unfed: `ExtensionsTab` covers three of the five bridges and offers a status refresh, not a fix, so a CTA would dead-end WHOOP and TrainingPeaks. See design.md D4.

## 3. Feeding the shell

- [x] 3.1 Add `use-settings-attention.ts`: joins `useActiveProfileLive` and `useBridgeConnections` and returns the model or `null`.
- [x] 3.2 Feed the banner on the index and the chip on the rail — never both, so an open section states the consequence once. See design.md D5.
- [x] 3.3 Give `SettingsSectionRail` an `attention` prop rather than letting it derive its own, so both surfaces are the same model by construction.

## 4. Connections row value

- [x] 4.1 Add `use-connections-value.ts` counting `discovered`, and register `connections` as a `SettingsValueKey` resolved by `useSettingsRowValues` like every other row.
- [x] 4.2 Count installed bridges, not live sessions: `tanita-bridge` has no prober, so a session count would sit at 4 of 5 forever. See design.md D2.
- [x] 4.3 Pass `null` as the profile id — the count reads `discovered` only, so the per-profile sync-timestamp query is skipped.
- [x] 4.4 Render no value at all when no bridge is known, rather than "0 of 0".

## 5. i18n

- [x] 5.1 Add `values.connections.installed`, `attention.title_one`, `attention.title_other`, `attention.noNewDataSince`, `attention.signedOut` and `attention.lastCheckFailed` to `en` and `es`; `resource-parity.test.ts` green.
- [x] 5.2 Select the plural key explicitly (`count === 1 ? "_one" : "_other"`) — the SPA's `Translate` interpolates but does not pluralise, matching `LibraryHeader` and `StatsContent`.
- [x] 5.3 Interpolate no bridge name into any attention string.

## 6. Tests

- [x] 6.1 `connection-attention.test.ts`: the probe-less installed bridge is not flagged, a failed probe and a re-authorisation are, singular/plural titles, each consequence branch, an unparseable timestamp, and no action.
- [x] 6.2 `use-connections-value.test.tsx`: the count, the reachable denominator (5 of 5 with Tanita installed), and no value when nothing is known.
- [x] 6.3 `use-settings-attention.test.tsx`: null while healthy, the model from a failed connection, and the active profile threaded into the read.
- [x] 6.4 `SettingsPage.test.tsx`: banner on the index, chip inside a section, neither while healthy, and the installed count on the Connections row.

## 7. Quality gates

- [x] 7.1 `pnpm -r build` clean.
- [x] 7.2 Full SPA suite green (860 files, 6110 tests).
- [x] 7.3 `pnpm --filter @kaiord/workout-spa-editor lint` clean (`tsc -b --noEmit` + ESLint + Prettier).
- [x] 7.4 `pnpm test:scripts` and root `pnpm lint` green, `pnpm lint:specs` included.
- [x] 7.5 `npx playwright test --list` parses the whole e2e tree.
- [x] 7.6 `bridge-store-persistence-boundary.test.ts`'s file list untouched — no bridge runtime module was added, renamed or split.
