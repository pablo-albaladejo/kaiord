/**
 * The session's shape over time: one bar per contiguous run of same-zone
 * time, width proportional to its duration and height proportional to its
 * zone. Take the colour away and the ramp still reads — which is why the
 * height ladder exists and why this is not `ZoneDist` (an aggregate, sorted
 * Z1→Z5, drawn at a single height).
 *
 * `height` is the caller's: 14 px in the calendar grid, 20 px in the calendar
 * list, 10 px on a library card, 88 px in the coaching dialog. One component,
 * four densities. `segmentTitle` gives each bar a hover title, for the
 * surfaces large enough to point at a single bar. A segment with no zone
 * (an estimate's unreadable span) is drawn grey at mid height.
 */
import { forwardRef, type HTMLAttributes } from "react";

import type { ProfileSegment } from "../../../lib/workout-review";
import { zoneBgClass, type ZoneNumber } from "../../../lib/zone-colors";

/** Fraction of the bar's height per zone — the second, colour-free channel. */
const ZONE_HEIGHT: Record<ZoneNumber, string> = {
  1: "34%",
  2: "52%",
  3: "68%",
  4: "84%",
  5: "100%",
};

/** An unknown zone stands at mid height in a neutral role: it claims neither
    an easy nor a hard effort, and its grey says no zone was given. */
const NO_ZONE_HEIGHT = "50%";
const NO_ZONE_CLASS = "bg-ink-muted";

const DEFAULT_HEIGHT_PX = 14;

export type ZoneProfileBarProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  segments: readonly ProfileSegment[];
  /** Rendered height in px. Grid 14, list 20, library card 10, dialog 88. */
  height?: number;
  /** Per-bar hover title (zone + duration). Omitted → bars carry no title. */
  segmentTitle?: (segment: ProfileSegment) => string;
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
      segmentTitle,
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
            data-zone={segment.zone ?? "none"}
            title={segmentTitle?.(segment)}
            className={`rounded-t-[2px] ${segment.zone === null ? NO_ZONE_CLASS : zoneBgClass(segment.zone)}`}
            style={{
              flex: segment.seconds,
              height:
                segment.zone === null
                  ? NO_ZONE_HEIGHT
                  : ZONE_HEIGHT[segment.zone],
            }}
          />
        ))}
      </div>
    );
  }
);

ZoneProfileBar.displayName = "ZoneProfileBar";
