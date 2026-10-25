import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { weekdayDate } from "../../../utils/calendar-day-labels";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { sportLabel } from "../../molecules/WorkoutCard/workout-card-labels";
import type { SameSportPending } from "./use-same-sport-gate";

export type SameSportPromptProps = {
  pending: SameSportPending | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SameSportPrompt({
  pending,
  onConfirm,
  onCancel,
}: SameSportPromptProps) {
  const t = useTranslate("calendar");
  const locale = useActiveLocale();
  const values = pending && {
    sport: sportLabel(t, pending.sport),
    day: weekdayDate(pending.day, locale),
  };
  const key = pending?.recording
    ? "sameSport.messageRecording"
    : "sameSport.message";
  return (
    <ConfirmationModal
      isOpen={pending !== null}
      title={t("sameSport.title")}
      message={values ? t(key, values) : ""}
      confirmLabel={t("sameSport.confirm")}
      cancelLabel={t("sameSport.cancel")}
      variant="default"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
