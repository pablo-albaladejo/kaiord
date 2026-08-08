import {
  localizeValidationMessage,
  validationHeading,
} from "../../../i18n/error-copy";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import type { ValidationError } from "../../../types/krd";

type ValidationErrorListProps = {
  errors: Array<ValidationError>;
};

export const ValidationErrorList = ({ errors }: ValidationErrorListProps) => {
  const locale = useActiveLocale();
  if (errors.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-sm font-medium text-danger-text">
        {validationHeading(locale)}
      </p>
      <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-danger-text">
        {errors.map((error, index) => {
          const fieldPath = error.path.join(".");
          return (
            <li key={index}>
              {fieldPath && (
                <>
                  <span className="font-mono text-xs">{fieldPath}</span>:{" "}
                </>
              )}
              {localizeValidationMessage(error, locale)}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
