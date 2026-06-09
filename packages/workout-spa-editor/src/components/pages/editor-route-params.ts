import type { BackOrigin } from "../../routing/back-origin";
import { parseBackOrigin } from "../../routing/back-origin";
import type { NewWorkoutMode } from "./render-new-workout-surface";
import { deriveNewWorkoutMode } from "./render-new-workout-surface";

export type EditorRouteParams = {
  dateParam: string | null;
  weekParam: string | null;
  origin: BackOrigin | null;
  newWorkoutMode: NewWorkoutMode | undefined;
  /** Composite coaching id (`${profileId}:${source}:${sourceId}`) when
      `/workout/new?coaching=` opens a store-only coaching draft. */
  coachingDraftId: string | null;
};

/** Parse the editor route's query contract (`date`, `week`, `from`,
    `source`/`action`, `coaching`) from a raw search string. */
export function parseEditorRouteParams(search: string): EditorRouteParams {
  const params = new URLSearchParams(search);
  return {
    dateParam: params.get("date"),
    weekParam: params.get("week"),
    origin: parseBackOrigin(params.get("from")),
    newWorkoutMode: deriveNewWorkoutMode(search),
    coachingDraftId: params.get("coaching"),
  };
}
