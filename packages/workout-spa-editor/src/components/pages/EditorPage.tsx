/**
 * EditorPage — dispatches the `/workout/{id?}` route. When `id` is set
 * it loads the workout from Dexie and shows workflow actions; otherwise
 * `?source=scratch` / `?action=import` mounts the matching new-workout
 * surface, with fallback to the populated `EditorBody`. Coaching-derived
 * workouts mount the `CoachingSidebar` (design D4).
 */

import type { Workout } from "../../types/krd";
import { EditorStateRibbon } from "../organisms/EditorStateRibbon";
import { CoachingDraftSurface } from "./CoachingDraftSurface";
import { DateBanner } from "./DateBanner";
import {
  EditorLoading,
  EditorNoData,
  EditorNotFound,
} from "./EditorLoadingState";
import { EditorPageHeader } from "./EditorPageHeader";
import { EditorPopulatedBody } from "./EditorPopulatedBody";
import { EditorSaveChanges } from "./EditorSaveChanges";
import { renderNewWorkoutSurface } from "./render-new-workout-surface";
import { useEditorPage } from "./use-editor-page";

export type EditorPageProps = { id?: string };

export default function EditorPage({ id }: EditorPageProps) {
  const page = useEditorPage(id);
  const { currentWorkout, profileId, sidebarData, handleBack } = page;
  const { dateParam, newWorkoutMode, coachingDraftId } = page.route;
  const { record, placementRow, loading, notFound, ...edit } = page.edit;

  const workout = currentWorkout?.extensions?.structured_workout as
    Workout | undefined;

  if (id && loading) return <EditorLoading />;
  if (id && notFound) return <EditorNotFound />;
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
        action={record?.krd && <EditorSaveChanges edits={edit.edits} />}
      />
      {!id && dateParam && <DateBanner date={dateParam} />}
      {record && (
        <EditorStateRibbon
          state={record.state}
          recordId={record.id}
          placementRow={placementRow}
          workoutDate={record.date}
          profileId={profileId ?? undefined}
          onSent={(garminWorkoutId) => void edit.pushWorkout(garminWorkoutId)}
        />
      )}
      {showNewSurface && renderNewWorkoutSurface(newWorkoutMode, dateParam)}
      {showPopulatedBody && workout && currentWorkout && (
        <EditorPopulatedBody
          workout={workout}
          currentWorkout={currentWorkout}
          sidebar={sidebarData}
          ownerProfileId={record?.profileId}
          editDiscard={edit.editDiscard}
        />
      )}
    </div>
  );
}
