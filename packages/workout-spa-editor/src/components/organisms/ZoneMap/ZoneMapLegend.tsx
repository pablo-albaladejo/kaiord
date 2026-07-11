import { zoneBgClass } from "../../../lib/zone-colors";
import type { ZoneMapEntry } from "./ZoneMap";

type ZoneMapLegendProps = {
  zones: ZoneMapEntry[];
};

export function ZoneMapLegend({ zones }: ZoneMapLegendProps) {
  return (
    <div className="flex flex-col gap-[2px]">
      {zones.map((z, i) => {
        const isLast = i === zones.length - 1;
        const rowClasses = [
          "flex items-center gap-[11px] py-2 px-1",
          isLast ? "" : "border-b border-edge-soft",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={z.n} className={rowClasses}>
            <span
              className={[
                "h-[9px] w-[9px] rounded-[3px]",
                zoneBgClass(z.n),
              ].join(" ")}
            />
            <span className="text-[14.5px] font-semibold text-ink-strong w-[86px]">
              {z.name}
            </span>
            <span className="text-[13px] text-ink-muted flex-1">{z.pct}</span>
            <span className="text-[13.5px] font-semibold text-ink-body tabular-nums">
              {z.range}
            </span>
          </div>
        );
      })}
    </div>
  );
}

ZoneMapLegend.displayName = "ZoneMapLegend";
