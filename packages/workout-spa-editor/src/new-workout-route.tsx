import { useLocation, useSearch } from "wouter";

import { CreateWorkout, EditorPage } from "./lazy-pages";

/**
 * Dispatches `/workout/new`: the import/scratch query params open the editor
 * directly; otherwise the AI Create overlay is shown.
 */
export function NewWorkoutRoute() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const hasAction = params.get("action") === "import";
  const hasSource = params.get("source") === "scratch";
  if (hasAction || hasSource) return <EditorPage />;
  return <CreateWorkout onClose={() => navigate("/calendar")} />;
}
