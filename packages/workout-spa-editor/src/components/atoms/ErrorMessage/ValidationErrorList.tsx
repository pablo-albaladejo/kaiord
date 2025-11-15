import type { ValidationError } from "../../../types/krd";

type ValidationErrorListProps = {
  errors: Array<ValidationError>;
};

export const ValidationErrorList = ({ errors }: ValidationErrorListProps) => {
  if (errors.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-sm font-medium text-red-800 dark:text-red-200">
        Validation errors:
      </p>
      <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
        {errors.map((error, index) => {
          const fieldPath = error.path.join(".");
          return (
            <li key={index}>
              {fieldPath && (
                <>
                  <span className="font-mono text-xs">{fieldPath}</span>:{" "}
                </>
              )}
              {error.message}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
