import { forwardRef, useId } from "react";
import {
  baseInputClasses,
  errorStateClasses,
  labelClasses,
  normalStateClasses,
  sizeClasses,
} from "./Input.styles";
import type { InputProps } from "./Input.types";
import { InputElement } from "./InputElement";
import { InputMessages } from "./InputMessages";

const buildInputClasses = (
  hasError: boolean,
  size: "sm" | "md" | "lg",
  className: string
): string => {
  return [
    baseInputClasses,
    hasError ? errorStateClasses : normalStateClasses,
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
};

const buildInputClasses = (
  hasError: boolean,
  size: "sm" | "md" | "lg",
  className: string
): string => {
  return [
    baseInputClasses,
    hasError ? errorStateClasses : normalStateClasses,
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
};

export const Input = forwardRef<
  HTMLInputElement | HTMLSelectElement,
  InputProps
>((props, ref) => {
  const {
    variant = "text",
    size = "md",
    label,
    helperText,
    error,
    className = "",
    id,
    ...restProps
  } = props;

  const generatedId = useId();
  const inputId = id || generatedId;
  const hasError = Boolean(error);
  const inputClasses = buildInputClasses(hasError, size, className);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      )}
      <InputElement
        ref={ref}
        variant={variant}
        inputId={inputId}
        inputClasses={inputClasses}
        hasError={hasError}
        helperText={helperText}
        {...restProps}
      />
      <InputMessages inputId={inputId} error={error} helperText={helperText} />
    </div>
  );
});

Input.displayName = "Input";
