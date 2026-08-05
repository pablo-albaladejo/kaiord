import { forwardRef, type HTMLAttributes } from "react";

export type MetricProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  unit?: string;
  label: string;
  className?: string;
};

/* A figure and what it measures. The value carries no colour of its own: a
   number is not a link, and the five hues in the palette belong to training
   zones. `slashed-zero` alongside `tabular-nums` so a column of figures
   aligns and 0 never reads as O. */
export const Metric = forwardRef<HTMLDivElement, MetricProps>(
  ({ value, unit, label, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={["flex-1 min-w-0", className].filter(Boolean).join(" ")}
        {...props}
      >
        <div className="flex items-baseline gap-[3px]">
          <span className="text-[24px] font-semibold tracking-[-0.026em] tabular-nums [font-variant-numeric:tabular-nums_slashed-zero] text-ink-strong">
            {value}
          </span>
          {unit !== undefined && (
            <span className="text-[13px] font-medium text-ink-muted">
              {unit}
            </span>
          )}
        </div>
        <div className="text-xs text-ink-muted mt-[5px] truncate whitespace-nowrap overflow-hidden">
          {label}
        </div>
      </div>
    );
  }
);

Metric.displayName = "Metric";
