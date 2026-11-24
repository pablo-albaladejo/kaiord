import type { UnansweredVerdict } from "../../../application/trainingpeaks/unanswered-send";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { weekdayDate } from "../../../utils/calendar-day-labels";
import { Button } from "../../atoms/Button";

type Block = Extract<UnansweredVerdict, { blocked: true }>;

const ERROR_CLASS = "text-xs text-[var(--danger-text)]";

const KEYS: Record<Block["reason"], string> = {
  "may-be-there": "footer.trainingPeaksUnanswered.mayBeThere",
  unchecked: "footer.trainingPeaksUnanswered.unchecked",
};

/** After a send that got no answer: the consequence, and "Send anyway". */
export const TrainingPeaksUnansweredNotice = ({
  block,
  onSendAnyway,
}: {
  block: Block;
  onSendAnyway: () => void;
}) => {
  const t = useTranslate("workout-detail");
  const locale = useActiveLocale();
  return (
    <>
      <span className={ERROR_CLASS} data-testid="trainingpeaks-unanswered">
        {t(KEYS[block.reason], { date: weekdayDate(block.date, locale) })}
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={onSendAnyway}
        data-testid="trainingpeaks-send-anyway-button"
      >
        {t("footer.trainingPeaksUnanswered.sendAnyway")}
      </Button>
    </>
  );
};
