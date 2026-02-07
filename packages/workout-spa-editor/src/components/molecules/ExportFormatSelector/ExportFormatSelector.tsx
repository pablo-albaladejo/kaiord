/**
 * ExportFormatSelector Component
 *
 * Dropdown selector for choosing workout export format with descriptions and warnings.
 *
 * Requirements:
 * - Requirement 12.6: Provide format selection options (FIT, TCX, ZWO, KRD)
 */

import { useState } from "react";
import { validateWorkoutForExport } from "./format-helpers";
import { formatOptions } from "./format-options";
import { FormatDropdown } from "./FormatDropdown";
import { FormatWarnings } from "./FormatWarnings";
import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";

export type ExportFormatSelectorProps = {
  currentFormat: WorkoutFileFormat;
  onFormatChange: (format: WorkoutFileFormat) => void;
  workout?: KRD;
  disabled?: boolean;
  className?: string;
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
}: ExportFormatSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  const handleFormatSelect = (format: WorkoutFileFormat) => {
    const errors = validateWorkoutForExport(workout);
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
      />
      <FormatWarnings
        format={currentFormat}
        workout={workout}
        validationErrors={validationErrors}
      />
    </div>
  );
}
