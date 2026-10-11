import { useSearch } from "wouter";

import { useActiveProfileLive } from "../../hooks/use-active-profile-live";
import { useDeleteCleanup } from "../../hooks/use-delete-cleanup";
import { useWorkoutStore } from "../../store/workout-store";
import { useCoachingSidebar } from "../organisms/CoachingSidebar/use-coaching-sidebar";
import { parseEditorRouteParams } from "./editor-route-params";
import { useBackHandler } from "./use-back-handler";
import { useEditorEditMode } from "./use-editor-edit-mode";

/** Everything `EditorPage` reads: route params, the record, back, sidebar. */
export function useEditorPage(id: string | undefined) {
  useDeleteCleanup();
  const route = parseEditorRouteParams(useSearch());
  const { newWorkoutMode, dateParam, origin, weekParam } = route;
  const edit = useEditorEditMode(id);
  const handleBack = useBackHandler(
    newWorkoutMode,
    dateParam,
    origin,
    weekParam,
    { detailId: id, confirmLeave: id ? edit.confirmDiscard : undefined }
  );
  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);
  const profileId = useActiveProfileLive()?.id ?? null;
  const sidebarData = useCoachingSidebar(profileId, id);
  return { route, edit, handleBack, currentWorkout, profileId, sidebarData };
}
