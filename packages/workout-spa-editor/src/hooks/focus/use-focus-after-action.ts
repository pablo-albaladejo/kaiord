/**
 * `useFocusAfterAction` — the DOM bridge for the `pendingFocusTarget`
 * intent written by store actions (§7.2–7.8).
 *
 * Responsibilities:
 *   - Subscribe to `pendingFocusTarget` via a narrow selector so
 *     unrelated store keys never re-run the effect.
 *   - Resolve the target through the `FocusRegistryContext`, falling
 *     back along the §7.5 chain (empty-state → first item → heading).
 *   - Short-circuit while the user is typing inside a form field,
 *     clearing the target without moving focus.
 *   - Defer focus while a Radix dialog or menu is open, then re-apply
 *     the most recent target one animation frame after the last
 *     overlay closes.
 *   - Apply focus inside a `setTimeout(fn, 0)` so concurrent
 *     `role="status"` toasts queue first in the AT speech pipeline.
 *
 * The hook writes `pendingFocusTarget = null` synchronously at the
 * start of every apply path (including the form-field guard and the
 * overlay stash), so React never re-runs the effect on the same
 * target. The `prevTargetRef` guard handles the rare case where
 * Zustand delivers the same reference twice.
 */

import type { RefObject } from "react";
import { useContext, useEffect, useLayoutEffect, useRef } from "react";

import { FocusRegistryContext } from "../../contexts/focus-registry-context";
import { subscribeToOverlayCount } from "../../lib/focus/overlay-observer";
import type { FocusTarget } from "../../store/focus/focus-target.types";
import { useWorkoutStore } from "../../store/workout-store";
import { applyFocusTarget } from "./apply-focus-target";
import { isFormFieldFocused } from "./is-form-field-focused";

export type UseFocusAfterActionOptions = {
  editorRootRef: RefObject<HTMLElement | null>;
  emptyStateButtonRef: RefObject<HTMLElement | null>;
  editorHeadingRef: RefObject<HTMLElement | null>;
};

export const useFocusAfterAction = ({
  editorRootRef,
  emptyStateButtonRef,
  editorHeadingRef,
}: UseFocusAfterActionOptions): void => {
  const pendingFocusTarget = useWorkoutStore((s) => s.pendingFocusTarget);
  const setPendingFocusTarget = useWorkoutStore((s) => s.setPendingFocusTarget);
  const { getItem } = useContext(FocusRegistryContext);

  const prevTargetRef = useRef<FocusTarget | null>(null);
  const overlaysOpenRef = useRef(0);
  const stashedTargetRef = useRef<FocusTarget | null>(null);

  const apply = (target: FocusTarget) =>
    applyFocusTarget(target, {
      getItem,
      emptyStateButton: emptyStateButtonRef.current,
      editorHeading: editorHeadingRef.current,
      setPendingFocusTarget,
      onApplied: (t) => {
        prevTargetRef.current = t;
      },
    });

  useEffect(() => {
    const root = editorRootRef.current;
    if (!root) return;
    return subscribeToOverlayCount(root, (count) => {
      const wasOpen = overlaysOpenRef.current > 0;
      overlaysOpenRef.current = count;
      if (wasOpen && count === 0 && stashedTargetRef.current) {
        const target = stashedTargetRef.current;
        stashedTargetRef.current = null;
        requestAnimationFrame(() => apply(target));
      }
    });
  }, [editorRootRef, apply]);

  useLayoutEffect(() => {
    if (pendingFocusTarget === null) return;
    if (pendingFocusTarget === prevTargetRef.current) return;
    if (isFormFieldFocused(editorRootRef.current)) {
      prevTargetRef.current = pendingFocusTarget;
      setPendingFocusTarget(null);
      return;
    }
    if (overlaysOpenRef.current > 0) {
      stashedTargetRef.current = pendingFocusTarget;
      prevTargetRef.current = pendingFocusTarget;
      setPendingFocusTarget(null);
      return;
    }
    apply(pendingFocusTarget);
  }, [pendingFocusTarget, editorRootRef, setPendingFocusTarget, apply]);
};
