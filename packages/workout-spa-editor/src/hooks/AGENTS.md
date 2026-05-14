<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/hooks/`

## Purpose

Custom React hooks. This is where the SPA bridges the persistence layer (Dexie via `useLiveQuery`) and the editor runtime (Zustand) into the React tree. One hook per file; file names are kebab-case (`use-*.ts(x)`), exports are camelCase (`useXxx`).

## Key Files

### Live-query hooks (Dexie → React)

- `use-active-profile-live.ts` / `.test.tsx` — `useLiveQuery` over the active profile id + row.
- `use-profile-by-id-live.ts` / `.test.tsx` — `useLiveQuery` over a specific profile id.
- `use-profiles-live.ts` / `.test.tsx` — `useLiveQuery` over all profiles.
- `use-ai-providers-live.ts` / `.test.tsx` — `useLiveQuery` over AI provider configs.
- `use-ai-custom-prompt-live.ts` / `.test.tsx` — `useLiveQuery` over the custom-prompt meta-row.
- `use-library-templates-live.ts` / `.test.tsx` — `useLiveQuery` over the Library templates.
- `use-coaching-activities.ts` / `.test.ts` — `useLiveQuery` over coaching activities for a profile + date range.

### Editor + workflow hooks

- `use-store-hydration.ts` / `.test.ts` — boot-time Zustand → Dexie hydration trigger.
- `use-onboarding-tutorial.ts` — tracks first-run tutorial visibility.
- `use-app-keyboard-handlers.ts` — wires the global keyboard shortcuts at the `<App />` level.
- `useKeyboardShortcuts.ts` / `.test.ts` (+ `keyboard-shortcut-handlers.ts` + `modifier-shortcut-handlers.ts`) — keyboard-shortcut machinery for the editor.
- `useAppHandlers.ts` — top-level app handlers shared by header + workflow bar.
- `useDeleteCleanup.ts` / `.test.ts` — purges expired soft-deleted steps.
- `useToast.ts` / `.test.ts` + `useToast.helpers.ts` + `useToast.types.ts` — toast surface over `@radix-ui/react-toast`.
- `use-route-announcer-label.ts` / `.test.tsx` — computes the `aria-live` announcement label per route.
- `use-focus-on-route-change.ts` / `.test.tsx` — moves focus to the route landmark on navigation.
- `use-editor-context-menu.ts` — wires the editor context menu.
- `use-dnd-card-wrapper.ts` — `@dnd-kit` wrapper for sortable cards.
- `use-lazy-dialog.ts` / `.test.ts` — defers mounting of expensive dialogs until first open.
- `use-latest-ref.ts` / `.test.tsx` — ref-of-latest-value helper.

### Coaching + matching hooks

- `use-auto-match-suggestions.ts` / `.test.tsx` — surface auto-match suggestions for the current week.
- `use-auto-match-banner-actions.ts`, `use-dismiss-auto-match-banner.ts` — actions for the banner UI.
- `use-match-session.ts` / `.test.tsx` — explicit-link action wrapper.
- `use-unmatch-session.ts` / `.test.tsx` — explicit-unlink action wrapper.
- `use-matched-sessions.ts` / `.test.tsx` (+ `use-matched-sessions-query.ts` + `use-matched-sessions-perf.ts` + `use-matched-sessions-heal.ts`) — week-scoped matched-session feed.
- `use-matched-sessions-hydrate.ts` / `.test.ts` + `use-matched-sessions-hydrate-helpers.ts` — hydration of matched sessions for the calendar.
- `use-activity-match-state.ts` — local state for a coaching-activity's match status.
- `use-executed-match-auto.ts` — auto-detects executed workouts that should be matched.
- `use-coaching-auto-sync.ts` / `.test.tsx` + `use-coaching-auto-sync-helpers.ts` / `.test.ts` — periodic coaching scrape.

### Bridge hooks

- `use-bridge-discovery-bootstrap.ts` — wires bridge discovery into the React tree.
- `use-discovered-bridges.ts` — `useSyncExternalStore` over the bridge-discovery singleton.
- `use-discovered-extension-id.ts` — surfaces the active bridge's extension id.
- `use-train2go-detection.ts`, `use-train2go-supports-zones.ts` — Train2Go-specific feature checks.
- `use-garmin-detection.ts` / `.test.ts` — Garmin bridge detection.
- `garmin-bridge-operations.ts` / `.test.ts`, `use-garmin-bridge-actions.ts`, `use-garmin-bridge-action-helpers.ts` — Garmin push flow.
- `use-profile-snapshot-push.ts` (+ `use-profile-snapshot-push-helpers.ts`) — pushes the active profile to discovered bridges with fingerprint dedup + the shared operation queue.

### Misc

- `use-batch-cost-estimate.ts` / `.test.ts` — AI batch-conversion cost estimate (uses provider rates).
- `use-pickable-workouts.ts` — pickable-workout query for the Match-to picker.
- `use-set-calendar-density.ts` — wraps the calendar-density use case.
- `use-storage-probe.ts` — wires `storage-probe.ts` into the React tree.
- `use-user-preferences.ts` / `.test.tsx` — user-preferences read+write.
- `use-v10-migration-toast.ts` / `.test.tsx` — surfaces the v10 migration toast (UX from #602).

## Subdirectories

- `focus/` — focus-after-action hook + helpers (`apply-focus-target`, `apply-focus-to-element`, `is-form-field-focused`, `use-focus-after-action`, `use-focus-after-action-telemetry`, `use-focus-registration`, `use-focus-telemetry-emitter`, `use-overlay-focus-stash`).

## For AI Agents

### Working In This Directory

1. **One hook per file.** New hooks add a new `use-*.ts(x)` file. If a hook needs helpers, co-locate them as `<name>-helpers.ts`.
2. **Dexie reads go through `useLiveQuery`** (from `dexie-react-hooks`). One query per page is the rule; pages compose multiple live-query hooks.
3. **Toasts and console statements MUST use static literals or top-level SCREAMING_SNAKE_CASE constants** — R-PIIInterpolation applies under `src/hooks/**`.
4. **`useLatestRef` for stable callback identity** when wiring callbacks into the operation queue / DOM listeners.
5. **Focus hooks live under `focus/`.** Don't add focus DOM logic at the top level here.

### Testing Requirements

- `.test.tsx` for hooks that use rendering; `.test.ts` for pure / non-rendering hooks via `renderHook`.
- Persistence-backed tests wire `createInMemoryPersistence` from `../test-utils/`.

### Common Patterns

- Naming: kebab-case file (`use-active-profile-live.ts`), camelCase export (`useActiveProfileLive`).
- Test ids in JSX are stable strings (no template interpolation) to keep R-PIIInterpolation happy.

## Dependencies

### Internal

- `../store/*` (Zustand store + selectors).
- `../ports/persistence-port` (via context).
- `../application/*` (use cases triggered by hook actions).
- `../contexts/persistence-context` (`usePersistence`).
- `../types/*`.

### External

- `react`, `dexie-react-hooks`, `wouter`, `@dnd-kit/*`, `@radix-ui/react-toast`.

<!-- MANUAL: -->

Hooks are where the Zustand-only-for-runtime / Dexie-for-persisted-data split is enforced in practice. If a component wants to read persisted data, write the `use-<entity>-live.ts(x)` hook here first — do not bypass into the store.
