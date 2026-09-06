> Tasks: 44 completed, 0 deferred

## 1. Zone derivation

- [x] 1.1 Add `lib/workout-review/zone-profile.ts`: `ZoneSegment`,
      `zoneSegments(workout, thresholds)` (contiguous same-zone runs, untimed
      and unclassifiable steps dropped) and `dominantZone(dist)` (argmax over
      `timeInZone`'s output, ties to the harder zone, `null` when all zero).
      Reuse `flattenTimeSteps` and `classifyTargetZone`; add no classifier.
- [x] 1.2 Export both from `lib/workout-review/index.ts`.
- [x] 1.3 Add `components/molecules/WorkoutCard/session-zones.ts`:
      `sessionZones(record, profile)` → `{ segments, dominant }`, returning the
      empty profile for a record with no KRD.
- [x] 1.4 Co-located tests for 1.1 and 1.3, including the raw-record and
      all-zeros paths.

## 2. The shared zone-profile molecule

- [x] 2.1 `molecules/ZoneProfileBar/ZoneProfileBar.tsx` — segments as flex
      weights, per-zone height fractions, caller-supplied pixel height,
      `aria-hidden` unless given a label. Document the 14 / 20 / 10 px call
      sites in the file header.
- [x] 2.2 Height ladder Z1→Z5 as a named constant, not inline literals.
- [x] 2.3 Co-located test: one segment per run, taller segment for the harder
      zone, nothing rendered for an empty segment list.

## 3. Card border, chip and bar

- [x] 3.1 `status-tokens.ts`: replace the three lifecycle/compliance border
      maps with `zoneBorderClass(zone | null)` returning `border-l-zone-N` or
      the neutral edge. Delete `workoutStateToColourClass`,
      `statusToColourClass` and `complianceBucketToBorderClass` — nothing may
      keep painting a lifecycle.
- [x] 3.2 `CardShell`: neutral card border on all four sides, coloured left
      edge only, 12 px radius, border-colour transition at `--dur-state`, and a
      new `zoneBar` slot under the title row.
- [x] 3.3 `WorkoutCard`: dominant-zone border, zone bar, lifecycle word chip
      replacing the coloured glyph.
- [x] 3.4 `CoachingActivityCard`: neutral border (no KRD, no zone), keep the
      effort dots, status word as the chip.
- [x] 3.5 `MatchedSessionCard`: dominant zone of the executed workout, and the
      compliance percentage as the chip.
- [x] 3.6 Retire `getStateIndicator`'s hue classes; keep the labels for a11y.
- [x] 3.7 Rewrite `status-tokens.test.ts` against the zone contract, and delete
      `contrast.test.ts` + its fixtures: it pinned four Tailwind v3 hexes that
      no token references any more, and the zone ramp carries a verified row
      per theme, so a frozen hex mirror would check the wrong theme's values.

## 4. Week status bar

- [x] 4.1 `pages/week-status.ts`: `buildWeekStatus(buckets, rawCount)` →
      `{ doneAndMatched, readyNotPushed, needsStructure }`, plus an `isEmpty`
      predicate.
- [x] 4.2 `molecules/WeekStatusBar/WeekStatusBar.tsx` — three lightness steps,
      counts as text, renders nothing when empty.
- [x] 4.3 Mount it in `CalendarPageView` between the header and the body.
- [x] 4.4 Co-located tests including the silent-week case.

## 5. Banners: one action, and a first run that speaks

- [x] 5.1 `CalendarEmptyBanners`: branch on `hasAnyWorkouts === false` first and
      render the first-run guide; that is the bug fix.
- [x] 5.2 Make the batch action and the missing-key banner mutually exclusive.
- [x] 5.3 `molecules/CalendarEmptyStates/FirstRunGuide.tsx` — three ordered
      steps, each naming its consequence, plus the manual escape hatch.
- [x] 5.4 Rewrite `EmptyWeekState`, `NoAiProviderState` and `NoBridgesState`
      against the V2 copy; keep every existing test id.
- [x] 5.5 `BatchProcessingBanner` / `BatchMessage`: neutral surfaces, attention
      icon, ink CTA.
- [x] 5.6 Extend `CalendarEmptyStates.test.tsx` with the first-run case that
      previously rendered nothing.

## 6. Calendar chrome repaint

- [x] 6.1 `DayColumn` / `CalendarWeekGridHeader`: today reads as a filled pill
      plus a surfaced column, not a tinted one; drop ring on the accent role.
- [x] 6.2 `CalendarWeekListDay` + `DayColumnAddButton`: dashed add control on
      edge roles.
- [x] 6.3 `WellnessBand`: role tokens, dash marker kept.
- [x] 6.4 Thread the active profile to the cards so thresholds resolve, without
      adding a second live query.

## 7. Daily

- [x] 7.1 Move `PlannedSession` above `ReadinessCard` and `EnergyBalanceCard`.
- [x] 7.2 `TrendsCard` becomes a link row.
- [x] 7.3 `WeekStripMark`: drop the `sky-*` literals, keep glyph / size /
      opacity and the hairline.
- [x] 7.4 `HealthSourceBadge` and `ReadinessStat`: role tokens, `↩` kept.
- [x] 7.5 Pin the new order in `Daily.test.tsx`: the session leads and Trends
      trails. Nothing asserted the order before, so the reorder was invisible
      to the suite.

## 8. The live core (#1118)

- [x] 8.1 `hooks/use-week-dominant-zone.ts` — one live query over the current
      week's workouts for the active profile, reduced through `dominantZone`.
- [x] 8.2 `HeaderLogo`: set `--core-live` on the existing wrapper when a zone
      resolves, and declare nothing when it does not.
- [x] 8.3 Test both branches, including that the empty week sets no property.

## 9. i18n

- [x] 9.1 New `calendar` keys: week status, lifecycle chips, first-run guide.
- [x] 9.2 Put the consequence-naming copy in `calendar.*` beside the components
      that render it — `coaching.banner.*` belongs to `AutoMatchBanner`, which
      this change does not touch. Add `coaching.effortOf` for the effort dots'
      label, which was the last hardcoded string on the coaching card.
- [x] 9.3 Mirror every key in `es`; `resource-parity.test.ts` must pass.

## 10. Verification

- [x] 10.1 `pnpm -r build`
- [x] 10.2 `pnpm --filter @kaiord/workout-spa-editor test`
- [x] 10.3 `pnpm lint` (max-warnings 0) and `tsc -b`
- [x] 10.4 `pnpm lint:specs`
- [x] 10.5 Both themes checked on `/calendar` and `/daily`.
