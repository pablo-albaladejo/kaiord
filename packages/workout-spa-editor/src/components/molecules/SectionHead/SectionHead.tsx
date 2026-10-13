import { forwardRef, type HTMLAttributes } from "react";
import { Link } from "wouter";

const ACTION_CLASSES =
  "text-[13px] font-medium text-ink-strong underline underline-offset-2 transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:text-ink-body";

export type SectionHeadProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  action?: string;
  onAction?: () => void;
  /** Renders the action as a link to this route instead of a button. */
  actionHref?: string;
  className?: string;
};

export const SectionHead = forwardRef<HTMLDivElement, SectionHeadProps>(
  ({ title, action, onAction, actionHref, className = "", ...props }, ref) => {
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
        {action !== undefined && actionHref !== undefined && (
          <Link href={actionHref} className={ACTION_CLASSES}>
            {action}
          </Link>
        )}
        {action !== undefined && actionHref === undefined && (
          <button type="button" onClick={onAction} className={ACTION_CLASSES}>
            {action}
          </button>
        )}
      </div>
    );
  }
);

SectionHead.displayName = "SectionHead";
