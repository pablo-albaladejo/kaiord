import { useTranslate } from "../../i18n/use-translate";
import { Button } from "../atoms/Button";

export type EditorSaveChangesProps = {
  edits: { isDirty: boolean; saving: boolean; save: () => Promise<void> };
};

/** "Save changes" for a scheduled workout, enabled while the draft is dirty. */
export function EditorSaveChanges({ edits }: EditorSaveChangesProps) {
  const t = useTranslate("editor");
  const { isDirty, saving } = edits;
  return (
    <div className="ml-auto flex items-center gap-2">
      {isDirty && (
        <span className="text-xs text-ink-muted" data-testid="editor-unsaved">
          {t("edits.unsaved")}
        </span>
      )}
      <Button
        size="sm"
        onClick={() => void edits.save()}
        disabled={!isDirty}
        loading={saving}
        data-testid="editor-save-button"
      >
        {t("edits.save")}
      </Button>
    </div>
  );
}
