/**
 * LibraryPage - Routed page for workout library.
 *
 * Uses useLiveQuery for Dexie-backed templates.
 * Supports search, filter, delete, and schedule actions.
 */

import { db } from "../../adapters/dexie/dexie-database";
import { ScheduleDateDialog } from "../molecules/ScheduleDateDialog";
import { useLibraryTemplates } from "./library-hooks";
import { LibraryPageContent } from "./LibraryPageContent";
import { LibraryPageHeader } from "./LibraryPageHeader";
import { useScheduleTemplate } from "./use-schedule-template";

export default function LibraryPage() {
  const templates = useLibraryTemplates();
  const { scheduling, openScheduler, closeScheduler, confirmSchedule } =
    useScheduleTemplate();

  const handleDelete = async (id: string) => {
    await db.table("templates").delete(id);
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
