> Completed: 2026-08-04

## Why

The SPA still ships two guidance surfaces that teach nothing.

`OnboardingTutorial` renders six centred dialogs on first run. Every one of its
steps is `position: "center"` and none of them sets `targetSelector`, so
`useElementHighlight` — the hook whose entire job is pointing at a thing — has
been live and dead since it was written. `position-utils.getPositionClasses`
never took a rect: it returned fixed viewport percentages
(`left-[50%] top-[10%]`), which is why no step could ever anchor.

`HelpDialog` is a modal wrapper around `HelpSection`, four scrolling sections
fed by 79 `help.json` keys per locale. Getting Started, Examples and the FAQ
already exist on the docs site; the in-app copy is a second, drifting copy of
them, and it blocks the thing it is describing while it is open.

K1–K3 replaced everything those surfaces did that was worth keeping: the `?`
shortcut sheet reads from `SHORTCUT_CATALOG`, the ⌘K palette enumerates every
editor command, and the live "Getting set up" checklist ticks itself from
persisted state. What is left is the fourth surface — a coach mark that points
at the element it is talking about — and the demolition.

## What Changes

- Add **anchored coach marks**. A mark fires only when the editor command it
  teaches is already available, and only while its anchor resolves in
  `FocusRegistryContext`. Two ship: grouping a multi-selection (`⌘G`) and
  ungrouping a selected block (`⌘⇧G`).
- Keep `useElementHighlight`, and re-point it: it resolves an anchor by
  `FocusRegistry` item id instead of `document.querySelector`, so the ids the
  store already tracks resolve straight to the mounted card.
- Replace `position-utils`' fixed percentages with `computeTooltipPosition` —
  the same math `atoms/Tooltip` uses — behind a new `useAnchoredPosition`.
  A mark with no computed position renders hidden; it never falls back to
  centre.
- Persist per-mark dismissal in the existing per-profile `userPreferences` row
  as a new optional, unindexed `dismissedCoachMarks` string array. **No Dexie
  version bump.**
- **Delete** `MainLayout/components/HelpDialog.tsx`, `pages/HelpSection/**`,
  `constants/tutorial-steps.ts`, `organisms/OnboardingTutorial/**`,
  `components/AppTutorial.tsx`, `hooks/use-onboarding-tutorial.ts` and
  `e2e/test-setup.ts`, plus the `onReplayTutorial` prop chain
  (`App` → `MainLayout` → `LayoutHeader` → `HelpDialog` → `HelpSection`).
- **Trim** `help.json` in both locales from 79 leaf keys to the 21-key
  `shortcuts` subtree that `SHORTCUT_CATALOG.labelKey` and `ShortcutSheet`
  resolve. Remove the now-orphaned `common.json` keys `actions.help`,
  `a11y.openHelp`, `help.documentation` and `help.hint`.
- Remove **only** the header's Help button. The header is not otherwise
  restructured — the account menu lands with Wave H.
- Move the retired "Replay Tutorial" control into `settings-groups` as
  **"Show tips again"**, an action row that empties `dismissedCoachMarks`.
  `SettingsRowDef` grows an `action` field resolved by a new
  `useSettingsRowActions`, mirroring how `valueKey` is resolved.
- Add a `coach` i18n namespace in `en` and `es`.

Out of scope: the header IA (Wave H), the Connections page, translating the
docs site (EN-only long-form is accepted), and any further coach mark whose
anchor is not already in the focus registry.

## Capabilities

### New Capabilities

- `spa-coach-marks`: guidance that points at the element it teaches about,
  fires from an existing command guard, and is retired per profile once acted
  on — together with the retirement of the in-app long-form help.

### Modified Capabilities

<!-- None. No existing capability spec described HelpDialog, HelpSection or
     OnboardingTutorial; the retirement requirements land in the new
     spa-coach-marks spec, which is what replaces them. -->

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  port, adapter or dependency change.
- **New files**: `lib/coach-marks.ts`,
  `hooks/coach-marks/{use-element-highlight,use-anchored-position,use-coach-mark}.ts`,
  `components/molecules/CoachMark/CoachMarkCard.tsx`,
  `components/organisms/CoachMark/CoachMarkHost.tsx`,
  `components/pages/SettingsPage/use-settings-row-actions.ts`,
  `i18n/locales/{en,es}/coach.json`, and a test beside each.
- **Deleted files**: 24 source files across `HelpSection/`,
  `OnboardingTutorial/`, `HelpDialog.tsx`, `AppTutorial.tsx`,
  `tutorial-steps.ts`, `use-onboarding-tutorial.ts` and `e2e/test-setup.ts`.
- **Persistence**: additive optional field on an existing table. No schema
  version, no migration, no backfill; absence reads as "nothing dismissed".
- **i18n**: new `coach` namespace at `en`/`es` parity; `help.json` loses 58
  leaf keys per locale; `common.json` loses 4. `resource-parity.test.ts`
  stays green. Namespaces are glob-discovered, so no registry edit.
- **e2e**: `onboarding.spec.ts` loses every tutorial assertion (the
  `workout-spa-onboarding-completed` key no longer exists) and keeps the
  shortcut-sheet and tooltip flows; three coaching specs drop the
  `disableOnboardingTutorial` call that is now a no-op.
- **No** public-API impact and no changeset — the SPA is private and excluded
  from the changeset-bot PUBLISHABLE set.
