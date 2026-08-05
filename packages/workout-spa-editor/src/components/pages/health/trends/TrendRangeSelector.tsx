import { useTranslate } from "../../../../i18n/use-translate";
import { TREND_RANGES, type TrendRangeDays } from "./trend-metrics";

export type TrendRangeSelectorProps = {
  selected: TrendRangeDays;
  onSelect: (days: TrendRangeDays) => void;
};

// rounded-lg is the 8px control radius; rounded-xl the 12px field radius.
const baseClass =
  "rounded-lg px-3 py-1 text-sm font-medium tabular-nums transition-colors";
const onClass = "bg-accent text-surface";
const offClass = "text-ink-muted hover:text-ink-strong";

export const TrendRangeSelector = ({
  selected,
  onSelect,
}: TrendRangeSelectorProps) => {
  const t = useTranslate("health");
  return (
    <div
      role="radiogroup"
      aria-label={t("trends.rangeAria")}
      className="flex gap-1 self-start rounded-xl border border-edge bg-surface-deep p-1"
      data-testid="trend-range-select"
    >
      {TREND_RANGES.map((r) => {
        const isOn = r.days === selected;
        return (
          <button
            key={r.days}
            type="button"
            role="radio"
            aria-checked={isOn}
            onClick={() => onSelect(r.days)}
            className={`${baseClass} ${isOn ? onClass : offClass}`}
          >
            {t(r.labelKey)}
          </button>
        );
      })}
    </div>
  );
};
