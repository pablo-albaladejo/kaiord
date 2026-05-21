import { useEffect } from "react";

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
 */
export function ScratchEditorSurface() {
  const currentWorkout = useCurrentWorkout();
  const createEmpty = useCreateEmptyWorkout();
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { handleStepSelect } = useAppHandlers();
  const sidebarData = useCoachingSidebar(null, undefined);

  useEffect(() => {
    if (currentWorkout !== null) return;
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
            startInEditMode
          />
        </EditorBody>
      )}
    </div>
  );
}
