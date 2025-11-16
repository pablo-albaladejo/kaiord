import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { sizeClasses, variantClasses } from "./badge-styles";

export type BadgeVariant =
  | "warmup"
  | "active"
  | "cooldown"
  | "rest"
  | "recovery"
  | "interval"
  | "other"
  | "power"
  | "heart_rate"
  | "cadence"
  | "pace"
  | "stroke_type"
  | "open"
  | "default";

export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "default",
      size = "md",
      icon,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center gap-1 rounded-full font-medium border";
    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <span ref={ref} className={classes} {...props}>
        {icon && <span className="inline-flex items-center">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
