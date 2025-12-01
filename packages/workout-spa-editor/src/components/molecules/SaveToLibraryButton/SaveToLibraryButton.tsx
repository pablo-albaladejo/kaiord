/**
 * SaveToLibraryButton Component
 *
 * Button with integrated dialog for saving workouts to the library.
 *
 * Requirements:
 * - Requirement 17.1: Store workout in browser local storage
 * - Requirement 17.2: Allow adding tags and notes for organization
 * - Requirement 17.3: Generate thumbnail preview of the workout
 * - Requirement 17.5: Display success notification
 */

import { BookmarkPlus } from "lucide-react";
import { useState } from "react";
import type { KRD } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { SaveToLibraryDialog } from "./SaveToLibraryDialog";

export type SaveToLibraryButtonProps = {
  workout: KRD;
  disabled?: boolean;
  className?: string;
};

/**
 * Button that opens dialog to save workout to library
 */
export function SaveToLibraryButton({
  workout,
  disabled,
  className,
}: SaveToLibraryButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
        className={className}
      >
        <BookmarkPlus className="h-4 w-4" />
        Save to Library
      </Button>

      <SaveToLibraryDialog
        workout={workout}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
