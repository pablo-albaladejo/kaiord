<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/components/molecules/CoachingCard/`

## Purpose

The Train2Go coaching-activity dialog + matched-session UI. The richest molecule in the SPA: dialog shell, body variants (matched vs unmatched), AI / manual conversion handlers, MatchToPicker, executed-workouts section (Train2Go three-slot grouping), and the state machine driving the convert/heal/match flow.

## Key Files

### Dialog shell + body

- `CoachingActivityCard.tsx` / `.test.tsx` — calendar card surface for a coaching activity.
- `CoachingActivityDialog.tsx` / `.test.tsx` (+ `.bootstrap.test.tsx`, `.states.test.tsx`) — top-level dialog component.
- `CoachingActivityDialogContent.tsx` — content slot used by the dialog.
- `coaching-dialog-shell.tsx` / `.test.tsx` — Radix Dialog shell.
- `coaching-dialog-body.tsx`, `coaching-dialog-body-props.ts`, `coaching-dialog-matched-body.tsx` — body variants (unmatched flow vs matched-with-executed flow).
- `coaching-dialog-parts.tsx` — sub-parts (header / footer / sections).
- `build-coaching-dialog-close-handler.ts` / `.test.ts` — close-intent handler that respects in-flight AI calls.

### State + handlers

- `use-coaching-dialog.ts` / `.test.tsx` — top-level dialog hook.
- `use-coaching-dialog-state.ts` / `.test.tsx` — explicit state machine for the dialog flow.
- `use-coaching-dialog-actions.ts` / `.test.tsx` + `use-coaching-dialog-helpers.ts` — action surface (match, unmatch, convert, manual, AI).
- `use-coaching-state-observed.ts` — observable wrapper used by tests.
- `use-coaching-ai-handler.ts` / `.test.tsx` + `use-coaching-ai-helpers.ts` / `.test.ts` — AI-conversion handler.
- `use-coaching-manual-handler.ts` / `.test.tsx` — manual-conversion handler.
- `use-coaching-convert.ts` / `.test.tsx` — entry point composing AI + manual handlers.
- `use-coaching-auto-heal.ts` — opportunistic SHORT-form → COMPOSITE id healing (R-SessionMatchIdShape).
- `use-open-executed-handler.ts` — handler that opens an executed workout from an executed slot.

### Subcomponents

- `AiProcessingOverlay.tsx` / `.test.tsx` — spinner overlay while AI runs.
- `AiErrorState.tsx` / `.test.tsx` — error pane for AI failures.
- `MatchToPicker.tsx` / `.test.tsx` + `MatchToPickerItem.tsx` — pickable-workout picker used to link a workout to the activity.
- `MatchedActions.tsx` / `.test.tsx` — action buttons in the matched body.
- `NoWorkoutActions.tsx` + `no-workout-buttons.tsx` — action buttons in the no-workout body.
- `LinkedWorkoutSection.tsx` / `.test.tsx` + `linked-workout-utils.ts` — section showing the linked workout.
- `ExecutedWorkoutsSection.tsx` / `.test.tsx` — Train2Go three-slot executed-activity section (1-N, from #597 / #599).
- `CoachingSyncButton.tsx` / `.test.tsx` + `coaching-sync-button-tooltip.ts` — manual scrape trigger.

## For AI Agents

### Working In This Directory

1. **R-SessionMatchIdShape applies here.** Every write to `sessionMatches.coachingActivityId` (match, unmatch, link, executed-append) MUST go through `buildCoachingActivityId(...)`, `toPersistedCoachingActivityId(...)`, or `CoachingActivityRecord.id` — never concat. The auto-heal hook exists specifically for legacy SHORT-form rows.
2. **R-PIIInterpolation applies.** Toast / `console.*` strings here must be literals or top-level constants.
3. **State machine, not flags.** Dialog state is centralised in `use-coaching-dialog-state.ts` — don't introduce new boolean flags at the component level.
4. **AI calls are idempotency-keyed.** The hook composes `convert-coaching-activity-with-ai` from `application/coaching/`, which dedupes repeat calls.

### Testing Requirements

- Each hook has a `.test.tsx`. Dialog state tests use `CoachingActivityDialog.states.test.tsx` as the source of truth.
- AI handlers are tested with stubbed providers.

### Common Patterns

- Split-by-concern: `use-coaching-*.ts(x)` for hooks, `coaching-dialog-*.tsx` for shell pieces.

## Dependencies

### Internal

- `../../hooks/{use-match-session,use-unmatch-session,use-matched-sessions,use-pickable-workouts}`.
- `../../application/coaching/{convert-coaching-activity*,heal-session-match-id-shape,attempt-link}`.
- `../../store/ai-runtime-store`.
- `../../types/{coaching-activity-record,session-match,errors}`.

### External

- `react`, `@radix-ui/react-dialog`, `@kaiord/ai`.

<!-- MANUAL: -->

The dialog is the SPA's largest molecule and the single touchpoint between the coaching domain and the user. Its state machine is the contract: read `use-coaching-dialog-state.ts` end-to-end before adding a new state.
