import type { LucideIcon } from "lucide-react";
import { forwardRef, type HTMLAttributes } from "react";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "muted";

export type IconProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  icon: LucideIcon;
  size?: IconSize;
  color?: IconColor;
  strokeWidth?: number;
};

const sizeClasses: Record<IconSize, string> = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

const colorClasses: Record<IconColor, string> = {
  default: "text-gray-700 dark:text-gray-200",
  primary: "text-primary-600 dark:text-primary-400",
  secondary: "text-gray-500 dark:text-gray-400",
  success: "text-green-600 dark:text-green-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  danger: "text-red-600 dark:text-red-400",
  muted: "text-gray-400 dark:text-gray-600",
};

export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  (
    {
      icon: IconComponent,
      size = "md",
      color = "default",
      strokeWidth = 2,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseClasses = "inline-flex items-center justify-center shrink-0";
    const classes = [
      baseClasses,
      sizeClasses[size],
      colorClasses[color],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <span ref={ref} className={classes} {...props}>
        <IconComponent strokeWidth={strokeWidth} className="w-full h-full" />
      </span>
    );
  }
);

Icon.displayName = "Icon";
