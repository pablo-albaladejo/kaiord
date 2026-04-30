/**
 * LibraryPage - Routed page for workout library.
 *
 * Reads templates via `useLibraryTemplatesLive` (Dexie + useLiveQuery)
 * and dispatches deletes through the `deleteTemplate` application use
 * case via `usePersistence()`. Errors surface through the toast context.
 */

import { deleteTemplate } from "../../application/library/delete-template";
import { usePersistence } from "../../contexts/persistence-context";
import { useToastContext } from "../../contexts/ToastContext";
import { useLibraryTemplatesLive } from "../../hooks/use-library-templates-live";
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

  if (templates === undefined) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Loading library...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4" data-testid="library-page">
      <LibraryPageHeader />
      <LibraryPageContent
        templates={templates}
        onDelete={handleDelete}
        onSchedule={openScheduler}
      />
      <ScheduleDateDialog
        open={scheduling !== null}
        templateName={scheduling?.name ?? ""}
        onConfirm={confirmSchedule}
        onCancel={closeScheduler}
      />
    </div>
  );
}
