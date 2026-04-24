/**
 * Per-call focus application for `useFocusAfterAction` (§7.6).
 *
 * Resolves the target, clears `pendingFocusTarget` synchronously, then
 * schedules the low-level focus inside `setTimeout(fn, 0)`. A fallback
 * event is emitted when the primary target is not found and the chain
 * falls back to empty-state, first-item, or heading.
 */

import {
  type FocusResolveReason,
  resolveFocusElement,
} from "../../lib/focus/fallback-chain";
import type { FocusTarget } from "../../store/focus/focus-target.types";
import {
  type FocusTelemetry,
  safeEmit,
  unresolvedTargetFallbackEvent,
} from "../../store/providers/focus-telemetry";
import type { ItemId } from "../../store/providers/item-id";
import { useWorkoutStore } from "../../store/workout-store";
import {
  applyFocusToElement,
  prefersReducedMotion,
} from "./apply-focus-to-element";

export type ApplyTargetDeps = {
  getItem: (id: ItemId) => HTMLElement | undefined;
  emptyStateButton: HTMLElement | null;
  editorHeading: HTMLElement | null;
  setPendingFocusTarget: (target: FocusTarget | null) => void;
  onApplied: (target: FocusTarget) => void;
  telemetry: FocusTelemetry;
};

const FALLBACK_REASONS = new Set<FocusResolveReason>([
  "empty-state",
  "first-item",
  "heading",
]);

const warnUnresolved = (reason: FocusResolveReason) => {
  if (import.meta.env.MODE === "production") return;
  console.warn(
    `[focus] pendingFocusTarget unresolved (reason=${reason}); clearing without moving focus`
  );
};

const readFirstItemId = (): ItemId | null => {
  const workout =
    useWorkoutStore.getState().currentWorkout?.extensions?.structured_workout;
  const firstStep = workout?.steps?.[0] as { id?: string } | undefined;
  return (firstStep?.id ?? null) as ItemId | null;
};

export const applyFocusTarget = (
  target: FocusTarget | null,
  deps: ApplyTargetDeps
): void => {
  if (!target) return;
  const { element, reason } = resolveFocusElement({
    target,
    getRegisteredItem: deps.getItem,
    firstItemId: readFirstItemId(),
    emptyStateButton: deps.emptyStateButton,
    editorHeading: deps.editorHeading,
  });

  deps.onApplied(target);
  deps.setPendingFocusTarget(null);

  if (element === null) {
    warnUnresolved(reason);
    return;
  }

  // Emit telemetry when the primary target was not directly resolved.
  // The only non-fallback case for reason="empty-state" is when the
  // target itself asked for the empty-state button.
  const isDirectHit =
    reason === "target" ||
    (target.kind === "empty-state" && reason === "empty-state");
  if (FALLBACK_REASONS.has(reason) && !isDirectHit) {
    safeEmit(
      deps.telemetry,
      unresolvedTargetFallbackEvent(
        target.kind as "item" | "empty-state",
        reason as "empty-state" | "first-item" | "heading"
      )
    );
  }

  const reduceMotion = prefersReducedMotion();
  setTimeout(() => {
    applyFocusToElement(element, { reduceMotion, telemetry: deps.telemetry });
  }, 0);
};
