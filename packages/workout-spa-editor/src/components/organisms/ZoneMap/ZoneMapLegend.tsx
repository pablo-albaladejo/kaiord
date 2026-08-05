import { zoneBgClass } from "../../../lib/zone-colors";
import type { ZoneMapEntry } from "./ZoneMap";

type ZoneMapLegendProps = {
  zones: ZoneMapEntry[];
  className?: string;
};

export function ZoneMapLegend({ zones, className = "" }: ZoneMapLegendProps) {
  return (
    <div
      className={["flex flex-col gap-[2px]", className]
        .filter(Boolean)
        .join(" ")}
    >
      {zones.map((z, i) => {
        const isLast = i === zones.length - 1;
        const rowClasses = [
          "flex items-center gap-[11px] px-1 py-[9px]",
          isLast ? "" : "border-b border-edge-soft",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={z.n} className={rowClasses}>
            <span
              className={[
                "h-[9px] w-[9px] shrink-0 rounded-[3px]",
                zoneBgClass(z.n),
              ].join(" ")}
            />
            <span className="w-[86px] shrink-0 text-[15px] font-medium text-ink-strong">
              {z.name}
            </span>
            <span className="flex-1 text-[13px] text-ink-muted tabular-nums">
              {z.pct}
            </span>
            <span className="shrink-0 text-[13px] font-medium text-ink-body tabular-nums">
              {z.range}
            </span>
          </div>
        );
      })}
    </div>
  );
}

ZoneMapLegend.displayName = "ZoneMapLegend";
