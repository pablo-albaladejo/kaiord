import { forwardRef, type HTMLAttributes } from "react";

import { zoneBgClass, type ZoneNumber } from "../../../lib/zone-colors";

export type StepListItem = {
  kind: string;
  detail: string;
  zone: ZoneNumber;
  dur: string;
};

export type StepListProps = HTMLAttributes<HTMLDivElement> & {
  steps: StepListItem[];
  className?: string;
};

export const StepList = forwardRef<HTMLDivElement, StepListProps>(
  ({ steps, className = "", ...props }, ref) => {
    const classes = ["flex flex-col", className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const rowClasses = [
            "flex items-center gap-[13px] py-3 px-0.5",
            isLast ? "" : "border-b border-slate-800",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={i} className={rowClasses}>
              <div
                className={`w-1 self-stretch rounded-[9px] ${zoneBgClass(step.zone)}`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-semibold text-slate-50">
                  {step.kind}
                </div>
                <div className="text-[12.5px] text-slate-400 mt-px">
                  {step.detail}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-300 tabular-nums">
                  {step.dur}
                </div>
                <div className="text-[11px] text-slate-500">Z{step.zone}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

StepList.displayName = "StepList";
