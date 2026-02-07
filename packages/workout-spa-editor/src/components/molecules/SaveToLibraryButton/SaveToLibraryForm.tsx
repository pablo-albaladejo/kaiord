/**
 * Save To Library Form
 *
 * Form fields for saving workout to library.
 */

import { DifficultySelect } from "./components/DifficultySelect";
import { NotesTextarea } from "./components/NotesTextarea";
import { TagsInput } from "./components/TagsInput";
import { WorkoutNameInput } from "./components/WorkoutNameInput";
import type { DifficultyLevel } from "../../../types/workout-library";

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
      <WorkoutNameInput
        value={name}
        onChange={onNameChange}
        disabled={disabled}
      />
      <TagsInput value={tags} onChange={onTagsChange} disabled={disabled} />
      <DifficultySelect
        value={difficulty}
        onChange={onDifficultyChange}
        disabled={disabled}
      />
      <NotesTextarea
        value={notes}
        onChange={onNotesChange}
        disabled={disabled}
      />
    </div>
  );
}
