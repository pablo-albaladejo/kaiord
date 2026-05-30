import { Icon, ICON_MAP } from "../../atoms/Icon";
import { Toggle } from "../../atoms/Toggle";

type ThresholdCardHeaderProps = {
  auto: boolean;
  onAutoChange: (next: boolean) => void;
};

export function ThresholdCardHeader({
  auto,
  onAutoChange,
}: ThresholdCardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sky-400">
        <Icon
          icon={ICON_MAP.target}
          size="sm"
          color="inherit"
          strokeWidth={1.9}
        />
        <span className="text-[15px] font-semibold text-slate-50">
          Thresholds
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className={`text-[13px] ${auto ? "text-sky-400" : "text-slate-400"}`}
        >
          {auto ? "Auto zones" : "Manual zones"}
        </span>
        <Toggle
          checked={auto}
          onCheckedChange={onAutoChange}
          aria-label="Auto zones"
        />
      </div>
    </div>
  );
}
