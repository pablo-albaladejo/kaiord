/**
 * Per-call focus application for `useFocusAfterAction` (§7.6).
 *
 * Resolves the `FocusTarget` against the registry + fallback refs,
 * clears `pendingFocusTarget` synchronously so React never re-runs the
 * effect on the same intent, and then schedules the low-level
 * `applyFocusToElement` inside `setTimeout(fn, 0)` so concurrent
 * `role="status"` toasts get queued first in the AT speech pipeline.
 *
 * If the fallback chain yields `null`, the target is cleared and a
 * dev-mode warning is emitted — focus never lands on a bare
 * `role="list"` container.
 */

import {
  type FocusResolveResult,
  resolveFocusElement,
} from "../../lib/focus/fallback-chain";
import type { FocusTarget } from "../../store/focus/focus-target.types";
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
};

const warnUnresolved = (reason: FocusResolveResult["reason"]) => {
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

  const reduceMotion = prefersReducedMotion();
  setTimeout(() => {
    applyFocusToElement(element, { reduceMotion });
  }, 0);
};
