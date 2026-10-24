import { useTranslate } from "../../../i18n/use-translate";
import { zoneBgClass, type ZoneNumber } from "../../../lib/zone-colors";
import type { AxisTick } from "./zone-profile-axis";

const ZONES: readonly ZoneNumber[] = [1, 2, 3, 4, 5];
const FULL_PERCENT = 100;

const tickShift = (percent: number): string => {
  if (percent === 0) return "translateX(0)";
  if (percent >= FULL_PERCENT) return "translateX(-100%)";
  return "translateX(-50%)";
};

export function ZoneProfileAxis({ ticks }: { ticks: readonly AxisTick[] }) {
  const t = useTranslate("coaching");
  return (
    <div
      aria-hidden="true"
      data-testid="zone-profile-axis"
      className="relative h-4 text-[10px] tabular-nums text-muted-foreground"
    >
      {ticks.map((tick) => (
        <span
          key={tick.minutes}
          className="absolute top-0"
          style={{
            left: `${tick.percent}%`,
            transform: tickShift(tick.percent),
          }}
        >
          {t("profile.tick", { minutes: tick.minutes })}
        </span>
      ))}
    </div>
  );
}

export function ZoneProfileLegend() {
  const t = useTranslate("coaching");
  return (
    <ul
      aria-label={t("profile.legendAria")}
      data-testid="zone-profile-legend"
      className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground"
    >
      {ZONES.map((zone) => (
        <li key={zone} className="flex items-center gap-1">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-sm ${zoneBgClass(zone)}`}
          />
          {t("profile.zone", { zone })}
        </li>
      ))}
    </ul>
  );
}
