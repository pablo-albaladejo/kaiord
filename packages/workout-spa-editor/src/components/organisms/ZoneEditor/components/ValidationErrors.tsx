/**
 * ValidationErrors Component
 *
 * Displays zone validation errors.
 */

import { AlertCircle } from "lucide-react";

import { useTranslate } from "../../../../i18n/use-translate";
import type { ZoneValidationError } from "../hooks/useZoneValidation";

type ValidationErrorsProps = {
  errors: Array<ZoneValidationError>;
};

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  const t = useTranslate("zones");
  if (errors.length === 0) return null;

  return (
    <div className="rounded-md bg-danger-bg p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-danger-text" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-danger-text">
            {t("validation.heading")}
          </h3>
          <ul className="mt-1 space-y-1 text-sm text-danger-text">
            {errors.map((error) => (
              <li key={`${error.zone}-${error.code}`}>
                {t("validation.zoneLabel", {
                  zone: error.zone,
                  message: t(`validation.${error.code}`),
                })}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
