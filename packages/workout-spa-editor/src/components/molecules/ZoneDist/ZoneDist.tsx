import { forwardRef, type HTMLAttributes } from "react";

import { zoneBgClass, type ZoneNumber } from "../../../lib/zone-colors";

export type ZoneDistProps = HTMLAttributes<HTMLDivElement> & {
  dist: number[];
  height?: number;
  className?: string;
};

export const ZoneDist = forwardRef<HTMLDivElement, ZoneDistProps>(
  ({ dist, height = 8, className = "", style, ...props }, ref) => {
    const classes = ["flex gap-[2px] rounded-full overflow-hidden", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        ref={ref}
        className={classes}
        style={{ height, ...style }}
        {...props}
      >
        {dist.map((value, i) => {
          if (value <= 0) return null;
          return (
            <div
              key={i}
              className={zoneBgClass((i + 1) as ZoneNumber)}
              style={{ flex: value }}
            />
          );
        })}
      </div>
    );
  }
);

ZoneDist.displayName = "ZoneDist";
