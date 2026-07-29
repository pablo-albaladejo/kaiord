## 1. Anchoring primitives

- [x] 1.1 Create `lib/coach-marks.ts`: `CoachMarkId`, `CoachMarkDef`, the ordered `COACH_MARKS` catalog, `CoachMarkSignals`, `ActiveCoachMark` and `pickCoachMark`, which skips a mark that is dismissed, whose command guard is closed, or whose anchor id is `null`.
- [x] 1.2 Move `useElementHighlight` to `hooks/coach-marks/use-element-highlight.ts` and re-point it at `FocusRegistryContext.getItem(asItemId(id))`; keep the `open` gate and the `scrollIntoView`.
- [x] 1.3 Create `hooks/coach-marks/use-anchored-position.ts`: `computeTooltipPosition` over both live rects, recomputed on `resize` and on capture-phase `scroll`.
- [x] 1.4 Write `lib/coach-marks.test.ts` (8 cases): catalog order, closed guard skipped, dismissed skipped, `null` anchor refused rather than centred, anchor id carried through, ids unique.
- [x] 1.5 Write `hooks/coach-marks/use-element-highlight.test.tsx` (5 cases): a registered id resolves to that exact element, the element is scrolled into view, an unregistered id and a closed/absent id all resolve to `null`.
- [x] 1.6 Write `hooks/coach-marks/use-anchored-position.test.tsx` (6 cases): equality with `computeTooltipPosition` for two side/align pairs, `null` while either rect is missing, and re-measurement on resize and on a non-bubbling nested scroll.

## 2. Relevance and dismissal

- [x] 2.1 Add `dismissedCoachMarks?: string[]` to `userPreferencesSchema` — optional, unindexed, no Dexie version bump.
- [x] 2.2 Add `dismissedCoachMarks` to `UserPreferenceFieldsPatch` and to the merge in `setUserPreferenceFields`.
- [x] 2.3 Create `hooks/coach-marks/use-coach-mark.ts`: fold `useEditorCommands` (availability + `run`), the store's selection ids (anchors) and the profile's recorded dismissals into one `pickCoachMark` call; `accept` retires then runs, `dismiss` only retires.
- [x] 2.4 Write `hooks/coach-marks/use-coach-mark.test.tsx` (8 cases, Dexie-backed): silent with nothing available, grouping mark on a two-step selection anchored to the last id, ungroup mark anchored to the selected block, silent for a recorded mark, dismissal and acceptance both persisting, and acceptance reaching the store thunk.

## 3. The mark itself

- [x] 3.1 Create `components/molecules/CoachMark/CoachMarkCard.tsx`: title, body, `KeyChips` resolved from `SHORTCUT_CATALOG` by id, primary action and "Not now".
- [x] 3.2 Create `components/organisms/CoachMark/CoachMarkHost.tsx`: compose the three hooks, portal to `document.body`, `visibility: hidden` + `data-anchored="false"` until a position exists.
- [x] 3.3 Mount `CoachMarkHost` inside `WorkoutSectionInner` — inside `FocusRegistryProvider`, which the anchor lookup requires.
- [x] 3.4 Add `i18n/locales/{en,es}/coach.json`: `marks.<id>.{title,body,shortcutHint,action}`, `actions.notNow`, `a11y.coachMark`.
- [x] 3.5 Write `CoachMarkCard.test.tsx` (6 cases): copy rendered, key chips present, both callbacks fired, every catalog mark documented by a shortcut row, every mark carrying a full set of copy keys.
- [x] 3.6 Write `CoachMarkHost.test.tsx` (5 cases): nothing without a mark, rendered with one, `data-anchored="true"` for a registered anchor, `"false"` for an unknown one, and the computed `left` matching the anchor's right edge plus the shared side offset.

## 4. Demolition

- [x] 4.1 Delete `components/templates/MainLayout/components/HelpDialog.tsx` and `components/pages/HelpSection/**` (9 sources, 1 test, 1 `AGENTS.md`).
- [x] 4.2 Delete `components/organisms/OnboardingTutorial/**` (9 sources, 1 test), `constants/tutorial-steps.ts`, `components/AppTutorial.tsx` and `hooks/use-onboarding-tutorial.ts`.
- [x] 4.3 Unwire the `onReplayTutorial` chain: `App.tsx`, `MainLayout.tsx`, `LayoutHeader.tsx`.
- [x] 4.4 Remove the header Help button: `StatusEntryButtons.tsx` (button + `HelpCircle` + `Button` import), `StatusHeader.tsx` (`onHelpClick` prop), `use-header-overlays.ts` (the `help` dialog). Nothing else in the header moves.
- [x] 4.5 Trim `i18n/locales/{en,es}/help.json` to the `shortcuts` subtree — 79 leaf keys down to 21, 58 removed per locale.
- [x] 4.6 Remove the orphaned `common.json` keys in both locales: `actions.help`, `a11y.openHelp`, `help.documentation`, `help.hint`.
- [x] 4.7 Delete `e2e/test-setup.ts` and the `disableOnboardingTutorial` calls in `coaching-dialog-train2go`, `coaching-sidebar.visual` and `coaching-dialog-redesign`.
- [x] 4.8 Rewrite `e2e/onboarding.spec.ts` around the surfaces that still exist: the `?` sheet, the absent help button, and the tooltip flows. Every `workout-spa-onboarding-completed` and `workout-spa-first-workout-hints-dismissed` assertion goes.
- [x] 4.9 Update the tests that named the retired surfaces: `App.test.tsx` (tutorial block → "should not mount a first-run tutorial dialog"), `LayoutHeader.test.tsx` (help-dialog block → "retired help surfaces"), `StatusHeader.test.tsx` and `StatusEntryButtons.test.tsx` (dropped prop).
- [x] 4.10 Update the `AGENTS.md` inventories that listed deleted modules: `constants/`, `components/`, `components/pages/`, `components/organisms/`, `hooks/`, `MainLayout/`, `e2e/`.

## 5. "Show tips again" in Settings

- [x] 5.1 Add `SettingsActionKey` and `action?` to `settings-group-types.ts`.
- [x] 5.2 Add `onActivate` to `SettingsRow`: an action row renders as a `<button>` with no chevron; a row with neither destination nor action stays an inert `<div>`.
- [x] 5.3 Create `use-settings-row-actions.ts` — `replayCoachMarks` writes `dismissedCoachMarks: []` — and resolve it from `SettingsGroupList`, mirroring `useSettingsRowValues`.
- [x] 5.4 Add the `replayTips` row to the About group and its `rows.replayTips` copy in `en`/`es`.
- [x] 5.5 Extend `SettingsRow.test.tsx`: an action row runs in place, and a row with neither destination nor action is inert.

## 6. Verification

- [x] 6.1 `pnpm -r build` clean (required before commit — pre-commit runs `tsc` across packages).
- [x] 6.2 `pnpm --filter @kaiord/workout-spa-editor test` — full suite passing.
- [x] 6.3 `pnpm --filter @kaiord/workout-spa-editor lint` clean (`tsc -b --noEmit` plus eslint at `--max-warnings=0`), including the 100-line file and 60-line component caps.
- [x] 6.4 `pnpm test:scripts` green, including the AAA and title guards over every new test.
- [x] 6.5 `pnpm lint` green at the root, including `lint:specs`.
- [x] 6.6 `npx openspec validate retire-help-dialog-for-coach-marks` passes.
