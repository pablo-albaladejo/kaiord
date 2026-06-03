/**
 * EditorPage — dispatches the `/workout/{id?}` route. When `id` is set
 * it loads the workout from Dexie and shows workflow actions; otherwise
 * `?source=scratch` / `?action=import` mounts the matching new-workout
 * surface, with fallback to the populated `EditorBody`. Coaching-derived
 * workouts mount the `CoachingSidebar` (design D4).
 */

import { useSearch } from "wouter";

import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useAppHandlers } from "../../hooks/useAppHandlers";
import { useDeleteCleanup } from "../../hooks/useDeleteCleanup";
import { useWorkoutStore } from "../../store/workout-store";
import type { Workout } from "../../types/krd";
import { useCoachingSidebar } from "../organisms/CoachingSidebar/use-coaching-sidebar";
import { DateBanner } from "./DateBanner";
import { EditorBody } from "./EditorBody";
import { EditorLoading, EditorNoData } from "./EditorLoadingState";
import { EditorPageHeader } from "./EditorPageHeader";
import { EditorWorkflowBar } from "./EditorWorkflowBar";
import {
  deriveNewWorkoutMode,
  renderNewWorkoutSurface,
} from "./render-new-workout-surface";
import { useBackHandler } from "./use-back-handler";
import { useEditorActions } from "./use-editor-actions";
import { useWorkoutRecord } from "./use-workout-record";
import { WorkoutSection } from "./WorkoutSection/WorkoutSection";

export type EditorPageProps = { id?: string };

export default function EditorPage({ id }: EditorPageProps) {
  useDeleteCleanup();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const dateParam = params.get("date");
  const newWorkoutMode = deriveNewWorkoutMode(search);
  const handleBack = useBackHandler(newWorkoutMode, dateParam);

  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { handleStepSelect } = useAppHandlers();

  const { record, loading } = useWorkoutRecord(id);
  const { acceptWorkout, pushWorkout } = useEditorActions(record);
  const profileId = useActiveProfileLive()?.id ?? null;
  const sidebarData = useCoachingSidebar(profileId, id);

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  if (id && loading) return <EditorLoading />;
  if (id && record && !record.krd) return <EditorNoData />;

  const importComplete = newWorkoutMode === "import" && currentWorkout !== null;
  const showNewSurface = !id && newWorkoutMode !== undefined && !importComplete;
  const showPopulatedBody =
    id !== undefined || newWorkoutMode === undefined || importComplete;

  return (
    <div className="space-y-6">
      <EditorPageHeader
        mode={id ? "edit" : "new"}
        onBack={handleBack ?? undefined}
      />
      {!id && dateParam && <DateBanner date={dateParam} />}
      {record && (
        <EditorWorkflowBar
          state={record.state}
          onAccept={acceptWorkout}
          onPush={() => pushWorkout(`garmin-${Date.now()}`)}
          onRepush={() => pushWorkout(`garmin-${Date.now()}`)}
        />
      )}
      {showNewSurface && renderNewWorkoutSurface(newWorkoutMode, dateParam)}
      {showPopulatedBody && workout && currentWorkout && (
        <EditorBody sidebar={sidebarData}>
          <WorkoutSection
            workout={workout}
            krd={currentWorkout}
            selectedStepId={selectedStepId}
            onStepSelect={handleStepSelect}
            onStepReorder={reorderStep}
            onReorderStepsInBlock={reorderStepsInBlock}
          />
        </EditorBody>
      )}
    </div>
  );
}
