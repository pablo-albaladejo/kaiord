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
 * When entered with `?source=template-picker&date=YYYY-MM-DD`, the
 * schedule click bypasses the explicit `ScheduleDateDialog` and
 * dispatches `scheduleTemplate` directly with the URL's date. Invalid
 * or absent `?date=` uses the explicit dialog flow — see
 * `useLibrarySchedule` for the branch.
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
import { useTranslate } from "../../i18n/use-translate";
import { withOrigin } from "../../routing/with-origin";
import { useCurrentWorkout, useLoadWorkout } from "../../store/selectors";
import type { WorkoutTemplate } from "../../types/workout-library";
import { ScheduleDateDialog } from "../molecules/ScheduleDateDialog";
import { LibraryContent } from "./Library/LibraryContent";
import { LibraryHeader } from "./Library/LibraryHeader";
import { useLibrarySchedule } from "./use-library-schedule";
import { useScheduleTemplate } from "./use-schedule-template";

export default function LibraryPage() {
  const t = useTranslate("library");
  const templates = useLibraryTemplatesLive();
  const persistence = usePersistence();
  const { error: showError, success: showSuccess } = useToastContext();
  const { scheduling, openScheduler, closeScheduler, confirmSchedule } =
    useScheduleTemplate();
  const handleSchedule = useLibrarySchedule(openScheduler);
  const currentWorkout = useCurrentWorkout();
  const loadWorkout = useLoadWorkout();
  const [, navigate] = useLocation();
  const hasCurrentWorkout = currentWorkout !== null;

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(persistence, id);
    } catch (err) {
      showError(
        t("toast.deleteFailed"),
        err instanceof Error ? err.message : t("toast.deleteFailedDescription"),
        { duration: 5000 }
      );
    }
  };

  const handleLoad = (template: WorkoutTemplate) => {
    loadWorkout(template.krd);
    // Toast confirms the load so the user does not land on the
    // editor's welcome screen wondering whether anything happened.
    // Title is a static literal (PII guard R-PIIInterpolation);
    // template.name flows through the description field which the
    // guard intentionally does not constrain.
    showSuccess(t("toast.templateLoaded"), template.name, { duration: 3000 });
    // SPA navigation (no full reload) so the freshly-loaded workout
    // survives the route transition. Hard reload would drop Zustand.
    // `?source=scratch` mounts the editor directly with the
    // workout that's now in the store.
    navigate(withOrigin("/workout/new?source=scratch", "library"));
  };

  return (
    <div className="space-y-4 p-4" data-testid="library-page">
      {/* Render the route heading once (a stable element) so the focus
          set by useFocusOnRouteChange survives the loading→loaded swap;
          a per-branch header would unmount and drop focus to <body>. */}
      <LibraryHeader count={templates?.length ?? 0} />
      {templates === undefined ? (
        <div className="flex items-center justify-center p-8 text-slate-400">
          {t("page.loading")}
        </div>
      ) : (
        <>
          <LibraryContent
            templates={templates}
            hasCurrentWorkout={hasCurrentWorkout}
            onDelete={handleDelete}
            onSchedule={handleSchedule}
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
