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

import { Bookmark } from "lucide-react";
import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
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
  // The verb comes from `common`, not from this namespace: one canonical
  // string per intention is the whole point of the cut, and a per-namespace
  // copy is how "Save to Library" and "Save Workout" drifted apart before.
  const t = useTranslate("common");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
        className={className}
      >
        <Bookmark className="h-4 w-4" />
        {t("verbs.keep")}
      </Button>

      <SaveToLibraryDialog
        workout={workout}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
