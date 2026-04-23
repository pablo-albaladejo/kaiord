/**
 * `useWorkoutSectionFocus` — creates the three fallback refs wired
 * into `useFocusAfterAction` (§7) and mounts the hook. Kept separate
 * from `WorkoutSection` so the component file stays under the 80-line
 * limit.
 */

import { useRef } from "react";

import { useFocusAfterAction } from "../../../hooks/focus/use-focus-after-action";

export const useWorkoutSectionFocus = () => {
  const editorRootRef = useRef<HTMLDivElement | null>(null);
  const addStepButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  useFocusAfterAction({
    editorRootRef,
    emptyStateButtonRef: addStepButtonRef,
    editorHeadingRef: titleRef,
  });

  return { editorRootRef, addStepButtonRef, titleRef };
};
