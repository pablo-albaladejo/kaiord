> Completed: 2026-07-28

## Why

The SPA's Settings index is a list of eleven labels that answer nothing. To find
out which AI provider is default, when the last cross-device sync ran, whether
notifications are on, or how many tokens this month cost, the user must open the
row, read the panel, and navigate back — once per question. Only one row carries
a value today (`defaultProvider`), through a `useRowDetail()` hook hard-wired to
that single key.

The grouping compounds it. Six eyebrows ("AI generation", "Cross-device sync",
"Data routing", "Preferences", "Privacy & data", "Advanced") split eleven rows so
finely that four groups hold one or two rows each, and the names describe the
implementation ("Data routing", "Advanced") rather than what the user came for.

## What Changes

- Generalise the one-key `useRowDetail()` into a **value engine**: rows declare a
  `valueKey`, and `useSettingsRowValues()` resolves every key to a display
  string. Seven keys ship: `provider`, `sync`, `privacy`, `usage`, `units`,
  `language`, `notifications`.
- Extract the Usage tab's inline `usageEvents` query into
  `hooks/use-usage-summary.ts`, so the tab and the index row fold **one**
  implementation. The tab keeps its six-month window; the row asks for one month.
- Preferences values mirror `PreferencesTab` exactly, including its fallback to
  the defaults when no profile is active, so the index and the tab cannot
  disagree.
- Re-group the index into the design's **four** groups: Your data / AI /
  Preferences / About. Extensions and Data Hub are demoted into "Your data" as
  legacy rows — their routes, testids and `tabs.*` labels are untouched.
- Add an optional `status?: "attention"` prop to `SettingsRow` (amber dot before
  the chevron) and an optional `href` for external destinations. Nothing sets
  `status` in this change; it is the seam a later wave wires to a real attention
  model.
- **Correct a false security claim.** The design reference labels the privacy row
  "Encrypted on device" and its section copy claims "AES-GCM on every stored
  record". Neither is true: `EncryptionSection` encrypts _sync snapshots before
  upload to Drive_, local Dexie is not encrypted at all. The row ships "Stored in
  this browser" instead, and the sync toggle's own label is narrowed from
  "End-to-end encryption" to "End-to-end encryption for sync snapshots".

Out of scope: the desktop split layout, any attention/health state behind the new
`status` prop, the Connections page itself (this change points the Connections
row at `/athlete` until that page exists), the Connections/Extensions/Data Hub
page internals, and the Help dialog.

## Capabilities

### New Capabilities

- `spa-settings-shell`: the Settings index answers itself — a declarative row
  registry whose entries name a live value key, a hook per value family that
  resolves those keys from the surface that owns each source, and four
  user-shaped groups.

### Modified Capabilities

<!-- None. No existing capability spec covered the Settings index. -->

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application, port or adapter contract changes; no dependency added.
- **New files**: `components/pages/SettingsPage/settings-group-types.ts`,
  `use-settings-row-values.ts`, `use-preference-values.ts`, `use-sync-value.ts`,
  `use-usage-value.ts`, `hooks/use-usage-summary.ts`, plus five test modules.
- **i18n**: `settings.groups.*` replaced (`yourData`, `ai`, `preferences`,
  `about`); `settings.rows.{connections,helpDocs}` added; `settings.values.*`
  added; `settings.rows.{provider,googleDriveSync,dataPrivacy}` and
  `settings.sync.encryption` re-worded. `en` and `es` both, so
  `resource-parity.test.ts` stays green.
- **e2e**: no testid changes. `settings-row-{provider,extensions,dataHub}` and
  `settings-panel-{extensions,usage,…}` all keep their identity and their routes.
- **No** schema/version bump, no public-API impact, no changeset (the SPA is
  private and excluded from the changeset-bot PUBLISHABLE set).
