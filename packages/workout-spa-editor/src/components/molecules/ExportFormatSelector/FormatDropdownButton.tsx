import { ChevronDown } from "lucide-react";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFileExtensionForFormat, type FormatOption } from "./format-options";

type FormatDropdownButtonProps = {
  currentFormat: WorkoutFileFormat;
  currentOption: FormatOption | undefined;
  isOpen: boolean;
  onToggle: () => void;
  disabled: boolean;
};

export function FormatDropdownButton({
  currentFormat,
  currentOption,
  isOpen,
  onToggle,
  disabled,
}: FormatDropdownButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
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
          (.{getFileExtensionForFormat(currentFormat)})
        </span>
      </span>
      <ChevronDown
        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
}
