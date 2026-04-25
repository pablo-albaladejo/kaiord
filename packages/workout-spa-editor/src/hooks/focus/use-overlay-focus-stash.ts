import type { RefObject } from "react";
import { useEffect } from "react";

import { subscribeToOverlayCount } from "../../lib/focus/overlay-observer";
import type { FocusTarget } from "../../store/focus/focus-target.types";
import type { FocusTelemetry } from "../../store/providers/focus-telemetry";
import { emitOverlayDeferredApply } from "./use-focus-telemetry-emitter";

type OverlayFocusStashOptions = {
  editorRootRef: RefObject<HTMLElement | null>;
  overlaysOpenRef: RefObject<number>;
  stashedTargetRef: RefObject<FocusTarget | null>;
  stashStartRef: RefObject<number>;
  telemetryRef: RefObject<FocusTelemetry>;
  apply: (target: FocusTarget) => void;
};

export const useOverlayFocusStash = ({
  editorRootRef,
  overlaysOpenRef,
  stashedTargetRef,
  stashStartRef,
  telemetryRef,
  apply,
}: OverlayFocusStashOptions): void => {
  useEffect(() => {
    const root = editorRootRef.current;
    if (!root) return;
    return subscribeToOverlayCount(root, (count) => {
      const wasOpen = overlaysOpenRef.current > 0;
      overlaysOpenRef.current = count;
      if (wasOpen && count === 0 && stashedTargetRef.current) {
        const target = stashedTargetRef.current;
        const startMs = stashStartRef.current;
        stashedTargetRef.current = null;
        requestAnimationFrame(() => {
          if (overlaysOpenRef.current > 0) {
            stashedTargetRef.current = target;
            return;
          }
          emitOverlayDeferredApply(telemetryRef.current, startMs);
          apply(target);
        });
      }
    });
  }, [
    editorRootRef,
    overlaysOpenRef,
    stashedTargetRef,
    stashStartRef,
    telemetryRef,
    apply,
  ]);
};
