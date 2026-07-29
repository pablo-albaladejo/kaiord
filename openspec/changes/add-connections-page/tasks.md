## 1. One definition of connected

- [x] 1.1 Add `application/connections/connected-source.ts` with
      `isBridgeConnected(discovered, record)` (absence-tolerant) and
      `isSourceConnected(entry, record, isDiscovered)`; document why a missing
      record means "never disconnected". See design.md D1.
- [x] 1.2 Answer `false` for `manual` — the predicate asks whether an account is
      linked — so the Data Hub's manual column keeps reading "Always on".
- [x] 1.3 Rename `DataHubMatrixSignals.isBridgeOnline` to `isBridgeConnected`
      and replace the intentional-divergence comment with the union rule.
- [x] 1.4 Feed the new predicate from `use-data-hub-matrix` and from
      `build-data-route-signals` (the chat `get_data_routes` path), translating
      bridgeId → providerId via a new `integrationIdForBridge`.
- [x] 1.5 Pass discovery into `DataHubMatrix` so the column header stops
      demanding a `connected` record no code path writes.
- [x] 1.6 Split `fetch-policies-by-data-type` out of `build-data-route-signals`
      to stay under the 80-line cap.

## 2. Card model

- [x] 2.1 `connection-source.ts`: the `ConnectionSource` view model and the
      rank that orders connected → attention → available → manual → unsupported.
- [x] 2.2 `connection-source-status.ts`: derive `installed` from
      discovered ∧ ¬checking ∧ `lastCheckedAt === null` rather than from a
      hardcoded bridge list, and declare `BridgeSessionSignal` locally so the
      application layer imports no adapter. See design.md D2.
- [x] 2.3 `bridge-route-types.ts`: intersect the announced token with
      `bridgeSupportsRoute`; pin that TrainingPeaks' export list is empty.
- [x] 2.4 `build-connection-sources.ts`: pure assembly with injected signals;
      claim no routes for an undiscovered extension.
- [x] 2.5 `use-connection-sources.ts`: read discovery from the store's own
      `discovered` flag, not from `useDiscoveredBridges`. See design.md D3.

## 3. On-demand import

- [x] 3.1 Move the four whole-window runners into `hooks/bridge-import/` and
      point the calendar's auto hooks at them, so manual and automatic pulls
      cannot drift.
- [x] 3.2 `bridge-importers.ts` maps bridgeId → runner; record at the map why
      `train2go-bridge` is absent (week-scoped import). See design.md D5.
- [x] 3.3 `use-bridge-import.ts`: in-flight guard + 60 s cooldown, reported to
      the user rather than swallowed.
- [x] 3.4 Render the button only where `supported` is true.

## 4. Section UI

- [x] 4.1 `ConnectionsTab.tsx` plus one component per concern (header, status
      line, bridge line, chips, manage panel, route list, sync button, action,
      api-key panel, unsupported list) to stay under the 80-line cap.
- [x] 4.2 Give every card `connection-card-<id>` and a `data-status` attribute
      from the start, so e2e never has to match raw English.
- [x] 4.3 Use only semantic theme tokens (`bg-surface*`, `text-ink-*`,
      `border-edge*`, `text-accent`); express the attention tint as a ring
      rather than a competing border colour. See design.md D7.
- [x] 4.4 Reuse `ConnectionMark`, `DisconnectConfirmation`, `ApiKeyConnectForm`
      and `bridgePolicies` from AthleteConnections. See design.md D9.
- [x] 4.5 Mount `useDataFlows` once per section, not once per card.
- [x] 4.6 Report sync outcome inline as `role="status"` — a toast would need a
      non-literal first argument, which `check-no-pii-leakage` rejects. See
      design.md D6.

## 5. Wiring

- [x] 5.1 Add `connections` to `SettingsTab`, `TAB_ORDER` and `TAB_VIEWS`; no
      router change is needed.
- [x] 5.2 Re-point the `connections` settings row at `/settings/connections`
      and drop its `TODO(S3)`.
- [x] 5.3 Mount `useBridgeConnectionsBootstrap` in `use-store-hydration` and
      flip the test that asserted it was not mounted. See design.md D8.

## 6. i18n

- [x] 6.1 Add `locales/{en,es}/connections.json` — no registration needed,
      `resources.ts` globs.
- [x] 6.2 Add `settings.tabs.connections` in both locales.
- [x] 6.3 Give the 13 managed data types labels and assert mechanically that
      every `managedDataTypes` member has one in both locales, so a 14th type
      cannot render its raw key.
- [x] 6.4 Handle singular/plural with explicit keys — `useTranslate` has no
      plural support, and "1 types in" is wrong in both languages.

## 7. Honest copy

- [x] 7.1 Render Tanita as "Extension installed", never "connected" or
      "checking".
- [x] 7.2 Render a signed-out bridge as "Session signed out", not "token
      expired".
- [x] 7.3 Ship no "primary for N" chip — `union` is the default mode and has no
      winner.
- [x] 7.4 Ship no "stopped syncing N days ago" — no transition timestamp
      exists; show last-received-at or "No data received yet".
- [x] 7.5 Offer Reconnect only where the extension is present; explain instead
      of offering a control that cannot work.
- [x] 7.6 List Strava and Wahoo with no "Notify me" — nothing records interest.

## 8. Tests and verification

- [x] 8.1 Unit-test the predicate, the status derivation, the route-type
      intersection and the builder ordering.
- [x] 8.2 Component-test the card test ids, the installed/signed-out wording,
      the Reconnect gate, the Manage disclosure and the unsupported list.
- [x] 8.3 Hook-test the cooldown, the unsupported bridge, the failure path and
      the vanished-extension path.
- [x] 8.4 Update `SettingsPage.test.tsx` (row destination + rail section list)
      and the renamed signal across four existing test modules.
- [x] 8.5 `pnpm -r build`, SPA `test`, SPA `lint`, `pnpm test:scripts`, root
      `pnpm lint`, `pnpm lint:specs`, and `playwright test --list`.

## 9. Review round — honesty and guard defects

- [x] 9.1 Move the in-flight import guard out of hook state into
      `import-cooldown`, joining an existing pull rather than refusing it, so a
      card collapse cannot start a second concurrent whole-CSV download. See
      design.md D12.
- [x] 9.2 Add the unmount-while-PENDING test — the existing one awaited
      completion before unmounting, so it only exercised the state where the
      guard already held. Watched it fail (importer called twice) first.
- [x] 9.3 Take `hasProbe` as a signal instead of inferring it from
      `lastCheckedAt === null`, which a probed bridge also reaches. Watched the
      new test fail ("expected 'installed' to be 'checking'") first. See
      design.md D2.
- [x] 9.4 Restructure the status fixtures so `hasProbe` is the axis under test
      rather than a bridge chosen where the inference happened to be right.
- [x] 9.5 Report delivery failure through `delivered` on the transport
      envelope, map it to a new `unreachable()` probe result, and write
      `discovered: result.reachable`, so an uninstalled extension stops being
      reported as present. Watched the store test fail ("expected true to be
      false") first. See design.md D11.
- [x] 9.6 Establish by reading `tanita-bridge/background.js` that `ping` routes
      into `checkSession` and downloads the whole export CSV, and therefore
      that a liveness ping is NOT available for that bridge — the first
      implementation of this fix would have re-downloaded the user's history
      every five minutes.
- [x] 9.7 Word the unverifiable bridge honestly ("Detected on load", plus a
      detail line saying it may have been removed since), driven by
      `sessionVerifiable` rather than a hardcoded bridge id.
- [x] 9.8 Minors: keep last-sync visible on `attention`, and stop
      `useDataFlows` issuing queries for an empty profile id.
