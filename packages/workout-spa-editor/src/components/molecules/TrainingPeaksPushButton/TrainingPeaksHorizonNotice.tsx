import { isPastBasicHorizon } from "../../../application/trainingpeaks/trainingpeaks-planning-horizon";
import { useTranslate } from "../../../i18n/use-translate";

/** Said before sending: a day after tomorrow may be refused on Basic. */
export const TrainingPeaksHorizonNotice = ({ date }: { date?: string }) => {
  const t = useTranslate("workout-detail");
  if (date === undefined || !isPastBasicHorizon(date)) return null;
  return (
    <span
      className="text-xs text-ink-muted"
      data-testid="trainingpeaks-horizon-notice"
    >
      {t("footer.trainingPeaksHorizon.beforeSend")}
    </span>
  );
};
