/**
 * The session's shape over time: one bar per contiguous run of same-zone
 * time, width proportional to its duration and height proportional to its
 * zone. Take the colour away and the ramp still reads — which is why the
 * height ladder exists and why this is not `ZoneDist` (an aggregate, sorted
 * Z1→Z5, drawn at a single height).
 *
 * `height` is the caller's: 14 px in the calendar grid, 20 px in the calendar
 * list, 10 px on a library card. One component, three densities.
 */
import { forwardRef, type HTMLAttributes } from "react";

import type { ZoneSegment } from "../../../lib/workout-review";
import { zoneBgClass, type ZoneNumber } from "../../../lib/zone-colors";

/** Fraction of the bar's height per zone — the second, colour-free channel. */
const ZONE_HEIGHT: Record<ZoneNumber, string> = {
  1: "34%",
  2: "52%",
  3: "68%",
  4: "84%",
  5: "100%",
};

const DEFAULT_HEIGHT_PX = 14;

export type ZoneProfileBarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  segments: readonly ZoneSegment[];
  /** Rendered height in px. Grid 14, list 20, library card 10. */
  height?: number;
  /** Accessible summary. Omitted → the bar is decorative and hidden. */
  label?: string;
  className?: string;
};

export const ZoneProfileBar = forwardRef<HTMLDivElement, ZoneProfileBarProps>(
  (
    {
      segments,
      height = DEFAULT_HEIGHT_PX,
      label,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    if (segments.length === 0) return null;
    return (
      <div
        ref={ref}
        data-testid="zone-profile-bar"
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={["flex items-end gap-[2px]", className]
          .filter(Boolean)
          .join(" ")}
        style={{ height, ...style }}
        {...props}
      >
        {segments.map((segment, i) => (
          <span
            key={`${segment.zone}-${i}`}
            data-zone={segment.zone}
            className={`rounded-t-[2px] ${zoneBgClass(segment.zone)}`}
            style={{ flex: segment.seconds, height: ZONE_HEIGHT[segment.zone] }}
          />
        ))}
      </div>
    );
  }
);

ZoneProfileBar.displayName = "ZoneProfileBar";
