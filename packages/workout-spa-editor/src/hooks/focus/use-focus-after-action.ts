import type { RefObject } from "react";
import { useCallback, useContext, useLayoutEffect, useRef } from "react";

import { FocusRegistryContext } from "../../contexts/focus-registry-context";
import { useFocusTelemetry } from "../../contexts/focus-telemetry-context";
import type { FocusTarget } from "../../store/focus/focus-target.types";
import { useWorkoutStore } from "../../store/workout-store";
import { applyFocusTarget } from "./apply-focus-target";
import { isFormFieldFocused } from "./is-form-field-focused";
import {
  emitCanaryIfFirst,
  emitFormFieldShortCircuit,
} from "./use-focus-telemetry-emitter";
import { useOverlayFocusStash } from "./use-overlay-focus-stash";

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
  const telemetry = useFocusTelemetry();
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const prevTargetRef = useRef<FocusTarget | null>(null);
  const overlaysOpenRef = useRef(0);
  const stashedTargetRef = useRef<FocusTarget | null>(null);
  const stashStartRef = useRef<number>(0);
  const lastFormFieldEmitRef = useRef<number>(0);

  const apply = useCallback(
    (target: FocusTarget) =>
      applyFocusTarget(target, {
        getItem,
        emptyStateButton: emptyStateButtonRef.current,
        editorHeading: editorHeadingRef.current,
        setPendingFocusTarget,
        telemetry: telemetryRef.current,
        onApplied: (t) => {
          prevTargetRef.current = t;
        },
      }),
    [getItem, emptyStateButtonRef, editorHeadingRef, setPendingFocusTarget]
  );

  useLayoutEffect(() => {
    emitCanaryIfFirst(telemetryRef.current);
  }, []);

  useOverlayFocusStash({
    editorRootRef,
    overlaysOpenRef,
    stashedTargetRef,
    stashStartRef,
    telemetryRef,
    apply,
  });

  useLayoutEffect(() => {
    if (pendingFocusTarget === null) return;
    if (pendingFocusTarget === prevTargetRef.current) return;
    if (isFormFieldFocused(editorRootRef.current)) {
      prevTargetRef.current = pendingFocusTarget;
      setPendingFocusTarget(null);
      emitFormFieldShortCircuit(telemetryRef.current, lastFormFieldEmitRef);
      return;
    }
    if (overlaysOpenRef.current > 0) {
      stashedTargetRef.current = pendingFocusTarget;
      stashStartRef.current = performance.now();
      prevTargetRef.current = pendingFocusTarget;
      setPendingFocusTarget(null);
      return;
    }
    apply(pendingFocusTarget);
  }, [pendingFocusTarget, editorRootRef, setPendingFocusTarget, apply]);
};
