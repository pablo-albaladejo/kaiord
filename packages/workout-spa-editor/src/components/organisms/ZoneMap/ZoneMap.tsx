import { forwardRef, type HTMLAttributes } from "react";

import {
  zoneGradient,
  zoneHeight,
  type ZoneNumber,
} from "../../../lib/zone-colors";
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
  /** Optional note between the labels and the legend, e.g. what the two
      dimensions of a bar mean. */
  caption?: string;
  className?: string;
};

/* The ramp encodes intensity twice: width is the zone's range, height is its
   intensity. Take the colour away and it still reads — which is why the
   labels sit BELOW the bars rather than inside them, where they measured
   2:1 against Z1 and Z5. */
export const ZoneMap = forwardRef<HTMLDivElement, ZoneMapProps>(
  ({ zones, caption, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        <div className="flex items-end gap-[3px] h-[56px]">
          {zones.map((z) => (
            <div
              key={z.n}
              style={{
                flex: z.w,
                height: zoneHeight(z.n),
                ...zoneGradient(z.n),
                borderRadius: "6px 6px 2px 2px",
              }}
            />
          ))}
        </div>
        <div className="flex gap-[3px] mt-[7px] text-xs font-medium text-ink-muted tabular-nums">
          {zones.map((z) => (
            <span key={z.n} style={{ flex: z.w }} className="text-center">
              Z{z.n}
            </span>
          ))}
        </div>
        {caption !== undefined && (
          <p className="mt-[9px] text-xs leading-[1.55] text-ink-muted">
            {caption}
          </p>
        )}
        <ZoneMapLegend zones={zones} className="mt-[14px]" />
      </div>
    );
  }
);

ZoneMap.displayName = "ZoneMap";
