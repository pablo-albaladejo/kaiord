import { forwardRef, type HTMLAttributes } from "react";

import { type ZoneNumber, zoneVar } from "../../../lib/zone-colors";
import { Icon, ICON_MAP, type IconName } from "../../atoms/Icon";

/**
 * `zone` names one training zone as this metric's value. It replaces the icon
 * with that zone's swatch; the word stays the value, because the zone ramp is
 * neither lightness-monotonic nor theme-stable and colour alone cannot
 * identify a zone.
 */
export type SummaryItem = {
  icon: IconName;
  value: string;
  label: string;
  zone?: ZoneNumber;
};

export type SummaryStripProps = HTMLAttributes<HTMLDivElement> & {
  items: SummaryItem[];
  className?: string;
};

const SWATCH_SIZE = 10;

export const SummaryStrip = forwardRef<HTMLDivElement, SummaryStripProps>(
  ({ items, className = "", ...props }, ref) => {
    const classes = ["flex gap-2", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {items.map((item) => (
          <div
            key={item.label}
            className="flex-1 rounded-[12px] border border-edge bg-surface-deep px-[10px] py-3 text-center"
          >
            {item.zone === undefined ? (
              <Icon
                icon={ICON_MAP[item.icon]}
                size="sm"
                color="muted"
                className="mx-auto mb-[5px]"
              />
            ) : (
              <span
                aria-hidden="true"
                data-testid="summary-zone-swatch"
                className="mx-auto mb-[5px] block rounded-[3px]"
                style={{
                  width: SWATCH_SIZE,
                  height: SWATCH_SIZE,
                  background: zoneVar(item.zone),
                }}
              />
            )}
            <div className="text-base font-semibold tabular-nums text-ink-strong">
              {item.value}
            </div>
            <div className="mt-px text-[11px] text-ink-muted">{item.label}</div>
          </div>
        ))}
      </div>
    );
  }
);

SummaryStrip.displayName = "SummaryStrip";
