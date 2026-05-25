import { TREND_RANGES, type TrendRangeDays } from "./trend-metrics";

export type TrendRangeSelectorProps = {
  selected: TrendRangeDays;
  onSelect: (days: TrendRangeDays) => void;
};

const baseClass = "rounded-md border px-3 py-1 text-sm transition-colors";
const onClass = "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950";
const offClass =
  "border-gray-300 text-gray-600 dark:border-slate-700 dark:text-gray-400";

export const TrendRangeSelector = ({
  selected,
  onSelect,
}: TrendRangeSelectorProps) => (
  <div
    role="radiogroup"
    aria-label="Date range"
    className="flex gap-2"
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
          {r.label}
        </button>
      );
    })}
  </div>
);
