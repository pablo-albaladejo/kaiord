import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { ScheduleDateDialog } from "../../molecules/ScheduleDateDialog";

export type DetailDialog = "move" | "delete" | null;

export type WorkoutDetailDialogsProps = {
  record: WorkoutRecord;
  title: string;
  /** The workout sits on the Garmin calendar: deleting here leaves it there. */
  onGarmin: boolean;
  open: DetailDialog;
  onClose: () => void;
  onMove: (date: string) => void;
  onDelete: () => void;
};

export function WorkoutDetailDialogs(props: WorkoutDetailDialogsProps) {
  const { record, open, onClose } = props;
  const t = useTranslate("workout-detail");
  return (
    <>
      <ConfirmationModal
        isOpen={open === "delete"}
        title={t("delete.title")}
        message={
          props.onGarmin ? t("delete.messageGarmin") : t("delete.message")
        }
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("delete.cancel")}
        variant="destructive"
        onConfirm={props.onDelete}
        onCancel={onClose}
      />
      {open === "move" && (
        <ScheduleDateDialog
          open
          templateName={props.title}
          initialDate={record.date}
          copy={{
            title: t("move.title"),
            description: t("move.description"),
            confirm: t("move.confirm"),
            cancel: t("move.cancel"),
          }}
          onConfirm={props.onMove}
          onCancel={onClose}
        />
      )}
    </>
  );
}
