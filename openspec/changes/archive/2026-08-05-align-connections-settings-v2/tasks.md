# Tasks · Align Connections and Settings with the V2 screens

## 1. The attention icon

- [x] 1.1 Add `atoms/AttentionMark` (lucide `TriangleAlert`, `--text` by inheritance, `aria-hidden`, forwards `data-testid`). Not an `ICON_MAP` key: the map sits one code line under its 80-line cap, and three other waves are editing it.
- [x] 1.2 `ConnectionsBanner`: drop the amber shell and the dot; render `bg-surface-elevated` + `border-edge` at `rounded-2xl`, with the icon inked `text-ink-strong` and the detail on `text-ink-muted`. Keep `role="status"`, `aria-live` and all three test ids.
- [x] 1.3 `SettingsAttention`: same treatment on `SHELL_CLASS`; the dot becomes the icon.
- [x] 1.4 `SettingsRowBody`: `DOT_CLASS` deleted; the `status === "attention"` branch renders the icon and keeps its `sr-only` label and `data-testid`.
- [x] 1.5 `ConnectionStatusLine`: render the icon for `attention`, the neutral dot for every other status.
- [x] 1.6 Cover the atom with a test: both sizes, decorative by default, attribute pass-through.

## 2. Attention is elevation, not a ring

- [x] 2.1 `ConnectionSourceCard`: replace `ATTENTION_RING` with an elevated surface; a settled card keeps `bg-surface` and moves to `border-edge-soft`, matching the V2 card.
- [x] 2.2 `DataTypeRoutingRow`: replace `STALLED_RING` the same way.
- [x] 2.3 Update both explanatory comments — they justify a ring over a border tint, and neither is true once the ring is gone.

## 3. The connected state goes quiet

- [x] 3.1 `ConnectionBridgeLine`: emerald tone and dot → `bg-surface-elevated` + `border-edge-soft` + `text-ink-body`, dot on `bg-ink-muted`.
- [x] 3.2 `connection-card-copy.ts`: `STATUS_DOT` and `STATUS_TEXT` lose emerald and amber; every status resolves to a neutral role.
- [x] 3.3 `ConnectionSummaryTile`: delete the `tone` prop's `good` / `warn` colours; verify no caller depended on the distinction.
- [x] 3.4 `connection-summary-tiles.ts`: drop the tone assignments the tile no longer distinguishes.

## 4. Settings onto the role dialect (#1121)

- [x] 4.1 `pages/SettingsPage/*` — 6 files: `SettingsPage`, `SettingsGroupList`, `SettingsRow`, `SettingsRowBody`, `SettingsSectionRail`, `SettingsAttention`.
- [x] 4.2 `organisms/SettingsPanel/*` — 16 files: `AiTab`, `EncryptionSection`, `ModelPicker`, `ModelRow`, `ModelsSection`, `NotificationsRow`, `PrivacyInformationSection`, `PrivacyTab`, `ProviderForm`, `ProviderList`, `ProviderRow`, `SyncStatusLine`, `SyncTab`, `UsageEmptyState`, `UsageMonthRow`, `UsageTable`.
- [x] 4.3 Mapping held constant across all 22 files: `text-gray-900`/`dark:text-white`/`dark:text-gray-100` → `text-ink-strong`; `text-gray-700`/`600` + `dark:text-gray-300` → `text-ink-body`; `text-gray-500`/`400` → `text-ink-muted`; `border-gray-200`/`300` → `border-edge`; `border-gray-50`/`100` → `border-edge-soft`; `bg-white dark:bg-slate-900` → `bg-surface`; `hover:bg-gray-50 dark:hover:bg-slate-800` → `hover:bg-surface-elevated`; `dark:bg-gray-700` on inputs → `bg-surface`.
- [x] 4.4 `EncryptionSection` and `NotificationsRow` lose their amber boxes for `bg-surface-elevated` + `text-ink-body`.
- [x] 4.5 Confirm `packages/workout-spa-editor/src/components/{pages/SettingsPage,organisms/SettingsPanel}` greps clean for `(bg|text|border|divide|ring)-(slate|gray)-\d`.

## 5. Radii and weights

- [x] 5.1 Settings group card `rounded-xl` → `rounded-2xl`, with `SettingsRow`'s `first:`/`last:` corners moved in the same commit so the card and its rows cannot disagree.
- [x] 5.2 `SettingsAttention` shell `rounded-xl` → `rounded-2xl`.
- [x] 5.3 `font-bold` / `font-extrabold` → `font-semibold` in every file this change touches. No other file.

## 6. The danger role

- [x] 6.1 `ConnectionManagePanel` and `ConnectionBodyExport`: `text-red-600 dark:text-red-400` → `text-[var(--danger-text)]`.

## 7. Copy, `en` + `es`

- [x] 7.1 `connections.json`: `intro` and `sourcesHint`.
- [x] 7.2 `settings.json`: `privacy.infoNoServer` states plainly that local records are unencrypted and names what leaves the browser.
- [x] 7.3 Verify no key is added or removed, so `resource-parity.test.ts` needs no change.
- [x] 7.4 Leave `summary.detected` / `summary.covered` alone. V2's "Active sources" and "Data flowing" were both weighed and rejected by `add-connections-health-summary`: the counter counts detected extensions, not live sessions, and coverage counts having a source rather than data in flight. Adopting the screen's wording reintroduces the overclaim that change removed.
- [x] 7.5 Leave `manage.receives` ("Kaiord sends back") rather than taking V2's "pushes back": the Editor wave is cutting the push/send verb set to Send · Keep · Download, and this label should follow that outcome, not pre-empt it.
- [x] 7.6 Leave `routing.freshnessHint` alone. V2's subtitle states principle 7, but the repo string carries a caveat the design did not have — the times are per source, not per type — and this change adds no keys.

## 8. Verification

- [x] 8.1 `pnpm -r build`.
- [x] 8.2 `pnpm --filter @kaiord/workout-spa-editor test`.
- [x] 8.3 `pnpm test:scripts` — `check-theme-dialect` and the guard suite.
- [x] 8.4 `pnpm lint` (max-warnings=0) and `tsc -b`.
- [x] 8.5 `pnpm lint:specs`.
- [x] 8.6 Both themes: verified by construction rather than by eye — every utility this change introduces is a role that resolves through `:root` / `.dark`, and `check-theme-dialect.mjs` (R-ThemeDarkOnly, R-ThemeBareBorder) passes over both directories, which is the guard that pins the light-mode regression. A human pass on `/settings` and `/settings/connections` in both themes is still worth doing at review time.
