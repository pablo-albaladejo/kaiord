/**
 * LibraryPage - Routed page for workout library.
 *
 * Reads templates via `useLibraryTemplatesLive` (Dexie + useLiveQuery)
 * and dispatches deletes through the `deleteTemplate` application use
 * case via `usePersistence()`. Errors surface through the toast context.
 *
 * Surface contract: this page is the canonical Library destination
 * (`/library` route). The "Load into editor" CTA per card is gated on
 * the editor having an active workout — it preserves the workflow
 * the deleted header-modal previously offered. After loading a
 * template the user is navigated back to `/workout/new` via wouter
 * (SPA navigation) so the in-memory editor state is preserved; a hard
 * reload would drop the just-loaded workout from Zustand.
 *
 * The `<h1>` marked with `[data-route-heading]` is rendered eagerly
 * (even while templates load) so the `useFocusOnRouteChange` hook
 * finds it on the post-paint rAF; otherwise focus would fall back to
 * `document.body` and stay on the click-source button on entry.
 */

import { useLocation } from "wouter";

import { deleteTemplate } from "../../application/library/delete-template";
import { usePersistence } from "../../contexts/persistence-context";
import { useToastContext } from "../../contexts/ToastContext";
import { useLibraryTemplatesLive } from "../../hooks/use-library-templates-live";
import { useCurrentWorkout, useLoadWorkout } from "../../store/selectors";
import type { WorkoutTemplate } from "../../types/workout-library";
import { ScheduleDateDialog } from "../molecules/ScheduleDateDialog";
import { LibraryPageContent } from "./LibraryPageContent";
import { LibraryPageHeader } from "./LibraryPageHeader";
import { useScheduleTemplate } from "./use-schedule-template";

export default function LibraryPage() {
  const templates = useLibraryTemplatesLive();
  const persistence = usePersistence();
  const { error: showError } = useToastContext();
  const { scheduling, openScheduler, closeScheduler, confirmSchedule } =
    useScheduleTemplate();
  const currentWorkout = useCurrentWorkout();
  const loadWorkout = useLoadWorkout();
  const [, navigate] = useLocation();
  const hasCurrentWorkout = currentWorkout !== null;

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(persistence, id);
    } catch (err) {
      showError(
        "Delete Failed",
        err instanceof Error ? err.message : "Failed to delete template",
        { duration: 5000 }
      );
    }
  };

  const handleLoad = (template: WorkoutTemplate) => {
    loadWorkout(template.krd);
    // SPA navigation (no full reload) so the freshly-loaded workout
    // survives the route transition. Hard reload would drop Zustand.
    navigate("/workout/new");
  };

  return (
    <div className="space-y-4 p-4" data-testid="library-page">
      <LibraryPageHeader />
      {templates === undefined ? (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          Loading library...
        </div>
      ) : (
        <>
          <LibraryPageContent
            templates={templates}
            hasCurrentWorkout={hasCurrentWorkout}
            onDelete={handleDelete}
            onSchedule={openScheduler}
            onLoad={handleLoad}
          />
          <ScheduleDateDialog
            open={scheduling !== null}
            templateName={scheduling?.name ?? ""}
            onConfirm={confirmSchedule}
            onCancel={closeScheduler}
          />
        </>
      )}
    </div>
  );
}
