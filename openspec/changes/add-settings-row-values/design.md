## Context

`SettingsGroupList` renders `SETTINGS_GROUPS`, a flat registry of
`{ icon, key, to?, detailKey? }` rows. `detailKey` has exactly one legal value,
`"defaultProvider"`, and `useRowDetail()` — eight lines inside the list
component — is the whole live-value engine: it calls `useAiProvidersLive()` and
returns the default provider's label for the one row that asks.

The data every other row would want already exists behind hooks the detail
panels use: `useSync()` (sync context), `useUserPreferences({ profileId })` +
`useNotificationPermission()` (Preferences tab), and, for usage, a `useLiveQuery`
written inline in `UsageTab.tsx` over `createDexieUsageEventRepository(db)`.

The SPA caps files at 80 lines and functions at 60 (ESLint, `skipBlankLines` +
`skipComments`), so "one hook that reads everything" is not available.

## Goals / Non-Goals

**Goals:**

- Every value the index shows is read from the same source its detail panel
  reads, so the two can never disagree.
- Adding a value is declaring a key on a row, not editing the list component.
- The grouping matches the design's four user-shaped groups without deleting any
  reachable route, testid or i18n entry.
- Every string rendered is true.

**Non-Goals:**

- The desktop split layout.
- Any attention/health model behind the new `status` prop.
- Building the Connections page, or touching Extensions / Data Hub internals.
- Localising relative time.

## Decisions

### D1 — `valueKey` names a value, `useSettingsRowValues` owns resolution

`detailKey?: "defaultProvider"` becomes `valueKey?: SettingsValueKey`, a union of
the seven values that ship. `useSettingsRowValues()` returns
`Record<SettingsValueKey, string | undefined>` and `SettingsGroupList` indexes it
— the list component no longer knows what a provider or a sync engine is.

The union (rather than `string`) is what makes the registry safe: a row naming a
value nobody resolves is a compile-time error, and the returned `Record` is
exhaustive by construction, so adding a key to the union without resolving it
also fails to type-check. Both directions are mechanical.

### D2 — One hook per value family, not one hook per value

`useSettingsRowValues` composes `useSyncValue`, `useUsageValue` and
`usePreferenceValues`, and inlines the two cheap ones (`provider` is a `.find()`
over `useAiProvidersLive()`; `privacy` is a single `t()`). The split is by
_source_, not by row: `usePreferenceValues` returns all three preference values
because they come from one `useUserPreferences` read, and splitting them would
mean three identical live queries.

### D3 — `useUsageSummary` moves to `hooks/`, and the tab adopts it

The Usage query is extracted to `hooks/use-usage-summary.ts` returning
`{ months, events }`, parameterised by window size: the tab passes 6, the index
row passes 1. One implementation, two surfaces: the tab's per-month table and
the index row's single-month total fold the same events, so they cannot report
different numbers. `hooks/` is where the SPA's other live reads live
(`use-ai-providers-live`, `use-user-preferences`, `use-active-profile-live`),
which is what makes it the destination — the index row would otherwise have had
to import `adapters/dexie` a second time.

`recentYearMonths` moves with it and takes an injected `now`, so its boundary
behaviour (year rollover, zero-padding) is unit-testable without fake timers.

### D4 — Usage renders nothing rather than "0 tokens"

`useUsageValue` returns `undefined` both while the live query resolves and when
the current month folded to zero tokens. A "0 tokens · July" row is noise on the
overwhelmingly common path (a user who has not run AI this month), and an empty
value slot is already the norm for the rows that carry none. The Usage _tab_
still explains itself with `UsageEmptyState`; the index row just stays quiet.

### D5 — Relative time reuses `formatRelativeTime`, and stays English

`utils/format-relative-time.ts` already exists and is already composed exactly
this way by `coaching-sync-button-tooltip.ts` (`${label} · ${relative}`), so the
sync row reuses it rather than growing a second humaniser. Its return values are
hardcoded English literals ("5m ago", "yesterday"), deliberately — the file's
own contract note ties that to the repo's `R-PIIInterpolation` guard.

The consequence is honest and bounded: under `es`, the sync row reads
"Drive · 5m ago". The Spanish catalog therefore keeps `values.sync.connected` as
`"Drive · {{relative}}"` with no Spanish framing around the fragment, so the
string never reads as broken grammar. Localising `formatRelativeTime` is a
separate change with its own blast radius (`CoachingSyncButton` shares it) and is
not smuggled in here.

Connected-but-never-synced does _not_ go through the humaniser: it returns the
existing `sync.connectedNotSynced` string, because "Drive · never synced" is
worse copy than "Connected — not synced yet" and the key already exists.

### D6 — The privacy row's value is "Stored in this browser"

**The design's at-rest encryption claim was not implementable as written, and
shipping it would have been a false security claim.** The reference renders
"Encrypted on device" on the privacy row and "Passphrase set · AES-GCM on every
stored record" in the section body. What the SPA actually does:

- `EncryptionSection` / `use-encryption-section` encrypt the **sync snapshot
  before upload to Drive**, and only when the user turns the toggle on and
  supplies a passphrase (off by default; the passphrase is memory-only).
- Local Dexie is **not** encrypted. Any record in IndexedDB is readable by
  anything with access to the origin.
- The only local secrets with protection are AI provider keys, under the
  `kaiord_secure_*` localStorage prefix (`PrivacyTab`).

So the row ships `values.privacy.localFirst` = "Stored in this browser", which is
both true and the thing a privacy-minded user actually wants confirmed. Rendering
no value at all was the alternative; a true value beats an empty slot, and it
does not overclaim.

The audit of the neighbouring copy found one string worth narrowing:
`sync.encryption` read "End-to-end encryption" with no object. Sitting beside a
passphrase field it is readable as "everything is encrypted", so it is now
"End-to-end encryption for sync snapshots". `sync.plaintextWarning` and every
`privacy.info*` bullet were checked and are accurate as written — they describe
upload and credential handling, never storage at rest — so they are untouched.

### D7 — Connections points at `/athlete`, and says so in code

`/settings/connections` does not exist; Wave 1 builds it. The row ships pointing
at `/athlete` — the closest real surface for "who am I connected to" — with a
one-line comment at the registry entry naming the wave that re-points it. A
disabled row, or omitting the row until the page lands, would both mean shipping
the new grouping twice.

### D8 — Extensions and Data Hub survive the re-group as legacy rows

The design's "Your data" group has three rows; the shipped one has six.
Extensions and Data Hub are live routes with live e2e coverage
(`settings-row-extensions` in `e2e/settings.spec.ts` 8.8,
`settings-row-dataHub` in `e2e/data-hub.spec.ts`), and "Manage your data" is the
only entry point to the `?section=data-management` deep link. Deleting rows the
design happened not to draw would break working journeys to make a mockup match.
They are demoted, not removed; a later wave can fold them into the Connections
page once it exists.

### D9 — `status` ships unused on purpose

`SettingsRow` gains `status?: "attention"` rendering an amber dot before the
chevron, and nothing passes it. The alternative — landing the prop in the same
change that computes attention — would put a layout change and a new live data
source in one diff. The prop is covered by a component test in both directions
(rendered when passed, absent by default) so it cannot rot before it is wired.

### D10 — External rows are `href`, not a router destination

The About group's only row is an external docs link, and `SettingsRow`'s
contract was "`to` + `onNavigate`". Rather than teach the list component to
sniff `https://`, the row def gains `href` and `SettingsRow` renders an
`<a target="_blank" rel="noopener noreferrer">` branch — same body, same testid,
same chevron. "About" is deliberately one row: this repo has no `APP_VERSION`
constant to display and Help's fate belongs to another wave.

## Risks / Trade-offs

- **Six live reads on the index** → The index now mounts `useAiProvidersLive`,
  `useSync`, `useUserPreferences`, `useActiveProfileLive`, `useUsageSummary` and
  `useNotificationPermission`. All but the last were already mounted somewhere in
  the Settings subtree; the usage read is scoped to a single month over the
  `[yearMonth+purpose]` index, which is the cheapest form of the query the tab
  already ran.
- **Spanish sync row shows an English time fragment** → Accepted and bounded by
  D5; the catalog string is shaped so it degrades to a legible compound rather
  than to broken Spanish.
- **`groups.*` keys replaced, not renamed** → The five retired group keys were
  grepped to confirm `SettingsGroupList` was their only consumer before removal.
  Row keys are all preserved, which is what the e2e testids key off.
- **"Your data" is a six-row group** → Denser than the design. Justified by D8;
  it is the honest cost of not deleting reachable routes.

## Migration Plan

None. No persisted data, no schema version, no public API. Rollback is restoring
`detailKey` on the registry and the previous `groups.*` block in both locales.
