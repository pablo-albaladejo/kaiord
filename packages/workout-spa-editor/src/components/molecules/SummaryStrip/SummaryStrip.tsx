import { forwardRef, type HTMLAttributes } from "react";

import { Icon, ICON_MAP, type IconName } from "../../atoms/Icon";

export type SummaryItem = { icon: IconName; value: string; label: string };

export type SummaryStripProps = HTMLAttributes<HTMLDivElement> & {
  items: SummaryItem[];
  className?: string;
};

export const SummaryStrip = forwardRef<HTMLDivElement, SummaryStripProps>(
  ({ items, className = "", ...props }, ref) => {
    const classes = ["flex gap-2", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {items.map((item) => (
          <div
            key={item.label}
            className="flex-1 bg-surface-deep border border-edge rounded-[14px] px-[10px] py-3 text-center"
          >
            <Icon
              icon={ICON_MAP[item.icon]}
              size="sm"
              color="muted"
              className="mx-auto mb-[5px]"
            />
            <div className="text-base font-bold text-ink-strong">
              {item.value}
            </div>
            <div className="text-[11px] text-ink-muted mt-px">{item.label}</div>
          </div>
        ))}
      </div>
    );
  }
);

SummaryStrip.displayName = "SummaryStrip";
