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

export type TextInputProps = BaseInputProps &
  InputHTMLAttributes<HTMLInputElement> & {
    variant?: "text";
  };

export type NumberInputProps = BaseInputProps &
  InputHTMLAttributes<HTMLInputElement> & {
    variant: "number";
  };

export type SelectInputProps = BaseInputProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    variant: "select";
    options: Array<{ value: string; label: string }>;
  };

export type InputProps = TextInputProps | NumberInputProps | SelectInputProps;
