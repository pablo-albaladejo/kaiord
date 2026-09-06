# Tasks · Library, Workout detail, Create workout, Chat

## 1. Shared derivations

- [x] 1.1 Add `lib/workout-review/zone-emphasis.ts` with `dominantZone(dist)`
      (argmax, ties resolving to the lower zone) and `hardestZone(dist)`
      (highest index with a positive fraction). Both return `null` for an
      all-zero distribution. See design.md D2.
- [x] 1.2 Cover both in `zone-emphasis.test.ts`: a mixed distribution, a
      downward-resolving tie, an all-zero distribution, and hardest ≠ dominant.
- [x] 1.3 Add `lib/athlete/threshold-provenance.ts`:
      `buildThresholdProvenance(profile, sport, units)` returning the sport's
      primary `thresholdCandidates` entry plus the profile's `updatedAt`, or
      `null` when the value is unset. See design.md D3.
- [x] 1.4 Cover it in `threshold-provenance.test.ts`: cycling FTP, running pace,
      a sport with no threshold, and a null profile.
- [x] 1.5 Add `zoneName.z1`…`z5` to `i18n/locales/{en,es}/zones.json`. See
      design.md D5.

## 2. Library

- [x] 2.1 `molecules/LibraryCard`: 16 px radius, 4 px lateral border in the
      dominant zone (none when the distribution is empty), title and
      `sport · duration · TSS` meta on one baseline with tabular numerals, and
      the `ZoneDist` strip at 10 px directly under the title. See design.md D1.
- [x] 2.2 Update `LibraryCard.test.tsx` for the new structure and add a case
      asserting no zone border on a template with no distribution.
- [x] 2.3 `library-card-model.ts`: carry `sport` through as a translated label
      so the meta line reads in the active locale.
- [x] 2.4 `LibraryListRow`: actions to the right of the card content —
      Schedule first, Load when the editor holds a workout, delete last.
- [x] 2.5 `LibraryHeader`: the count line becomes "N workouts · kept by you".
- [x] 2.6 `LibraryPage`: repaint `text-slate-400` on the loading state to
      `text-ink-muted` (#1121).
- [x] 2.7 Add `Library/LibraryKeepHint.tsx` — the dashed footer stating what
      lands in the library and offering "Write a new one" — and render it under
      a non-empty list.
- [x] 2.8 Add the `library` i18n keys in `en` and `es`. Do NOT rename any
      existing action key: `library.json`'s verbs belong to the Editor wave.

## 3. Workout detail

- [x] 3.1 `molecules/SummaryStrip`: `SummaryItem` gains an optional `zone`; when
      present a zone swatch replaces the icon and the value renders beside it.
      No other behaviour changes.
- [x] 3.2 `SummaryStrip.test.tsx`: a swatch item renders the swatch and keeps
      its label; an icon item is unchanged.
- [x] 3.3 `WorkoutDetailView`: the third summary metric becomes Hardest zone
      (swatch + translated name), replacing the derived Load label. Omit the
      metric when the distribution is empty.
- [x] 3.4 `WorkoutDetailStructure`: add the threshold-provenance line beneath
      the step list, using the shared builder. Omit when it returns `null`.
- [x] 3.5 `WorkoutDetailStructure` reads the active profile itself rather than
      threading it through `use-workout-detail-model`, whose return type is
      mocked wholesale by `WorkoutDetail.test.tsx`.
- [x] 3.6 `WorkoutDetail.test.tsx` needed no change: it asserts the title, the
      not-found state and the two navigations, none of which the summary
      change touches.
- [x] 3.7 Add the `workout-detail` i18n keys in `en` and `es`.

## 4. Create workout

- [x] 4.1 `CreateInputHero`: replace the trailing "Built around your … zones"
      caption with the threshold-provenance line placed **above** the textarea
      (principle 8). Omit it when the sport has no primary threshold.
- [x] 4.2 `CreateInputPhase`: pass the profile through so the hero can build it.
- [x] 4.3 `CreateResultPhase`: the third summary metric becomes Hardest zone,
      matching Workout detail.
- [x] 4.4 `CreateInputPhase.test.tsx`: assert the provenance line renders with a
      threshold set and is absent without one.
- [x] 4.5 Add the `create-workout` i18n keys in `en` and `es`.

## 5. Proposed sessions

- [x] 5.1 Add `molecules/SessionProposalCard`: dominant-zone lateral border,
      title, optional subtitle, metrics as `{value, was?, label}`, the 10 px
      zone bar, and a slot for actions. See design.md D4.
- [x] 5.2 `SessionProposalCard.test.tsx`: a metric with `was` renders the
      comparison; a metric without it renders no comparison row at all.
- [x] 5.3 Add `hooks/use-proposed-session.ts`: live-query the proposed workout
      by id and the other session on the same `profileId + date`, returning both
      review models. Return the proposal alone when the date holds nothing else.
- [x] 5.4 Add `organisms/Chat/ChatWorkoutProposal.tsx`, rendered from a
      `create_workout` tool event's result. Keep `ToolResultLinks` for
      `push_to_garmin` and as the proposal card's own deep links.
- [x] 5.5 `build-tool-result-links.ts`: leave the link builder intact; the
      proposal renders alongside it, not instead of it.
- [x] 5.6 `CoachingDraftSurface`: render the draft through the same card, with
      the coach's prescribed duration and workload as the before values.
- [x] 5.7 Add the `chat` i18n keys in `en` and `es`.

## 6. Repaint (#1121)

- [x] 6.1 `ChatMessageList`: `bg-sky-600 text-white` → `bg-accent text-surface`;
      `ring-yellow-300` → `ring-edge-strong`. See design.md D6.
- [x] 6.2 Verify no `slate-`/`gray-`/literal-hex utility remains in any file
      this change touches.
- [x] 6.3 Leave `utils/step-colors.ts` and
      `SaveToLibraryButton/thumbnail/*` to the Editor wave, as #1121 assigns.

## 7. Verification

- [x] 7.1 `pnpm -r build`.
- [x] 7.2 `pnpm --filter @kaiord/workout-spa-editor test`.
- [x] 7.3 `pnpm lint` (max-warnings 0) and `pnpm exec tsc -b`.
- [x] 7.4 `pnpm lint:specs`.
- [x] 7.5 Check all four screens in both themes.
