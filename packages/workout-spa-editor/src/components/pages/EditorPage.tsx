/**
 * EditorPage - Workout editor route component.
 *
 * Wraps existing WelcomeSection/WorkoutSection with route params.
 * Accepts optional `id` from route and `date` query param.
 */
import { lazy, Suspense } from "react";

import { useSettingsDialog } from "../../contexts";
import { useAppHandlers } from "../../hooks/useAppHandlers";
import { useDeleteCleanup } from "../../hooks/useDeleteCleanup";
import { useWorkoutStore } from "../../store/workout-store";
import type { Workout } from "../../types/krd";
import { WelcomeSection } from "./WelcomeSection";
import { WorkoutSection } from "./WorkoutSection/WorkoutSection";

const AiWorkoutInput = lazy(() =>
  import("../organisms/AiWorkoutInput/AiWorkoutInput").then((m) => ({
    default: m.AiWorkoutInput,
  }))
);

export type EditorPageProps = {
  id?: string;
};

export default function EditorPage(_: EditorPageProps) {
  void _; // id param will be wired to Dexie loading in Wave 12
  useDeleteCleanup();
  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { show: settingsShow } = useSettingsDialog();
  const {
    handleFileLoad,
    handleFileError,
    handleStepSelect,
    handleCreateWorkout,
  } = useAppHandlers();

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <AiWorkoutInput onSettingsClick={settingsShow} />
      </Suspense>
      {!workout && (
        <WelcomeSection
          onFileLoad={handleFileLoad}
          onFileError={handleFileError}
          onCreateWorkout={handleCreateWorkout}
        />
      )}
      {workout && currentWorkout && (
        <WorkoutSection
          workout={workout}
          krd={currentWorkout}
          selectedStepId={selectedStepId}
          onStepSelect={handleStepSelect}
          onStepReorder={reorderStep}
          onReorderStepsInBlock={reorderStepsInBlock}
        />
      )}
    </div>
  );
}
