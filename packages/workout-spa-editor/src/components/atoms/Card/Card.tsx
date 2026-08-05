import { forwardRef, type HTMLAttributes } from "react";

export type CardVariant = "default" | "interactive";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

/* Role tokens, not the paired slate dialect (#1121): the roles carry both
   themes, so no `dark:` variant is needed. 16px is the V2 card radius. */
const baseClasses = "rounded-2xl border border-edge-soft bg-surface";

const variantClasses: Record<CardVariant, string> = {
  default: "",
  interactive: "group relative overflow-hidden transition-all hover:shadow-lg",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    const classes = [baseClasses, variantClasses[variant], className]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
