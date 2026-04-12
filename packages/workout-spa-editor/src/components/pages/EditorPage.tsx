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

export default function EditorPage({ id }: EditorPageProps) {
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

  if (id) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">
          Direct workout loading coming soon.
        </p>
        <a href="/calendar" className="text-primary underline mt-2">
          Go to Calendar
        </a>
      </div>
    );
  }

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
