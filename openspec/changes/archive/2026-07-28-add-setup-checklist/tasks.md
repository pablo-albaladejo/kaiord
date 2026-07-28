## 1. Persistence

- [x] 1.1 Add the optional, unindexed `setupChecklistDismissed` boolean to `userPreferencesSchema` in `types/user-preferences.ts`, documenting that absence reads as "not dismissed" and that no Dexie version bump is needed.
- [x] 1.2 Add `setupChecklistDismissed` to `UserPreferenceFieldsPatch` and to the explicit merge in `application/set-user-preference-fields.ts`, so a partial patch preserves it like every other optional field.

## 2. Pure model

- [x] 2.1 Create `lib/setup-checklist.ts`: `SetupChecklistItemId`, `SetupChecklistItem` (`id`, `titleKey`, `hintKey`, `done`, `href`), `SetupChecklistSignals`, and `buildSetupChecklistItems`.
- [x] 2.2 Implement `hasAnyThreshold(profile)` over `sportZones.<sport>.thresholds` (`ftp` / `lthr` / `thresholdPace`), with the default-zone trap recorded in the module docblock.

## 3. Live state

- [x] 3.1 Create `hooks/use-setup-checklist-facts.ts`: ONE `useLiveQuery` returning `{ workoutCount, connectedCount, pushCount, dismissed }` from the `workouts`, `connections`, `exportLedger` and `userPreferences` tables; `dismissed: true` as the unresolved / no-profile value.
- [x] 3.2 Read the push signal through `createDexieExportLedgerRepository(db).countByDataType("workout")` rather than re-implementing the query.
- [x] 3.3 Create `hooks/use-setup-checklist.ts` composing the aggregate with `useActiveProfileLive` and `useDiscoveredBridges`, returning `{ items, doneCount, total, complete, dismissed, dismiss }`; `dismiss` writes through `useSetUserPreferenceFields`.
- [x] 3.4 Do NOT mount `useBridgeConnectionsBootstrap` or start any polling.

## 4. UI

- [x] 4.1 Create `components/molecules/SetupChecklist/SetupChecklistProgress.tsx` — a progress rail exposing `aria-valuenow`/`aria-valuemax` as item counts.
- [x] 4.2 Create `components/molecules/SetupChecklist/SetupChecklistRow.tsx` — done rows inert and struck through, the next action a link showing its hint and a `›` affordance; the href comes from the item model, which attaches `?from=daily` only to the editor target that actually parses it.
- [x] 4.3 Create `components/molecules/SetupChecklist/SetupChecklist.tsx` — card with title, "N of 4 done", progress, the four rows and a dismiss `✕`; returns `null` when dismissed or complete.
- [x] 4.4 Mount `<SetupChecklist />` on `/daily`, directly under `DailyHeader`.

## 5. i18n

- [x] 5.1 Add the `setup` namespace to `locales/en` and `locales/es` with identical key trees (`checklist.*` and `items.<id>.{title,hint}`); `resource-parity.test.ts` stays green.

## 6. Tests

- [x] 6.1 `hooks/use-setup-checklist.test.tsx`: per-item done-detection, the default-zones trap (a fresh profile with populated default zones does NOT tick item 2), the non-power threshold path, profile scoping of the workout count, connected vs disconnected records, a discovered bridge ticking the source item on its own (discovery hook mocked; connections table asserted empty), a post-mount write ticking its item live (the D3 aggregate re-fire), dismissal persistence and re-read, the no-profile gate, and `complete`.
- [x] 6.2 `components/molecules/SetupChecklist/SetupChecklist.test.tsx`: title and caption, progress-bar item counts, all four rows, next-action highlight and its hint, the next-action href, done rows not being links, dismiss calling through, and the two hidden states.

## 7. Quality gates

- [x] 7.1 Full SPA suite green.
- [x] 7.2 `tsc -p tsconfig.app.json --noEmit` clean; ESLint clean; Prettier clean on every touched file; `pnpm test:scripts` unchanged-green.
- [x] 7.3 `npx openspec validate add-setup-checklist` passes. No changeset — `@kaiord/workout-spa-editor` is private and excluded from the changeset-bot PUBLISHABLE set.
