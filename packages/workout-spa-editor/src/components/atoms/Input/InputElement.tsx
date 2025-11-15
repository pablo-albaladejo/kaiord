import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import type { InputVariant, SelectInputProps } from "./Input.types";

type InputElementProps = {
  variant: InputVariant;
  inputId: string;
  inputClasses: string;
  hasError: boolean;
  helperText?: string;
} & (
  | InputHTMLAttributes<HTMLInputElement>
  | (SelectHTMLAttributes<HTMLSelectElement> & {
      options: Array<{ value: string; label: string }>;
    })
);

export const InputElement = forwardRef<
  HTMLInputElement | HTMLSelectElement,
  InputElementProps
>(({ variant, inputId, inputClasses, hasError, helperText, ...props }, ref) => {
  const ariaDescribedBy = hasError
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-helper`
      : undefined;

  if (variant === "select") {
    const { options, ...selectProps } = props as SelectInputProps;
    return (
      <select
        ref={ref as React.Ref<HTMLSelectElement>}
        id={inputId}
        className={inputClasses}
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const inputType = variant === "number" ? "number" : "text";
  return (
    <input
      ref={ref as React.Ref<HTMLInputElement>}
      type={inputType}
      id={inputId}
      className={inputClasses}
      aria-invalid={hasError}
      aria-describedby={ariaDescribedBy}
      {...(props as InputHTMLAttributes<HTMLInputElement>)}
    />
  );
});

InputElement.displayName = "InputElement";
