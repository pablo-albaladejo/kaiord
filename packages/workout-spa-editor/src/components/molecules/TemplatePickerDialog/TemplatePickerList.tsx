/**
 * TemplatePickerList — narrow template list for the in-flow picker.
 *
 * Search-only; no delete/edit affordances (those belong on the
 * routed Library page per the surface-classification rule). Lazy-
 * loaded by TemplatePickerDialog so opening it does not pull this
 * chunk eagerly.
 */

import type { WorkoutTemplate } from "../../../types/workout-library";
import { Input } from "../../atoms/Input/Input";

type TemplatePickerListProps = {
  templates: WorkoutTemplate[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onPick: (templateId: string) => void;
};

export function TemplatePickerList({
  templates,
  isLoading,
  searchTerm,
  onSearchChange,
  onPick,
}: TemplatePickerListProps) {
  const filtered = filterBySearch(templates, searchTerm);
  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search templates..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search templates"
        className="w-full"
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading templates…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="picker-empty">
          {templates.length === 0
            ? "Your library is empty."
            : "No templates match your search."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onPick(t.id)}
                data-testid="picker-template-card"
                className="w-full rounded-md border border-gray-200 bg-white p-3 text-left text-sm hover:border-primary-500 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.sport}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function filterBySearch(
  templates: WorkoutTemplate[],
  searchTerm: string
): WorkoutTemplate[] {
  const q = searchTerm.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.sport.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
  );
}
