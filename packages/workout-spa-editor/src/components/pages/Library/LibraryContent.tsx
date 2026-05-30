import { useMemo, useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { filterTemplates, type SportFilter } from "./library-filter";
import { LibraryEmpty } from "./LibraryEmpty";
import { LibraryHeader } from "./LibraryHeader";
import { LibraryListRow } from "./LibraryListRow";
import { LibrarySearchField } from "./LibrarySearchField";
import { LibrarySportChips } from "./LibrarySportChips";

export type LibraryContentProps = {
  templates: WorkoutTemplate[];
  hasCurrentWorkout: boolean;
  onLoad: (template: WorkoutTemplate) => void;
  onSchedule: (template: WorkoutTemplate) => void;
  onDelete: (id: string) => void;
};

export function LibraryContent({
  templates,
  hasCurrentWorkout,
  onLoad,
  onSchedule,
  onDelete,
}: LibraryContentProps) {
  const profile = useActiveProfileLive()?.profile ?? null;
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState<SportFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<WorkoutTemplate | null>(
    null
  );

  const filtered = useMemo(
    () => filterTemplates(templates, query, sport),
    [templates, query, sport]
  );
  const isFiltered = query.trim() !== "" || sport !== "all";

  const confirmDelete = () => {
    if (deleteTarget) onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <LibraryHeader count={templates.length} />
      <LibrarySearchField value={query} onChange={setQuery} />
      <LibrarySportChips active={sport} onChange={setSport} />
      {filtered.length === 0 ? (
        <LibraryEmpty isFiltered={isFiltered} />
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <LibraryListRow
              key={t.id}
              template={t}
              profile={profile}
              hasCurrentWorkout={hasCurrentWorkout}
              onLoad={() => onLoad(t)}
              onSchedule={() => onSchedule(t)}
              onDelete={() => setDeleteTarget(t)}
            />
          ))}
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteTarget !== null}
        title="Delete Workout"
        message={`Delete "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
