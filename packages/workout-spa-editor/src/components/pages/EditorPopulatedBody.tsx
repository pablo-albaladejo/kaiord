/**
 * The populated editor body (sidebar + step list) for `EditorPage`. Lives
 * in its own file so `EditorPage` stays under the per-function line cap.
 */
import { useAppHandlers } from "../../hooks/use-app-handlers";
import { useWorkoutStore } from "../../store/workout-store";
import type { KRD, Workout } from "../../types/krd";
import type { useCoachingSidebar } from "../organisms/CoachingSidebar/use-coaching-sidebar";
import { EditorBody } from "./EditorBody";
import { WorkoutSection } from "./WorkoutSection/WorkoutSection";

export type EditorPopulatedBodyProps = {
  workout: Workout;
  currentWorkout: KRD;
  sidebar: ReturnType<typeof useCoachingSidebar>;
};

export function EditorPopulatedBody({
  workout,
  currentWorkout,
  sidebar,
}: EditorPopulatedBodyProps) {
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { handleStepSelect } = useAppHandlers();

  return (
    <EditorBody sidebar={sidebar}>
      <WorkoutSection
        workout={workout}
        krd={currentWorkout}
        selectedStepId={selectedStepId}
        onStepSelect={handleStepSelect}
        onStepReorder={reorderStep}
        onReorderStepsInBlock={reorderStepsInBlock}
      />
    </EditorBody>
  );
}
