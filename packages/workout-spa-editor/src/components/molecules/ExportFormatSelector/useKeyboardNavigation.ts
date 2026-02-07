import { useEffect, useRef, useState } from "react";
import type { FormatOption } from "./format-options";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";

type UseKeyboardNavigationProps = {
  isOpen: boolean;
  currentFormat: WorkoutFileFormat;
  formatOptions: FormatOption[];
  onFormatSelect: (format: WorkoutFileFormat) => void;
  onToggle: () => void;
  disabled: boolean;
};

export function useKeyboardNavigation({
  isOpen,
  currentFormat,
  formatOptions,
  onFormatSelect,
  onToggle,
  disabled,
}: UseKeyboardNavigationProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Initialize focus when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = formatOptions.findIndex(
        (opt) => opt.value === currentFormat
      );
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, currentFormat, formatOptions]);

  // Focus the focused option element
  useEffect(() => {
    if (isOpen && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, formatOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (isOpen && formatOptions[focusedIndex]) {
          onFormatSelect(formatOptions[focusedIndex].value);
          onToggle();
        }
        break;
      case "Escape":
        e.preventDefault();
        if (isOpen) {
          onToggle();
        }
        break;
    }
  };

  return {
    focusedIndex,
    optionRefs,
    handleKeyDown,
  };
}
