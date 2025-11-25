import { Check } from "lucide-react";
import { forwardRef } from "react";
import { getFileExtensionForFormat, type FormatOption } from "./format-options";

type FormatOptionProps = {
  readonly option: FormatOption;
  readonly isSelected: boolean;
  readonly isFocused: boolean;
  readonly onSelect: () => void;
  readonly disabled: boolean;
};

export const FormatOptionItem = forwardRef<
  HTMLButtonElement,
  FormatOptionProps
>(function FormatOptionItem(
  { option, isSelected, isFocused, onSelect, disabled },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`
          w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700
          first:rounded-t-lg last:rounded-b-lg
          transition-colors
          ${isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""}
          ${isFocused ? "ring-2 ring-primary-500 ring-inset" : ""}
          ${disabled ? "cursor-not-allowed opacity-50" : ""}
        `}
      role="option"
      aria-selected={isSelected}
      aria-label={option.label}
      tabIndex={isFocused ? 0 : -1}
      data-testid={`export-format-option-${option.value}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {option.label}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              .{getFileExtensionForFormat(option.value)}
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
});
