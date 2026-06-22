import {
  ENERGY_TREND_RANGES,
  type EnergyTrendRangeDays,
} from "./energy-trend-range";

export type EnergyTrendRangeSelectorProps = {
  selected: EnergyTrendRangeDays;
  onSelect: (days: EnergyTrendRangeDays) => void;
};

const base = "rounded-md border px-2.5 py-1 text-[12px] transition-colors";
const on = "border-blue-500 bg-blue-950 text-blue-300";
const off = "border-slate-700 text-slate-400";

export function EnergyTrendRangeSelector({
  selected,
  onSelect,
}: EnergyTrendRangeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Trend range"
      className="flex gap-2"
      data-testid="energy-trend-range-select"
    >
      {ENERGY_TREND_RANGES.map((r) => {
        const isOn = r.days === selected;
        return (
          <button
            key={r.days}
            type="button"
            role="radio"
            aria-checked={isOn}
            onClick={() => onSelect(r.days)}
            className={`${base} ${isOn ? on : off}`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
