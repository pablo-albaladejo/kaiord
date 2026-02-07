import { type FormatOption } from "./format-options";
import { FormatDropdownButton } from "./FormatDropdownButton";
import { FormatOptionItem } from "./FormatOption";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";

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
  const { focusedIndex, optionRefs, handleKeyDown } = useKeyboardNavigation({
    isOpen,
    currentFormat,
    formatOptions,
    onFormatSelect,
    onToggle,
    disabled,
  });

  const currentOption = formatOptions.find(
    (opt) => opt.value === currentFormat
  );

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
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
          {formatOptions.map((option, index) => {
            const isSelected = option.value === currentFormat;
            const isFocused = index === focusedIndex;
            return (
              <FormatOptionItem
                key={option.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                option={option}
                isSelected={isSelected}
                isFocused={isFocused}
                onSelect={() => onFormatSelect(option.value)}
                disabled={disabled}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
