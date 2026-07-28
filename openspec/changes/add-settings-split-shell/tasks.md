## 1. Routing

- [x] 1.1 Rename the settings route parameter in `AppRoutes.tsx` from `:tab?` to `:section?`, with a comment naming the one URL family and the two sections Wave 4 retires.
- [x] 1.2 Read `section` in `SettingsPage.tsx` and document, at the params type, that it is distinct from the `?section=` sub-section query.
- [x] 1.3 Keep the unknown-section redirect to `/settings` and the `/settings/profile` → `/athlete` redirect untouched.

## 2. Split layout

- [x] 2.1 Wrap the rail and the pane in a container that is `md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:items-start md:gap-6` only when a section is open; the bare index keeps its full-width flow.
- [x] 2.2 Add `SettingsSidebar.tsx`: a `<nav>` labelled `settings.sectionsNav`, `hidden md:block` when railed, holding the chip slot and the list.
- [x] 2.3 Establish, by measurement in Chromium, that `position: sticky` cannot pin the rail while `MainLayout`'s `<main>` carries `overflow-x-hidden`; ship the rail unpinned and record the finding rather than dead CSS. See design.md D9.
- [x] 2.4 Make the back control `md:hidden` — the rail is the way back on desktop.

## 3. Rail vs index

- [x] 3.1 Add `variant: "index" | "sidebar"` to `SettingsGroupList`; `"sidebar"` omits row values and the version footer.
- [x] 3.2 Add `activePath` and mark rows whose destination path matches it, stripping any `?section=` deep link before comparing.
- [x] 3.3 Add `active?: boolean` to `SettingsRow`: `aria-current="page"` plus the existing selected tint (`bg-primary-50 dark:bg-primary-900/20`, the `FormatOption` precedent).

## 4. Attention seam

- [x] 4.1 Add `SettingsAttention.tsx` with `SettingsAttentionModel` and `variant: "banner" | "chip"`; `null` attention renders `null`; the chip drops the action.
- [x] 4.2 Mount the banner under the heading and the chip at the top of the rail, both fed `null`.
- [x] 4.3 Add no attention copy to the locale catalogs — the strings ship with the model that produces them.

## 5. Scroll reset

- [x] 5.1 Add `use-section-scroll-reset.ts`: reset on section change, skip the first render so a `?section=` deep link's own scroll is not fought.
- [x] 5.2 Write to `document.scrollingElement ?? document.documentElement` rather than `window.scrollTo()`, which jsdom does not implement and logs about.

## 6. i18n

- [x] 6.1 Add `settings.sectionsNav` to `en` ("Settings sections") and `es` ("Secciones de ajustes"); `resource-parity.test.ts` green.

## 7. Tests

- [x] 7.1 Point `SettingsPage.test.tsx`'s route at `/settings/:section?`.
- [x] 7.2 Assert the index renders without the rail at `/settings`, and the rail renders beside the panel at `/settings/ai`.
- [x] 7.3 Assert the rail drops row values, and that the open section's row carries `aria-current="page"` while a sibling does not.
- [x] 7.4 Assert exactly one `[data-route-heading]` at `/settings` and at `/settings/extensions`.
- [x] 7.5 Assert neither attention slot renders while nothing computes attention.
- [x] 7.6 Pin `/settings/data-hub` and `/settings/extensions` resolving to their own panels with no redirect.
- [x] 7.7 Write `SettingsAttention.test.tsx` (null renders nothing per variant, title/detail render, banner action fires, chip omits the action) and `use-section-scroll-reset.test.tsx` (first render skipped, change resets, close-to-index resets, unchanged section left alone).
- [x] 7.8 Add the `active` cases to `SettingsRow.test.tsx`.

## 8. Quality gates

- [x] 8.1 `pnpm -r build` clean.
- [x] 8.2 Full SPA suite green, `resource-parity.test.ts` included.
- [x] 8.3 `pnpm --filter @kaiord/workout-spa-editor lint` clean (`tsc -b --noEmit` + ESLint at `--max-warnings=0` + Prettier).
- [x] 8.4 `pnpm test:scripts` and `pnpm lint` at the root green, `pnpm lint:specs` included.
- [x] 8.5 e2e neutrality re-verified by reading every spec that touches `/settings`: `settings.spec.ts`, `ai-generate-workout.spec.ts`, `data-hub.spec.ts`, `data-flows-density.spec.ts`, `tanita-garmin-sync-via-policy.spec.ts`, `profiles.spec.ts`. All their in-page selectors are test ids or strings the rail does not render.
