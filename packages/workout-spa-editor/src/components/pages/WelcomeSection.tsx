import type { RefObject } from "react";
import { useState } from "react";

import type { KRD, Sport, ValidationError } from "../../types/krd";
import { CreateWorkoutDialog } from "../molecules/CreateWorkoutDialog/CreateWorkoutDialog";
import { GettingStartedTips } from "./GettingStartedTips";
import { ManualCreateSection } from "./ManualCreateSection";

export type WelcomeSectionProps = {
  onFileLoad: (krd: KRD) => void;
  onFileError: (
    error: string,
    validationErrors?: Array<ValidationError>
  ) => void;
  onCreateWorkout: (name: string, sport: Sport) => void;
  /**
   * Optional ref forwarded to the file input inside `ManualCreateSection`
   * so the editor's import mode can scroll-into-view and focus it.
   */
  fileInputRef?: RefObject<HTMLInputElement | null>;
  /**
   * Whether to start with the manual / upload section expanded. The
   * editor's import mode passes true so the file input is visible.
   */
  defaultExpandManual?: boolean;
};

export function WelcomeSection({
  onFileLoad,
  onFileError,
  onCreateWorkout,
  fileInputRef,
  defaultExpandManual = false,
}: WelcomeSectionProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <ManualCreateSection
        onCreateClick={() => setShowCreateDialog(true)}
        onFileLoad={onFileLoad}
        onFileError={onFileError}
        fileInputRef={fileInputRef}
        defaultExpanded={defaultExpandManual}
      />

      <GettingStartedTips />

      <CreateWorkoutDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={onCreateWorkout}
      />
    </>
  );
}
