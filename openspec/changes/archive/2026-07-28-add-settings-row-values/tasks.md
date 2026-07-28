## 1. Value engine

- [x] 1.1 Extract the row/group types to `components/pages/SettingsPage/settings-group-types.ts`, replacing `detailKey?: "defaultProvider"` with `valueKey?: SettingsValueKey` (closed union of `provider`, `sync`, `privacy`, `usage`, `units`, `language`, `notifications`) and adding `href?` for external destinations.
- [x] 1.2 Add `use-settings-row-values.ts`: returns `Record<SettingsValueKey, string | undefined>`; inlines `provider` (default from `useAiProvidersLive()`, preserving today's behaviour) and `privacy`, composes the three family hooks.
- [x] 1.3 Add `use-sync-value.ts`: `useSync()` → not connected / connected-not-synced / `values.sync.connected` with `formatRelativeTime` (the existing helper, shared with `CoachingSyncButton`).
- [x] 1.4 Add `use-preference-values.ts`: mirrors `PreferencesTab` — `useActiveProfileLive` + `useUserPreferences({ profileId, defaultView: "grid" })` with the `profileId === null` fallback, `auto` locale resolved via `useActiveLocale`, notifications folded with `useNotificationPermission`.
- [x] 1.5 Add `use-usage-value.ts`: current month only, compact token notation + month name.
- [x] 1.6 Delete `useRowDetail()` from `SettingsGroupList.tsx`; the list indexes `useSettingsRowValues()` by `row.valueKey`.

## 2. Shared usage read

- [x] 2.1 Add `hooks/use-usage-summary.ts` with `recentYearMonths(count, now)` and `useUsageSummary(monthsWindow)` returning `{ months, events }`.
- [x] 2.2 Rewrite `UsageTab.tsx` to consume it, dropping its inline `useLiveQuery` and its private `recentYearMonths` — the tab and the index row now share one implementation.
- [x] 2.3 Write `hooks/use-usage-summary.test.ts`: current month first, year-boundary walk-back, zero-padded months.

## 3. Row presentation

- [x] 3.1 Add `status?: "attention"` to `SettingsRow`, rendering an amber dot between the value and the chevron, addressable as `settings-row-<key>-attention`. Nothing sets it in this change.
- [x] 3.2 Add the `href` branch to `SettingsRow` (`<a target="_blank" rel="noopener noreferrer">`), same body/chevron/testid as an in-app row.
- [x] 3.3 Add `help: HelpCircle` to `ICON_MAP` for the About row.
- [x] 3.4 Write `SettingsRow.test.tsx`: attention dot present when passed and absent by default; the external row is an anchor with `target`/`rel`.

## 4. Re-grouping

- [x] 4.1 Rewrite `settings-groups.ts` into four groups — Your data (Connections, Cross-device sync, Privacy & data, Manage your data, Extensions, Data Hub), AI (Provider & models, Custom instructions, Usage), Preferences (Units, Language, Notifications), About (Help & docs).
- [x] 4.2 Point the Connections row at `/athlete` with a comment naming Wave 1 as the wave that re-points it at `/settings/connections`.
- [x] 4.3 Keep Extensions and Data Hub reachable as legacy rows: routes, `settings-row-extensions` / `settings-row-dataHub` testids and `tabs.*` entries untouched.

## 5. Honest copy

- [x] 5.1 Read `EncryptionSection.tsx`, `use-encryption-section.ts`, `PrivacyInformationSection.tsx` and `PrivacyTab.tsx` and establish what is actually encrypted: sync snapshots before upload (opt-in, passphrase in memory only); local Dexie not encrypted; AI keys under `kaiord_secure_*`.
- [x] 5.2 Ship `values.privacy.localFirst` = "Stored in this browser" instead of the design's "Encrypted on device"; do not ship the "AES-GCM on every stored record" section copy.
- [x] 5.3 Narrow `sync.encryption` from "End-to-end encryption" to "End-to-end encryption for sync snapshots" in both locales. `sync.plaintextWarning` and the `privacy.info*` bullets audited and left as-is — they describe upload and credential handling, not storage at rest.
- [x] 5.4 Record the decision in `design.md` D6: the design's at-rest encryption claim was not implementable as written and shipping it would have been a false security claim.

## 6. i18n

- [x] 6.1 Replace `settings.groups.*` with `yourData`, `ai`, `preferences`, `about` in `en` and `es`; the five retired keys grepped first to confirm `SettingsGroupList` was their only consumer.
- [x] 6.2 Add `settings.rows.connections` and `settings.rows.helpDocs`; re-word `rows.provider`, `rows.googleDriveSync` and `rows.dataPrivacy`.
- [x] 6.3 Add the `settings.values.*` sub-tree (`sync.connected`, `usage.tokens`, `notifications.{on,off,blocked,unsupported}`, `privacy.localFirst`) to both locales; `resource-parity.test.ts` green.

## 7. Tests

- [x] 7.1 Update `SettingsPage.test.tsx`: the eyebrow assertion now names the four groups; the row→destination `it.each` covers the new grouping and keeps the extensions case alive, adding connections, googleDriveSync, dataHub and usage.
- [x] 7.2 Add index assertions for the privacy value and the external docs link.
- [x] 7.3 Write `use-preference-values.test.tsx` (persisted units/locale, `auto` resolution, the no-profile fallback, the four notification states), `use-sync-value.test.tsx` (three branches) and `use-usage-value.test.tsx` (formatting, loading, empty month).
- [x] 7.4 Confirm the untouched suites still pass — the `?section=` deep-link focus tests and the `settings-panel-<tab>` testid contract in particular.

## 8. Quality gates

- [x] 8.1 Full SPA suite green, `resource-parity.test.ts` included.
- [x] 8.2 `tsc -p tsconfig.app.json --noEmit` clean; ESLint clean; Prettier clean on every touched file; `pnpm test:scripts` unchanged-green.
- [x] 8.3 e2e neutrality verified by grep: `settings-row-provider` (`e2e/settings.spec.ts`, `e2e/ai-generate-workout.spec.ts`), `settings-row-extensions` + `settings-panel-extensions` (`e2e/settings.spec.ts`), `settings-row-dataHub` (`e2e/data-hub.spec.ts`), `/settings/extensions` (`e2e/tanita-garmin-sync-via-policy.spec.ts`), `/settings/data-hub` (`e2e/data-flows-density.spec.ts`) — all preserved.
- [x] 8.4 `npx openspec validate add-settings-row-values` passes. No changeset — `@kaiord/workout-spa-editor` is private and excluded from the changeset-bot PUBLISHABLE set.
