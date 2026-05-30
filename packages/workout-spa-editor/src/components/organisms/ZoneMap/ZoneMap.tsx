import { forwardRef, type HTMLAttributes } from "react";

import { zoneGradient, type ZoneNumber } from "../../../lib/zone-colors";
import { ZoneMapLegend } from "./ZoneMapLegend";

export type ZoneMapEntry = {
  n: ZoneNumber;
  name: string;
  range: string;
  pct: string;
  w: number;
};

export type ZoneMapProps = HTMLAttributes<HTMLDivElement> & {
  zones: ZoneMapEntry[];
  className?: string;
};

function borderRadius(i: number, total: number): string {
  if (total === 1) return "8px";
  if (i === 0) return "8px 3px 3px 8px";
  if (i === total - 1) return "3px 8px 8px 3px";
  return "3px";
}

export const ZoneMap = forwardRef<HTMLDivElement, ZoneMapProps>(
  ({ zones, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        <div className="flex gap-[3px] h-[56px] mb-[14px]">
          {zones.map((z, i) => (
            <div
              key={z.n}
              style={{
                flex: z.w,
                ...zoneGradient(z.n),
                borderRadius: borderRadius(i, zones.length),
              }}
              className="flex items-end justify-center pb-[6px]"
            >
              <span className="text-xs font-extrabold text-black/55">
                Z{z.n}
              </span>
            </div>
          ))}
        </div>
        <ZoneMapLegend zones={zones} />
      </div>
    );
  }
);

ZoneMap.displayName = "ZoneMap";
