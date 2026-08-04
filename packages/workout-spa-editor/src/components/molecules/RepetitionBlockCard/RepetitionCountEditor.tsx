import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";

type RepetitionCountEditorProps = {
  isEditing: boolean;
  editValue: string;
  onEditClick: () => void;
  onSaveCount: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const RepetitionCountEditor = ({
  isEditing,
  editValue,
  onEditClick,
  onSaveCount,
  onCancelEdit,
  onEditValueChange,
  onKeyDown,
}: RepetitionCountEditorProps) => {
  const t = useTranslate("editor");

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="1"
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-20"
          aria-label={t("block.countAria")}
          autoFocus
          data-testid="repeat-count-input"
        />
        <Button
          size="sm"
          variant="primary"
          onClick={onSaveCount}
          data-testid="save-count-button"
        >
          {t("stepEditor.save")}
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          onClick={onCancelEdit}
          data-testid="cancel-count-button"
        >
          {t("stepEditor.cancel")}
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={onEditClick}
      className="rounded px-2 py-1 text-sm font-medium text-ink-muted transition-colors hover:bg-[var(--bg-sunken)] hover:text-ink-strong motion-reduce:transition-none"
      aria-label={t("block.editCount")}
      data-testid="edit-count-button"
    >
      {t("block.editCount")}
    </button>
  );
};
