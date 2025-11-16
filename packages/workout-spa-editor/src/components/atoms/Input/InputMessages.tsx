import { errorTextClasses, helperTextClasses } from "./Input.styles";

type InputMessagesProps = {
  inputId: string;
  error?: string;
  helperText?: string;
};

export function InputMessages({
  inputId,
  error,
  helperText,
}: InputMessagesProps) {
  if (error) {
    return (
      <p id={`${inputId}-error`} className={errorTextClasses} role="alert">
        {error}
      </p>
    );
  }

  if (helperText) {
    return (
      <p id={`${inputId}-helper`} className={helperTextClasses}>
        {helperText}
      </p>
    );
  }

  return null;
}
