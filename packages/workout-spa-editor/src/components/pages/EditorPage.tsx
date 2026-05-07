/**
 * EditorPage - Workout editor route component.
 *
 * When `id` is provided, loads the workout from Dexie and shows
 * workflow actions (accept, push, re-push). Otherwise shows the
 * standard editor with file upload / AI input.
 *
 * For coaching-derived workouts (`session_match` row exists with a
 * coaching source per design D4), `EditorBody` renders a
 * `CoachingSidebar` to the right of the step editor so the user can
 * read the original prescription while building or refining the
 * structured workout.
 */

import { useSearch } from "wouter";

import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useAppHandlers } from "../../hooks/useAppHandlers";
import { useDeleteCleanup } from "../../hooks/useDeleteCleanup";
import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import { useWorkoutStore } from "../../store/workout-store";
import type { Workout } from "../../types/krd";
import { useCoachingSidebar } from "../organisms/CoachingSidebar/use-coaching-sidebar";
import { DateBanner } from "./DateBanner";
import { EditorBody } from "./EditorBody";
import { EditorLoading, EditorNoData } from "./EditorLoadingState";
import { EditorNewWorkout } from "./EditorNewWorkout";
import { EditorWorkflowBar } from "./EditorWorkflowBar";
import { useEditorActions } from "./use-editor-actions";
import { useWorkoutRecord } from "./use-workout-record";
import { WorkoutSection } from "./WorkoutSection/WorkoutSection";

export type EditorPageProps = { id?: string };

export default function EditorPage({ id }: EditorPageProps) {
  useDeleteCleanup();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const dateParam = params.get("date");

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

  return (
    <div className="space-y-6">
      <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }} className="sr-only">
        {id ? "Edit workout" : "New workout"}
      </h1>
      {!id && dateParam && <DateBanner date={dateParam} />}
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
