import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export type InputVariant = "text" | "number" | "select";
export type InputSize = "sm" | "md" | "lg";

type BaseInputProps = {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  helperText?: string;
  error?: string;
};

// The DOM's own `size` is a number, and intersecting it with `InputSize`
// collapsed the prop to `never` — so `size="sm"` was a type error even though
// the component reads exactly those three values at runtime. Dropping the DOM
// attribute keeps the design token; nothing here passes a numeric size.
export type TextInputProps = BaseInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    variant?: "text";
  };

export type NumberInputProps = BaseInputProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    variant: "number";
  };

export type SelectInputProps = BaseInputProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
    variant: "select";
    options: Array<{ value: string; label: string }>;
  };

export type InputProps = TextInputProps | NumberInputProps | SelectInputProps;
