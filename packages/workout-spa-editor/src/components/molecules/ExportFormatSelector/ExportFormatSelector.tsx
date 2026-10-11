/**
 * ExportFormatSelector Component
 *
 * Dropdown selector for choosing workout export format with descriptions and warnings.
 *
 * Requirements:
 * - Requirement 12.6: Provide format selection options (FIT, TCX, ZWO, KRD)
 */

import { type ReactNode, useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFormatWarnings, validateWorkoutForExport } from "./format-helpers";
import { formatOptions } from "./format-options";
import { FormatDropdown } from "./FormatDropdown";
import { FormatWarnings } from "./FormatWarnings";

export type ExportFormatSelectorProps = {
  currentFormat: WorkoutFileFormat;
  onFormatChange: (format: WorkoutFileFormat) => void;
  workout?: KRD;
  disabled?: boolean;
  className?: string;
  /**
   * Labels the trigger instead of the current format. Pass it when picking
   * a format is itself the action (the editor's single download control).
   */
  label?: ReactNode;
};

/**
 * Dropdown selector for export format with descriptions and warnings
 */
export function ExportFormatSelector({
  currentFormat,
  onFormatChange,
  workout,
  disabled = false,
  className = "",
  label,
}: ExportFormatSelectorProps) {
  const t = useTranslate("editor");
  const [isOpen, setIsOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  const handleFormatSelect = (format: WorkoutFileFormat) => {
    const errors = validateWorkoutForExport(workout, t);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    onFormatChange(format);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <FormatDropdown
        isOpen={isOpen}
        currentFormat={currentFormat}
        formatOptions={formatOptions}
        onToggle={handleToggle}
        onFormatSelect={handleFormatSelect}
        disabled={disabled}
        label={label}
        warningFor={(format) => getFormatWarnings(format, workout, t)}
      />
      <FormatWarnings
        // As the download control, a format is read in its option before
        // the click; repeating it after the download would come too late.
        format={label ? null : currentFormat}
        workout={workout}
        validationErrors={validationErrors}
      />
    </div>
  );
}
