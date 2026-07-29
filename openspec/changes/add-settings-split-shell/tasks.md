## 1. Routing

- [x] 1.1 Rename the settings route parameter in `AppRoutes.tsx` from `:tab?` to `:section?`, with a comment naming the one URL family and the two sections Wave 4 retires.
- [x] 1.2 Read `section` in `SettingsPage.tsx` and document, at the params type, that it is distinct from the `?section=` sub-section query.
- [x] 1.3 Keep the unknown-section redirect to `/settings` and the `/settings/profile` → `/athlete` redirect untouched.

## 2. Split layout

- [x] 2.1 Wrap the rail and the pane in a container that is `md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start md:gap-6` only when a section is open; the bare index keeps its full-width flow.
- [x] 2.2 Add `SettingsSectionRail.tsx`: a `<nav>` labelled `settings.sectionsNav`, `hidden md:block`, holding the chip slot and one entry per section.
- [x] 2.3 Establish, by measurement in Chromium, that `position: sticky` cannot pin the rail while `MainLayout`'s `<main>` carries `overflow-x-hidden`; ship the rail unpinned and record the finding rather than dead CSS. See design.md D9.
- [x] 2.4 Make the back control `md:hidden` — the rail is the way back on desktop.

## 3. Rail vs index

- [x] 3.1 Establish that index rows are not sections (3 rows → `preferences`, 2 → `ai`, 2 → `privacy`), so a row-shaped rail cannot mark exactly one entry current and repeats `PreferencesTab`/`LanguageRow`'s own headings verbatim. See design.md D2.
- [x] 3.2 Build the rail from `SETTINGS_TAB_ORDER` instead: one entry per section, labelled `settings.tabs.*` (the same names the `h1` uses, so no new copy), addressed `settings-section-<id>`, with `aria-current="page"` + the `FormatOption` selected tint on the open one.
- [x] 3.3 Leave `SettingsGroupList.tsx` and `SettingsRow.tsx` untouched — the rail is a separate component, so `settings-row-*` renders only on the index and no `variant`/`active` plumbing is needed.
- [x] 3.4 Confirm no `settings.tabs.*` label equals a heading rendered by any panel (`AiTab`, `SyncTab`, `ExtensionsTab`, `DataHubTab`, `UsageTable`, `PrivacyTab`, `PreferencesTab`, `LanguageRow`, `TanitaGarminSyncCard`).
- [x] 3.5 Consequence: the rail drops `Connections`, `Manage your data` and `Help & docs` (index rows with no settings section behind them). Wave 1 makes Connections a section and it returns.

## 4. Attention seam

- [x] 4.1 Add `SettingsAttention.tsx` with `SettingsAttentionModel` and `variant: "banner" | "chip"`; `null` attention renders `null`; the chip drops the action.
- [x] 4.2 Mount the banner under the heading and the chip at the top of the rail, both fed `null`.
- [x] 4.3 Add no attention copy to the locale catalogs — the strings ship with the model that produces them.

## 5. Scroll reset

- [x] 5.1 Add `use-section-scroll-reset.ts`: reset on section change, skip the first render so a `?section=` deep link's own scroll is not fought.
- [x] 5.2 Write to `document.scrollingElement ?? document.documentElement` rather than `window.scrollTo()`, which jsdom does not implement and logs about.
- [x] 5.3 Measure the jsdom surface rather than assume it: `"scrollingElement" in document` is **false** and `documentElement.scrollTop` **does** read back what is written. Assert on the real element so the test exercises the fallback branch that actually runs, instead of a stub that hides it.

## 6. i18n

- [x] 6.1 Add `settings.sectionsNav` to `en` ("Settings sections") and `es` ("Secciones de ajustes"); `resource-parity.test.ts` green.

## 7. Tests

- [x] 7.1 Point `SettingsPage.test.tsx`'s route at `/settings/:section?`.
- [x] 7.2 Assert the index renders without the rail at `/settings`, and that a section replaces the index with the rail plus the panel.
- [x] 7.3 Assert exactly one `aria-current="page"` in the shell across four sections — **including `/settings/preferences`**, the three-row case an earlier `/settings/sync`-only test could not have caught — plus one rail entry per section, no `settings-row-*` in the rail, and lateral rail navigation.
- [x] 7.4 Assert exactly one `[data-route-heading]` at `/settings` and at `/settings/extensions`.
- [x] 7.5 Assert neither attention slot renders while nothing computes attention.
- [x] 7.6 Pin `/settings/data-hub` and `/settings/extensions` resolving to their own panels with no redirect.
- [x] 7.7 Write `SettingsAttention.test.tsx` (null renders nothing per variant, title/detail render, banner action fires, chip omits the action) and `use-section-scroll-reset.test.tsx` (first render skipped, change resets, close-to-index resets, unchanged section left alone).

## 9. Documentation truth

- [x] 9.1 `navigation-map.md`: correct the "all 12 routes present and correctly attributed" verification claim — `AppRoutes.tsx` declares **16** — and add the four missing routes (`/daily`, `/today`, `/nutrition`, `/chat/:conversationId?`) to the route table. Re-affirming a false claim while editing that very line is worse than leaving it stale.
- [x] 9.2 `navigation-map.md`: make the Settings block internally consistent — one spelling of the grid template, refreshed outgoing-nav row, rail rather than row list.
- [x] 9.3 `navigation-blocker-designs.md`: update the `<Route path="/settings/:tab?">` assertion at line 609.

## 8. Quality gates

- [x] 8.1 `pnpm -r build` clean.
- [x] 8.2 Full SPA suite green, `resource-parity.test.ts` included.
- [x] 8.3 `pnpm --filter @kaiord/workout-spa-editor lint` clean (`tsc -b --noEmit` + ESLint at `--max-warnings=0` + Prettier).
- [x] 8.4 `pnpm test:scripts` and `pnpm lint` at the root green, `pnpm lint:specs` included.
- [x] 8.5 e2e neutrality re-verified by reading every spec that touches `/settings`: `settings.spec.ts`, `ai-generate-workout.spec.ts`, `data-hub.spec.ts`, `data-flows-density.spec.ts`, `tanita-garmin-sync-via-policy.spec.ts`, `profiles.spec.ts`. All their in-page selectors are test ids or strings the rail does not render.
