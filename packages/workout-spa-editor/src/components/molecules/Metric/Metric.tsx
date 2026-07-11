import { forwardRef, type HTMLAttributes } from "react";

export type MetricProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  unit?: string;
  label: string;
  accent?: boolean;
  className?: string;
};

export const Metric = forwardRef<HTMLDivElement, MetricProps>(
  ({ value, unit, label, accent = false, className = "", ...props }, ref) => {
    const valueColor = accent ? "text-accent" : "text-ink-strong";

    return (
      <div
        ref={ref}
        className={["flex-1 min-w-0", className].filter(Boolean).join(" ")}
        {...props}
      >
        <div className="flex items-baseline gap-[3px]">
          <span
            className={`text-[26px] font-bold tracking-[-0.02em] tabular-nums ${valueColor}`}
          >
            {value}
          </span>
          {unit !== undefined && (
            <span className="text-[13px] font-semibold text-ink-muted">
              {unit}
            </span>
          )}
        </div>
        <div className="text-xs text-ink-muted mt-px truncate whitespace-nowrap overflow-hidden">
          {label}
        </div>
      </div>
    );
  }
);

Metric.displayName = "Metric";
