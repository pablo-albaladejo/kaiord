import { type BackOrigin, parseBackOrigin } from "../../routing/back-origin";
import {
  deriveNewWorkoutMode,
  type NewWorkoutMode,
} from "./render-new-workout-surface";

export type EditorRouteParams = {
  dateParam: string | null;
  weekParam: string | null;
  origin: BackOrigin | null;
  newWorkoutMode: NewWorkoutMode | undefined;
};

/** Parse the editor route's query contract (`date`, `week`, `from`,
    `source`/`action`) from a raw search string. */
export function parseEditorRouteParams(search: string): EditorRouteParams {
  const params = new URLSearchParams(search);
  return {
    dateParam: params.get("date"),
    weekParam: params.get("week"),
    origin: parseBackOrigin(params.get("from")),
    newWorkoutMode: deriveNewWorkoutMode(search),
  };
}
