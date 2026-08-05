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
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-muted m-0">
          {title}
        </h3>
        {action !== undefined && (
          <button
            type="button"
            onClick={onAction}
            className="text-[13px] font-medium text-ink-strong underline underline-offset-2 transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:text-ink-body"
          >
            {action}
          </button>
        )}
      </div>
    );
  }
);

SectionHead.displayName = "SectionHead";
