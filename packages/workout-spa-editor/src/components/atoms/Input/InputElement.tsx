import {
  forwardRef,
  type InputHTMLAttributes,
  type Ref,
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
    // `size` is a design token here, not the DOM attribute — `Input` consumes
    // it and never forwards it, so casting it away keeps the spread honest
    // instead of putting `size="sm"` on a <select> that wants a number.
    const { options, ...selectProps } = props as Omit<SelectInputProps, "size">;
    return (
      <select
        ref={ref as Ref<HTMLSelectElement>}
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
      ref={ref as Ref<HTMLInputElement>}
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
