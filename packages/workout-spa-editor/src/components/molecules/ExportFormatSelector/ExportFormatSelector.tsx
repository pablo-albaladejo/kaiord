/**
 * ExportFormatSelector Component
 *
 * Dropdown selector for choosing workout export format with descriptions and warnings.
 *
 * Requirements:
 * - Requirement 12.6: Provide format selection options (FIT, TCX, ZWO, KRD)
 */

import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { KRD, ValidationError } from "../../../types/krd";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFileExtension } from "../../../utils/file-format-metadata";

export type ExportFormatSelectorProps = {
  currentFormat: WorkoutFileFormat;
  onFormatChange: (format: WorkoutFileFormat) => void;
  workout?: KRD;
  disabled?: boolean;
  className?: string;
};

type FormatWarning = {
  format: WorkoutFileFormat;
  message: string;
};

/**
 * Gets format-specific warnings based on workout content
 */
const getFormatWarnings = (
  format: WorkoutFileFormat,
  workout?: KRD
): string | null => {
  if (!workout) return null;

  const warnings: FormatWarning[] = [
    {
      format: "fit",
      message: "FIT format may not support all workout features",
    },
    {
      format: "tcx",
      message: "TCX format has limited support for advanced targets",
    },
    {
      format: "zwo",
      message: "ZWO format only supports cycling workouts",
    },
  ];

  const warning = warnings.find((w) => w.format === format);
  return warning?.message || null;
};

/**
 * Validates workout before export
 */
const validateWorkoutForExport = (workout?: KRD): ValidationError[] => {
  if (!workout) {
    return [{ path: ["workout"], message: "No workout to export" }];
  }

  const errors: ValidationError[] = [];

  if (!workout.version) {
    errors.push({ path: ["version"], message: "Missing version" });
  }

  if (!workout.type) {
    errors.push({ path: ["type"], message: "Missing type" });
  }

  if (!workout.metadata) {
    errors.push({ path: ["metadata"], message: "Missing metadata" });
  }

  return errors;
};

/**
 * Format option for dropdown
 */
type FormatOption = {
  value: WorkoutFileFormat;
  label: string;
  description: string;
  compatibility: string[];
};

const formatOptions: FormatOption[] = [
  {
    value: "fit",
    label: "FIT",
    description: "Garmin FIT format - Binary format for fitness devices",
    compatibility: ["Garmin devices", "Garmin Connect", "TrainingPeaks"],
  },
  {
    value: "tcx",
    label: "TCX",
    description: "Training Center XML - Garmin's XML workout format",
    compatibility: ["Garmin Connect", "TrainingPeaks", "Strava"],
  },
  {
    value: "zwo",
    label: "ZWO",
    description: "Zwift Workout - XML format for Zwift platform",
    compatibility: ["Zwift"],
  },
  {
    value: "krd",
    label: "KRD",
    description: "Kaiord format - JSON-based canonical workout format",
    compatibility: ["Kaiord tools", "Web editors"],
  },
];

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

  const currentOption = formatOptions.find(
    (opt) => opt.value === currentFormat
  );
  const warning = getFormatWarnings(currentFormat, workout);

  const handleFormatSelect = (format: WorkoutFileFormat) => {
    // Validate workout before allowing format change
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
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-2.5
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-colors
        `}
        aria-label="Select export format"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="flex items-center gap-2">
          <span className="font-semibold">{currentOption?.label}</span>
          <span className="text-gray-500 dark:text-gray-400">
            (.{getFileExtension(currentFormat)})
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
          role="listbox"
        >
          {formatOptions.map((option) => {
            const isSelected = option.value === currentFormat;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFormatSelect(option.value)}
                className={`
                  w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700
                  first:rounded-t-lg last:rounded-b-lg
                  transition-colors
                  ${isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""}
                `}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        .{getFileExtension(option.value)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      {option.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {option.compatibility.map((platform) => (
                        <span
                          key={platform}
                          className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Format Warning */}
      {warning && (
        <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {warning}
          </p>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
            Cannot export workout:
          </p>
          <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>
                {error.path.join(".")}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
