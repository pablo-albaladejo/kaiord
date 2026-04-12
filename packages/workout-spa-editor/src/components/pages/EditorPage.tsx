/**
 * EditorPage - Workout editor route component.
 *
 * When `id` is provided, loads the workout from Dexie and shows
 * workflow actions (accept, push, re-push). Otherwise shows the
 * standard editor with file upload / AI input.
 */

import { useAppHandlers } from "../../hooks/useAppHandlers";
import { useDeleteCleanup } from "../../hooks/useDeleteCleanup";
import { useWorkoutStore } from "../../store/workout-store";
import type { Workout } from "../../types/krd";
import { EditorLoading, EditorNoData } from "./EditorLoadingState";
import { EditorNewWorkout } from "./EditorNewWorkout";
import { EditorWorkflowBar } from "./EditorWorkflowBar";
import { useEditorActions } from "./use-editor-actions";
import { useWorkoutRecord } from "./use-workout-record";
import { WorkoutSection } from "./WorkoutSection/WorkoutSection";

export type EditorPageProps = { id?: string };

export default function EditorPage({ id }: EditorPageProps) {
  useDeleteCleanup();
  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { handleStepSelect } = useAppHandlers();

  const { record, loading } = useWorkoutRecord(id);
  const { acceptWorkout, pushWorkout } = useEditorActions(record);

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  if (id && loading) return <EditorLoading />;
  if (id && record && !record.krd) return <EditorNoData />;

  return (
    <div className="space-y-6">
      {record && (
        <EditorWorkflowBar
          state={record.state}
          onAccept={acceptWorkout}
          onPush={() => pushWorkout(`garmin-${Date.now()}`)}
          onRepush={() => pushWorkout(`garmin-${Date.now()}`)}
        />
      )}
      {!id && <EditorNewWorkout workout={workout} />}
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
