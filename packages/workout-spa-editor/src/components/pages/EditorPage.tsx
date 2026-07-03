/**
 * EditorPage — dispatches the `/workout/{id?}` route. When `id` is set
 * it loads the workout from Dexie and shows workflow actions; otherwise
 * `?source=scratch` / `?action=import` mounts the matching new-workout
 * surface, with fallback to the populated `EditorBody`. Coaching-derived
 * workouts mount the `CoachingSidebar` (design D4).
 */

import { useSearch } from "wouter";

import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useDeleteCleanup } from "../../hooks/use-delete-cleanup";
import { useWorkoutStore } from "../../store/workout-store";
import type { Workout } from "../../types/krd";
import { useCoachingSidebar } from "../organisms/CoachingSidebar/use-coaching-sidebar";
import { CoachingDraftSurface } from "./CoachingDraftSurface";
import { DateBanner } from "./DateBanner";
import { parseEditorRouteParams } from "./editor-route-params";
import { EditorLoading, EditorNoData } from "./EditorLoadingState";
import { EditorPageHeader } from "./EditorPageHeader";
import { EditorPopulatedBody } from "./EditorPopulatedBody";
import { EditorWorkflowBar } from "./EditorWorkflowBar";
import { renderNewWorkoutSurface } from "./render-new-workout-surface";
import { useBackHandler } from "./use-back-handler";
import { useEditorActions } from "./use-editor-actions";
import { useWorkoutRecord } from "./use-workout-record";

export type EditorPageProps = { id?: string };

export default function EditorPage({ id }: EditorPageProps) {
  useDeleteCleanup();
  const search = useSearch();
  const { dateParam, weekParam, origin, newWorkoutMode, coachingDraftId } =
    parseEditorRouteParams(search);
  const handleBack = useBackHandler(
    newWorkoutMode,
    dateParam,
    origin,
    weekParam
  );

  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);

  const { record, loading } = useWorkoutRecord(id);
  const { acceptWorkout, pushWorkout } = useEditorActions(record);
  const profileId = useActiveProfileLive()?.id ?? null;
  const sidebarData = useCoachingSidebar(profileId, id);

  const workout = currentWorkout?.extensions?.structured_workout as
    Workout | undefined;

  if (id && loading) return <EditorLoading />;
  if (id && record && !record.krd) return <EditorNoData />;

  if (!id && coachingDraftId)
    return (
      <CoachingDraftSurface
        coachingDraftId={coachingDraftId}
        onBack={handleBack ?? undefined}
      />
    );

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
        <EditorPopulatedBody
          workout={workout}
          currentWorkout={currentWorkout}
          sidebar={sidebarData}
        />
      )}
    </div>
  );
}
