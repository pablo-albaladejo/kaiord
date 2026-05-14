<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/hooks/focus/`

## Purpose

Focus-after-action machinery. Reads the workout store's `pendingFocusTarget`, applies it to the DOM in `useLayoutEffect`, and emits telemetry events via `FocusTelemetryContext`. Owns the overlay-deferred-apply behavior that re-applies a stashed target after a dialog closes.

## Key Files

- `use-focus-after-action.ts` / `.test.tsx` — top-level hook wired at the `WorkoutSection` boundary. Reads `pendingFocusTarget`, resolves it to a DOM element, focuses it, and clears the target.
- `use-focus-after-action-telemetry.test.tsx` — pins the canary + error telemetry events from §7 in `store/README.md`.
- `use-focus-registration.ts` — `useEffect` registration for items that want to be focused.
- `use-focus-telemetry-emitter.ts` — emits structured telemetry events through `FocusTelemetryContext`.
- `use-overlay-focus-stash.ts` — stashes the target while overlays are open and re-applies it on close.
- `apply-focus-target.ts` — pure resolver from `FocusTarget` to focused element id.
- `apply-focus-to-element.ts` / `.test.ts` — DOM-side `.focus()` with form-field short-circuit + telemetry.
- `is-form-field-focused.ts` / `.test.ts` — predicate: is the user actively typing in an input?

## For AI Agents

### Working In This Directory

1. **`useLayoutEffect`-driven.** Focus moves before the next paint to avoid flicker. Mutations that need post-commit reads pair with `flushSync` patterns from `store/README.md` §7.9.
2. **Telemetry callback MUST be stable** (see `providers/focus-telemetry.ts`). A dev-mode warn fires on inline arrows.
3. **Form-field short-circuit:** if the user is typing in an input, focus moves are skipped (telemetry-only).
4. **Overlay deferred-apply** stashes the target while a Radix Dialog/dropdown is open; one rAF after close it re-applies. Don't bypass — the stash is how paste-then-close flows keep correct focus.

### Testing Requirements

- Telemetry events are pinned via `use-focus-after-action-telemetry.test.tsx`.
- `apply-focus-to-element.test.ts` covers the short-circuit and the element-not-found fallback.

## Dependencies

### Internal

- `../../store/{focus,focus-rules,providers/focus-telemetry}`.
- `../../lib/focus/*` (overlay observer + fallback chain).

### External

- `react`.

<!-- MANUAL: -->

The focus-after-action hook is the single seam the editor uses to keep keyboard navigation predictable. Read `store/README.md` end-to-end before touching this directory.
