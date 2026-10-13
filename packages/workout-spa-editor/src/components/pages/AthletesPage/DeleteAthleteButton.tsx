import { Trash2 } from "lucide-react";
import { useId } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";

type DeleteAthleteButtonProps = {
  name: string;
  isOnly: boolean;
  onDelete: () => void;
};

/* The only athlete can't be deleted. The button stays focusable
   (aria-disabled) and says why in a visible line it is described by,
   rather than in a hover-only tooltip. */
export function DeleteAthleteButton({
  name,
  isOnly,
  onDelete,
}: DeleteAthleteButtonProps) {
  const t = useTranslate("athlete");
  const hintId = useId();
  return (
    <>
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => !isOnly && onDelete()}
        aria-disabled={isOnly || undefined}
        aria-describedby={isOnly ? hintId : undefined}
        className={isOnly ? "cursor-not-allowed opacity-50" : undefined}
        aria-label={t("athletes.delete", { name })}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
      {isOnly && (
        <p id={hintId} className="m-0 basis-full text-[12px] text-ink-muted">
          {t("athletes.deleteOnly")}
        </p>
      )}
    </>
  );
}
