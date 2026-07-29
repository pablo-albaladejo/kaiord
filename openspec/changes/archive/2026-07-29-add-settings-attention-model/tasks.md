> Tasks: 53 completed, 0 deferred

## 1. Mount the connection model

- [x] 1.1 Mount `useBridgeConnectionsBootstrap()` in `use-store-hydration.ts` and replace the "intentionally NOT mounted" comment with the reason it now runs.
- [x] 1.2 Flip `use-bridge-connections-bootstrap.test.ts`'s wiring assertion from "not mounted" to "mounted", in the same change.
- [x] 1.3 Correct the hook's own doc comment, which still said it was not mounted.

## 2. Attention derivation

- [x] 2.1 Add `connection-attention.ts` with `needsAttention`, `countInstalled` and `buildAttention(connections, t)` — a pure module taking a `Translate`, so its copy is asserted without rendering.
- [x] 2.2 Define "needs attention" as `error !== null || needsReauth`. Establish from `bridge-session-probes.ts` + `bridge-connection-refresh.ts` that `discovered && !sessionActive` would flag `tanita-bridge` forever, and pin it with a test. See design.md D1.
- [x] 2.3 Restrict the consequence line to `lastSyncAt` (survives a reload), `needsReauth`, `outdated` and `error`. Ship no "broken since" — `lastCheckedAt` is when the SPA last probed, not when the source broke. See design.md D3.
- [x] 2.4 Take the date branch only when exactly one connection is affected, so one source's date is never attached to a set.
- [x] 2.5 Ignore a `lastSyncAt` that does not parse as a date rather than rendering `Invalid Date`.
- [x] 2.5a Rank the two actionable causes above the date: a re-auth demand normally coexists with a `lastSyncAt` (you only get one for an account you were syncing), so the date-first order hid the only actionable line in the ordinary case.
- [x] 2.5b Render the reader's local calendar day, not `toISOString()`'s, so a 02:00Z sync does not show the wrong day west of UTC.
- [x] 2.6 Leave `action` unfed: `ExtensionsTab` covers three of the five bridges and offers a status refresh, not a fix, so a CTA would dead-end WHOOP and TrainingPeaks. See design.md D4.

## 3. Feeding the shell

- [x] 3.1 Add `use-settings-attention.ts`: joins `useActiveProfileLive` and `useBridgeConnections` and returns the model or `null`.
- [x] 3.2 Feed the banner on the index and the chip on the rail — never both, so an open section states the consequence once. See design.md D5.
- [x] 3.3 Give `SettingsSectionRail` an `attention` prop rather than letting it derive its own, so both surfaces are the same model by construction.
- [x] 3.4 Make each surface a polite live region (`role="status"` + `aria-live="polite"`): it appears seconds after its page and again on later polls, so silence means a reader is never told. Keep "absent renders nothing" — no parked empty region. See design.md D5b.
- [x] 3.5 Give each truncated line its own `title`, the chip's `signedOut` line worst affected.

## 4. Connections row value

- [x] 4.1 Add `use-connections-value.ts` counting `discovered`, and register `connections` as a `SettingsValueKey` resolved by `useSettingsRowValues` like every other row.
- [x] 4.2 Count detected bridges, not live sessions: `tanita-bridge` has no prober, so a session count would sit at 4 of 5 forever. See design.md D2.
- [x] 4.3 Pass `null` as the profile id — the count reads `discovered` only, so the per-profile sync-timestamp query is skipped.
- [x] 4.4 Render no value at all when no bridge is known, rather than "0 of 0".
- [x] 4.5 Say "detected", not "installed": a page cannot enumerate installed extensions, and `discovered` never decrements within a page-life. See design.md D2.
- [x] 4.6 Render no value until the store has completed a pass. Establish that `connections.length === 0` guards a state production never reaches — `createSnapshotReader` synthesises a row per known bridge from the first render — so the reachable bad state is "0 of 5" on every cold load. See design.md D2b.
- [x] 4.7 Expose `hasRefreshed()` on the store and `useBridgeConnectionsRefreshed()` on the hook; do NOT use `lastCheckedAt !== null` as a proxy, which tanita leaves null forever.
- [x] 4.8 Notify subscribers once when the first pass completes: that pass changes no row in a browser with no extensions, so nothing would otherwise wake a consumer.

## 4b. Outdated extensions

- [x] 4b.1 Add `outdated` to `SessionProbeResult` and `BridgeConnectionRuntime` (and its change signature), with an `outdatedExtension()` constructor; `probeByPing` uses it for a protocol mismatch.
- [x] 4b.2 Rank the outdated cause above the date and report it as "an extension is out of date", not "the last check failed" — the probe succeeded. See design.md D3b.
- [x] 4b.3 Reject rendering `entry.error` directly (untranslated, names the bridge) and message-string matching (couples copy across two repos).

## 5. i18n

- [x] 5.1 Add `values.connections.detected`, `attention.title_one`, `attention.title_other`, `attention.noNewDataSince`, `attention.signedOut`, `attention.extensionOutdated` and `attention.lastCheckFailed` to `en` and `es`; `resource-parity.test.ts` green.
- [x] 5.2 Select the plural key explicitly (`count === 1 ? "_one" : "_other"`) — the SPA's `Translate` interpolates but does not pluralise, matching `LibraryHeader` and `StatsContent`.
- [x] 5.3 Interpolate no bridge name into any attention string.

## 6. Tests

- [x] 6.1 `connection-attention.test.ts`: the probe-less installed bridge is not flagged, a failed probe and a re-authorisation are, singular/plural titles, each consequence branch, an unparseable timestamp, and no action.
- [x] 6.1a Test the realistic combination the ranking exists for — `needsReauth` AND a `lastSyncAt` on one bridge — plus the outdated cause with a `lastSyncAt`. Build every fixture timestamp from a LOCAL noon so the asserted calendar day holds in any runner timezone.
- [x] 6.2 `use-connections-value.test.tsx`: the count, the reachable denominator (5 of 5 with Tanita detected), no value before the first pass completes, and no value when nothing is known.
- [x] 6.3 `use-settings-attention.test.tsx`: null while healthy, the model from a failed connection, and the active profile threaded into the read.
- [x] 6.4 `SettingsPage.test.tsx`: banner on the index, chip inside a section, neither while healthy, the detected count on the Connections row, and a bare row on a cold load.
- [x] 6.5 `SettingsAttention.test.tsx`: both variants are polite live regions, and a truncated line carries its full text.
- [x] 6.6 `bridge-connection-store.test.ts`: `hasRefreshed()` before and after a pass, and the first-pass notification when no row changed.
- [x] 6.7 `use-bridge-connections.test.tsx`: `useBridgeConnectionsRefreshed()` reflects the store and subscribes to it.

## 6b. Integration with the merged programme

- [x] 6b.1 Take main's bootstrap mount wholesale — Wave 1 shipped the identical change — after verifying it mounts the hook and asserts `true`.
- [x] 6b.2 Replace this change's own attention predicate with `status === "attention"` over `useConnectionSources`, so the banner and the cards cannot disagree. See design.md D0.
- [x] 6b.3 Accept the two divergences that resolves: a reachable probed source with no session IS attention, and the fallback line is "Session signed out", not "The last check failed" (key deleted).
- [x] 6b.4 Carry `outdated` through `BridgeSessionSignal` → `ConnectionSource` → the card, mirroring `needsReauth`, rather than keeping a Settings-only field.
- [x] 6b.5 Give `outdatedExtension()` `reachable: true`: the extension answered, and reporting it as gone would offer the wrong fix.
- [x] 6b.6 Keep main's `Link`-based rail entries (anchors with `href`, pinned by test) and this change's chip; keep main's `/settings/connections` destination and this change's `valueKey`.
- [x] 6b.7 Fix every fixture constructing a probe result, a session signal or a `ConnectionSource` BY HAND: `tsconfig.app.json` excludes `*.test.ts(x)`, so a missing required field is silently `undefined` rather than a type error.
- [x] 6b.8 Re-check the cold-load claim now that a second consumer reads `hasRefreshed()`, and re-check that `broken()` fixtures set `lastCheckedAt` — a probed bridge with none reads as checking, not attention, which would have made the page tests assert nothing.

## 7. Quality gates

- [x] 7.1 `pnpm -r build` clean.
- [x] 7.2 Full SPA suite green (860 files, 6110 tests).
- [x] 7.3 `pnpm --filter @kaiord/workout-spa-editor lint` clean (`tsc -b --noEmit` + ESLint + Prettier).
- [x] 7.4 `pnpm test:scripts` and root `pnpm lint` green, `pnpm lint:specs` included.
- [x] 7.5 `npx playwright test --list` parses the whole e2e tree.
- [x] 7.6 `bridge-store-persistence-boundary.test.ts`'s file list untouched — no bridge runtime module was added, renamed or split.
- [x] 7.7 `openspec validate add-settings-attention-model` valid, including the `RENAMED` block that retires the "until something computes attention" title this change falsifies.
