import { useState } from "react";
import { GettingStartedTips } from "./GettingStartedTips";
import { ManualCreateSection } from "./ManualCreateSection";
import { CreateWorkoutDialog } from "../molecules/CreateWorkoutDialog/CreateWorkoutDialog";
import type { KRD, Sport, ValidationError } from "../../types/krd";

export type WelcomeSectionProps = {
  onFileLoad: (krd: KRD) => void;
  onFileError: (
    error: string,
    validationErrors?: Array<ValidationError>
  ) => void;
  onCreateWorkout: (name: string, sport: Sport) => void;
};

export function WelcomeSection({
  onFileLoad,
  onFileError,
  onCreateWorkout,
}: WelcomeSectionProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <ManualCreateSection
        onCreateClick={() => setShowCreateDialog(true)}
        onFileLoad={onFileLoad}
        onFileError={onFileError}
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
