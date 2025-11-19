/**
 * CreateRepetitionBlockDialog Component
 *
 * Dialog for creating a repetition block from selected steps.
 *
 * Requirements:
 * - Requirement 4: Create repetition blocks from selected steps
 */

import { useState } from "react";
import { DialogContent } from "./DialogContent";
import { DialogFooter } from "./DialogFooter";
import { DialogHeader } from "./DialogHeader";

export type CreateRepetitionBlockDialogProps = {
  stepCount: number;
  onConfirm: (repeatCount: number) => void;
  onCancel: () => void;
};

/**
 * Dialog for creating a repetition block from selected steps
 */
export function CreateRepetitionBlockDialog({
  stepCount,
  onConfirm,
  onCancel,
}: CreateRepetitionBlockDialogProps) {
  const [repeatCount, setRepeatCount] = useState("2");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const count = Number.parseInt(repeatCount, 10);
    if (Number.isNaN(count) || count < 2) {
      setError("Repeat count must be at least 2");
      return;
    }
    onConfirm(count);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800 kiroween:bg-gray-800">
        <DialogHeader onCancel={onCancel} />
        <DialogContent
          stepCount={stepCount}
          repeatCount={repeatCount}
          error={error}
          onRepeatCountChange={(value) => {
            setRepeatCount(value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
        />
        <DialogFooter onCancel={onCancel} onConfirm={handleConfirm} />
      </div>
    </div>
  );
}
