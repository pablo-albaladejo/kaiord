/**
 * Save To Library Form
 *
 * Form fields for saving workout to library.
 */

import type { DifficultyLevel } from "../../../types/workout-library";
import { Input } from "../../atoms/Input/Input";

type SaveToLibraryFormProps = {
  name: string;
  onNameChange: (value: string) => void;
  tags: string;
  onTagsChange: (value: string) => void;
  difficulty: DifficultyLevel | "";
  onDifficultyChange: (value: DifficultyLevel | "") => void;
  notes: string;
  onNotesChange: (value: string) => void;
  disabled: boolean;
};

export function SaveToLibraryForm({
  name,
  onNameChange,
  tags,
  onTagsChange,
  difficulty,
  onDifficultyChange,
  notes,
  onNotesChange,
  disabled,
}: SaveToLibraryFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="workout-name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Workout Name *
        </label>
        <Input
          id="workout-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Sweet Spot Intervals"
          maxLength={200}
          disabled={disabled}
        />
      </div>

      <div>
        <label
          htmlFor="workout-tags"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Tags (comma-separated)
        </label>
        <Input
          id="workout-tags"
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="e.g., intervals, endurance"
          disabled={disabled}
        />
      </div>

      <div>
        <label
          htmlFor="workout-difficulty"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Difficulty
        </label>
        <select
          id="workout-difficulty"
          value={difficulty}
          onChange={(e) =>
            onDifficultyChange(e.target.value as DifficultyLevel | "")
          }
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          disabled={disabled}
        >
          <option value="">Select difficulty</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
          <option value="very_hard">Very Hard</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="workout-notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Notes
        </label>
        <textarea
          id="workout-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes about this workout..."
          maxLength={1000}
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {notes.length}/1000 characters
        </p>
      </div>
    </div>
  );
}
