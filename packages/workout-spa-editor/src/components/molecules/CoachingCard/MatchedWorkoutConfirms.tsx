import type { RegenerateWarnings } from "../../../application/coaching/regenerate-warnings";
import { useTranslate } from "../../../i18n/use-translate";
import { ConfirmationModal } from "../ConfirmationModal";

export type MatchedWorkoutConfirmsProps = {
  open: "regenerate" | "delete" | null;
  warnings: RegenerateWarnings;
  /** The Workout is placed on Garmin: deleting here leaves it there. */
  onGarmin: boolean;
  onCancel: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
};

export function MatchedWorkoutConfirms(props: MatchedWorkoutConfirmsProps) {
  const t = useTranslate("coaching");
  const td = useTranslate("workout-detail");
  const regenerateMessage = [
    props.warnings.edited ? t("regenerate.edited") : null,
    props.warnings.onWatch ? t("regenerate.onWatch") : null,
  ]
    .filter((line): line is string => line !== null)
    .join(" ");
  return (
    <>
      <ConfirmationModal
        isOpen={props.open === "regenerate"}
        title={t("regenerate.title")}
        message={regenerateMessage}
        confirmLabel={t("regenerate.confirm")}
        cancelLabel={t("regenerate.cancel")}
        variant="default"
        onConfirm={props.onRegenerate}
        onCancel={props.onCancel}
      />
      <ConfirmationModal
        isOpen={props.open === "delete"}
        title={t("deleteWorkout.title")}
        message={
          props.onGarmin
            ? td("delete.messageGarmin")
            : t("deleteWorkout.message")
        }
        confirmLabel={t("deleteWorkout.confirm")}
        cancelLabel={t("deleteWorkout.cancel")}
        variant="destructive"
        onConfirm={props.onDelete}
        onCancel={props.onCancel}
      />
    </>
  );
}
