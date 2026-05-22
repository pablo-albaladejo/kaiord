import { useEffect, useRef } from "react";

import { useAppHandlers } from "../../../hooks/useAppHandlers";
import {
  useCreateEmptyWorkout,
  useCurrentWorkout,
} from "../../../store/selectors";
import { useWorkoutStore } from "../../../store/workout-store";
import type { Workout } from "../../../types/krd";
import { AiBanner } from "../../molecules/AiBanner/AiBanner";
import { useCoachingSidebar } from "../../organisms/CoachingSidebar/use-coaching-sidebar";
import { EditorBody } from "../../pages/EditorBody";
import { WorkoutSection } from "../../pages/WorkoutSection/WorkoutSection";

const DEFAULT_SCRATCH_SPORT = "cycling";
const DEFAULT_SCRATCH_NAME = "Untitled workout";

/**
 * Editor canvas for `/workout/new?source=scratch`.
 *
 * Composes the collapsed `AiBanner` above the editor body. The mount
 * effect seeds an empty in-memory workout via `createEmptyWorkout`
 * ONLY when `currentWorkout === null` — this guard prevents the
 * auto-init from overwriting a template just written by `LibraryPage`
 * before its `navigate("/workout/new?source=scratch")` (see plan A8).
 *
 * `startInEditMode` is wired to `autoCreatedRef`: only the auto-init
 * path opens `WorkoutHeader.MetadataEditMode` so a fresh scratch user
 * commits sport/name inline. Pre-populated workouts (library template
 * load, e2e seeds) already have sport/name and render in view mode.
 */
export function ScratchEditorSurface() {
  const currentWorkout = useCurrentWorkout();
  const createEmpty = useCreateEmptyWorkout();
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { handleStepSelect } = useAppHandlers();
  const sidebarData = useCoachingSidebar(null, undefined);
  const autoCreatedRef = useRef(false);

  useEffect(() => {
    if (currentWorkout !== null) return;
    autoCreatedRef.current = true;
    createEmpty(DEFAULT_SCRATCH_NAME, DEFAULT_SCRATCH_SPORT);
  }, [currentWorkout, createEmpty]);

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  return (
    <div className="space-y-6">
      <AiBanner />
      {workout && currentWorkout && (
        <EditorBody sidebar={sidebarData}>
          <WorkoutSection
            workout={workout}
            krd={currentWorkout}
            selectedStepId={selectedStepId}
            onStepSelect={handleStepSelect}
            onStepReorder={reorderStep}
            onReorderStepsInBlock={reorderStepsInBlock}
            startInEditMode={autoCreatedRef.current}
          />
        </EditorBody>
      )}
    </div>
  );
}
