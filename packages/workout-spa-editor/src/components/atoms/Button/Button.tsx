import { forwardRef, type ButtonHTMLAttributes } from "react";
import { sizeClasses, variantClasses } from "./button-styles";
import { LoadingSpinner } from "./LoadingSpinner";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={classes}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
