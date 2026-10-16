import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { shortWeekdayName } from "../../pages/calendar-day-labels";

export type DayColumnAddButtonProps = {
  date: string;
  onAddClick: (date: string) => void;
};

export function DayColumnAddButton({
  date,
  onAddClick,
}: DayColumnAddButtonProps) {
  const t = useTranslate("calendar");
  const day = `${shortWeekdayName(date, useActiveLocale())} ${Number(date.slice(8))}`;
  return (
    <button
      type="button"
      data-testid={`empty-day-${date}`}
      aria-label={t("weekList.addTo", { date: day })}
      className="mt-1 flex-1 rounded-lg border border-dashed border-edge text-xs text-ink-muted motion-safe:transition-colors hover:border-edge-strong hover:text-ink-strong"
      onClick={() => onAddClick(date)}
    >
      {t("weekList.add")}
    </button>
  );
}
