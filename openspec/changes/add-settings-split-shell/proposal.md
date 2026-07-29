## Why

Settings answers itself row by row (shipped in `add-settings-row-values`) but it
still reads as a phone screen bolted onto a desktop app. Opening a section
replaces the whole page: the list of the other twelve settings disappears, so
comparing two settings or moving between them costs a round trip through the
index every time. On a 1440 px display the panel occupies a third of the width
and the other two thirds are empty.

The reference design answers this with a split: the section list stays on screen
as a rail, the open section renders beside it, and the phone keeps the drill-in
it already has. It also introduces an attention surface — a chip on the rail and
a banner above the content — which is where a broken connection announces itself
once a connection health model exists.

The design's rail is also pinned while the pane scrolls. That part does not ship
here; design.md D9 records the measured reason.

## What Changes

- **One URL family, two layouts.** `/settings` is the index; `/settings/<section>`
  opens that section. Below the `md` breakpoint the section replaces the index
  exactly as today. At `md` and up the same markup lays out as a section rail
  plus a content pane. The layout switch is **CSS only** — no viewport is
  measured in JavaScript, so a narrow browser and a jsdom render agree by
  construction, and the router keeps a single route for both.
- **The rail lists sections, not index rows.** Three index rows lead to
  `preferences` and two to `ai`, so a row-shaped rail would mark several entries
  current for one open section and would echo the panel's own headings word for
  word. Entries are the sections, named with the `settings.tabs.*` labels the
  page heading already uses, addressed as `settings-section-<id>`.
  `SettingsGroupList` and `SettingsRow` are untouched by this change.
- **Exactly one entry is marked** with `aria-current="page"` and a tint, which
  one-entry-per-section makes structural rather than a rule to be enforced.
- **Only the rendered surface reads its values.** The rail does not mount
  `useSettingsRowValues()`, so opening a section no longer duplicates the
  panel's own live queries — including the AES-GCM decrypt of every stored API
  key — to compute strings nothing renders.
- **One `[data-route-heading]` at a time.** The heading stays above the split
  and keeps its existing text (`Settings` / `Settings · <Section>`), so the
  route announcer and the focus-on-route-change contract are untouched by the
  new layout.
- **Scrolling resets when the section changes**, so a section is never entered
  already scrolled to the previous one's offset. The first render is skipped so
  a `?section=` deep link's own scroll is not fought.
- **Attention slots exist and render nothing.** `SettingsAttention` takes an
  attention model or `null` and renders `null` for `null`; the shell passes
  `null` at both slots. Nothing computes attention in this change — the seam is
  the deliverable, in the same spirit as the `status` prop added in
  `add-settings-row-values`.
- **The back control becomes mobile-only** (`md:hidden`): on desktop the rail
  is the way back, and the design shows no back affordance there.
- `/settings/data-hub` and `/settings/extensions` keep resolving to their own
  panels, unchanged, and are pinned by a test. They are retired in Wave 4, not
  here.

Out of scope: the Connections page itself, any real attention/health state
behind the slots, redesigning the content of any re-homed section, retiring the
Data Hub or Extensions sections, and the mobile bottom-tab/header work.

## Capabilities

### New Capabilities

- `spa-settings-shell`: the Settings shell — one URL family whose section
  segment selects a panel, a CSS-only index/split layout, a section rail derived
  from the same registry as the index, a single route heading, scroll reset on
  section change, and presentational attention slots with no producer.

### Modified Capabilities

<!--
None. `spa-settings-shell` was introduced as a change delta by
`add-settings-row-values` but never synced into `openspec/specs/`, so there is
no published capability spec to modify — this change adds to the same
capability. Flagged in design.md D7.
-->

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application, port or adapter change; no dependency added.
- **Routing**: `AppRoutes.tsx` renames the settings route parameter `:tab?` →
  `:section?`. The URL shape is byte-identical; only the parameter's name
  changes.
- **New files**: `SettingsSectionRail.tsx`, `SettingsAttention.tsx` and
  `use-section-scroll-reset.ts` under `components/pages/SettingsPage/`, plus two
  test modules. `SettingsGroupList.tsx` and `SettingsRow.tsx` are unchanged.
- **i18n**: one key added, `settings.sectionsNav`, in `en` and `es`
  (`resource-parity.test.ts` covers it). No key removed or re-worded.
- **e2e**: no test id and no URL changes. `settings-row-<key>` and
  `settings-panel-<id>` keep their identity; `settings-row-*` now renders only
  on the index, which is where all six specs click them, so nothing the rail
  renders can collide under Playwright's strict mode.
- **No** schema/version bump, no public-API impact, no changeset (the SPA is
  private and excluded from the changeset-bot PUBLISHABLE set).
