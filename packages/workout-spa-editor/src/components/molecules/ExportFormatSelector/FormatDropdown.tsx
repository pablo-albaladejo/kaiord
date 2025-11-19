import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { type FormatOption } from "./format-options";
import { FormatDropdownButton } from "./FormatDropdownButton";
import { FormatOptionItem } from "./FormatOption";

type FormatDropdownProps = {
  isOpen: boolean;
  currentFormat: WorkoutFileFormat;
  formatOptions: FormatOption[];
  onToggle: () => void;
  onFormatSelect: (format: WorkoutFileFormat) => void;
  disabled: boolean;
};

export function FormatDropdown({
  isOpen,
  currentFormat,
  formatOptions,
  onToggle,
  onFormatSelect,
  disabled,
}: FormatDropdownProps) {
  const currentOption = formatOptions.find(
    (opt) => opt.value === currentFormat
  );

  return (
    <div className="relative">
      <FormatDropdownButton
        currentFormat={currentFormat}
        currentOption={currentOption}
        isOpen={isOpen}
        onToggle={onToggle}
        disabled={disabled}
      />

      {isOpen && (
        <div
          className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
          role="listbox"
        >
          {formatOptions.map((option) => {
            const isSelected = option.value === currentFormat;
            return (
              <FormatOptionItem
                key={option.value}
                option={option}
                isSelected={isSelected}
                onSelect={() => onFormatSelect(option.value)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
