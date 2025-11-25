/**
 * CreateRepetitionBlockButton Component
 *
 * Button that appears when 2+ steps are selected, allowing user to create a repetition block.
 *
 * Requirements:
 * - Requirement 7.1.1: Enable "Create Repetition Block" button when multiple steps selected
 */

import { Repeat } from "lucide-react";
import { Button } from "../../atoms/Button/Button";

export type CreateRepetitionBlockButtonProps = {
  selectedCount: number;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Button to create a repetition block from selected steps.
 * Only visible when 2 or more steps are selected.
 */
export function CreateRepetitionBlockButton({
  selectedCount,
  onClick,
  disabled = false,
  className = "",
}: CreateRepetitionBlockButtonProps) {
  // Only show button when 2+ steps selected
  if (selectedCount < 2) {
    return null;
  }

  return (
    <Button
      variant="primary"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Create repetition block from ${selectedCount} selected steps`}
      data-testid="create-repetition-block-button"
      className={className}
    >
      <Repeat className="h-4 w-4" />
      Create Repetition Block ({selectedCount} steps)
    </Button>
  );
}
