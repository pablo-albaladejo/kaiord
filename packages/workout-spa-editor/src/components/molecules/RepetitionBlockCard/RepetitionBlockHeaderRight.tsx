import { Trash2 } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { RepetitionBlock } from "../../../types/krd";
import { Tooltip } from "../../atoms/Tooltip";
import { RepetitionBlockContextMenu } from "./RepetitionBlockContextMenu";

type RepetitionBlockHeaderRightProps = {
  block: RepetitionBlock;
  onEditClick: () => void;
  onAddStep?: () => void;
  onUngroup?: () => void;
  onDelete?: () => void;
};

export const RepetitionBlockHeaderRight = ({
  block,
  onEditClick,
  onAddStep,
  onUngroup,
  onDelete,
}: RepetitionBlockHeaderRightProps) => {
  const t = useTranslate("editor");
  const count = block.steps.length;
  const deleteLabel = t("block.delete");

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-ink-muted">
        {t(count === 1 ? "block.steps_one" : "block.steps_other", { count })}
      </div>

      {onDelete && (
        <Tooltip content={deleteLabel} delayDuration={0}>
          <button
            onClick={onDelete}
            className="rounded p-1 text-ink-muted transition-colors hover:bg-[var(--danger-bg)] hover:text-[var(--danger-text)] motion-reduce:transition-none"
            aria-label={deleteLabel}
            data-testid="delete-block-button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </Tooltip>
      )}

      {(onAddStep || onUngroup || onDelete) && (
        <RepetitionBlockContextMenu
          onEditCount={onEditClick}
          onAddStep={onAddStep || (() => {})}
          onUngroup={onUngroup || (() => {})}
          onDelete={onDelete || (() => {})}
        />
      )}
    </div>
  );
};
