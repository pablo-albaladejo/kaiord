import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";

type RepetitionCountEditorProps = {
  repeatCount: number;
  isEditing: boolean;
  editValue: string;
  onEditClick: () => void;
  onSaveCount: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const RepetitionCountEditor = ({
  repeatCount,
  isEditing,
  editValue,
  onEditClick,
  onSaveCount,
  onCancelEdit,
  onEditValueChange,
  onKeyDown,
}: RepetitionCountEditorProps) => {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="2"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-20"
          autoFocus
          data-testid="repeat-count-input"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={onSaveCount}
          data-testid="save-count-button"
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancelEdit}
          data-testid="cancel-count-button"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={onEditClick}
      className="px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900 rounded transition-colors"
      data-testid="edit-count-button"
    >
      {repeatCount}x
    </button>
  );
};
