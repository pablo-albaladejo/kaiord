/**
 * SaveToLibraryDialog Component
 *
 * Dialog for saving workouts to the library with tags and notes.
 *
 * Requirements:
 * - Requirement 17.2: Allow adding tags and notes for organization
 * - Requirement 17.3: Generate thumbnail preview of the workout
 * - Requirement 17.5: Display success notification
 */

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";
import { useToastContext } from "../../../contexts/ToastContext";
import { useLibraryStore } from "../../../store/library-store";
import type { KRD } from "../../../types/krd";
import type { DifficultyLevel } from "../../../types/workout-library";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { generateThumbnail } from "./generate-thumbnail";

export type SaveToLibraryDialogProps = {
  workout: KRD;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SaveToLibraryDialog({
  workout,
  open,
  onOpenChange,
}: SaveToLibraryDialogProps) {
  const { addTemplate } = useLibraryStore();
  const { show } = useToastContext();

  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel | "">("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);

    try {
      // Generate thumbnail
      const thumbnailData = await generateThumbnail(workout);

      // Parse tags (comma-separated)
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Calculate duration from workout steps
      const duration = calculateWorkoutDuration(workout);

      // Get sport from workout
      const sport = workout.extensions?.workout?.sport || "cycling";

      // Add to library
      addTemplate(name.trim(), sport, workout, {
        tags: tagArray,
        difficulty: difficulty || undefined,
        duration,
        notes: notes.trim() || undefined,
        thumbnailData,
      });

      // Show success toast
      show({
        title: "Workout Saved",
        description: `"${name.trim()}" has been added to your library`,
        variant: "success",
        duration: 3000,
      });

      // Reset form and close dialog
      setName("");
      setTags("");
      setDifficulty("");
      setNotes("");
      onOpenChange(false);
    } catch (error) {
      show({
        title: "Save Failed",
        description:
          error instanceof Error ? error.message : "Failed to save workout",
        variant: "error",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
              Save to Library
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-primary-400 dark:data-[state=open]:bg-gray-800"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
            Add details to organize your workout in the library.
          </Dialog.Description>

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
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sweet Spot Intervals"
                maxLength={200}
                disabled={isSaving}
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
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., intervals, endurance, race-prep"
                disabled={isSaving}
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
                  setDifficulty(e.target.value as DifficultyLevel | "")
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
                disabled={isSaving}
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
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this workout..."
                maxLength={1000}
                rows={3}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
                disabled={isSaving}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {notes.length}/1000 characters
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button variant="secondary" disabled={isSaving}>
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Calculate total workout duration in seconds
 */
function calculateWorkoutDuration(workout: KRD): number | undefined {
  const steps = workout.extensions?.workout?.steps;
  if (!steps || steps.length === 0) return undefined;

  let totalSeconds = 0;

  for (const step of steps) {
    if ("repeatCount" in step) {
      // Repetition block
      const blockDuration = step.steps.reduce((sum, s) => {
        if (s.duration.type === "time") {
          return sum + s.duration.seconds;
        }
        return sum;
      }, 0);
      totalSeconds += blockDuration * step.repeatCount;
    } else if (step.duration.type === "time") {
      // Regular step with time duration
      totalSeconds += step.duration.seconds;
    }
  }

  return totalSeconds > 0 ? totalSeconds : undefined;
}
