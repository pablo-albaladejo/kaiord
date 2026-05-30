import { forwardRef, type HTMLAttributes } from "react";

export type SectionHeadProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
};

export const SectionHead = forwardRef<HTMLDivElement, SectionHeadProps>(
  ({ title, action, onAction, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={["flex items-baseline justify-between mb-3", className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        <h3 className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-500 m-0">
          {title}
        </h3>
        {action !== undefined && (
          <button
            type="button"
            onClick={onAction}
            className="text-sky-400 text-[13.5px] font-semibold"
          >
            {action}
          </button>
        )}
      </div>
    );
  }
);

SectionHead.displayName = "SectionHead";
