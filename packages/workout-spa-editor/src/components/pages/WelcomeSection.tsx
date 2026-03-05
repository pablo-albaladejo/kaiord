import { lazy, Suspense, useState } from "react";
import { GettingStartedTips } from "./GettingStartedTips";
import { ManualCreateSection } from "./ManualCreateSection";
import { useSettingsDialogStore } from "../../store/settings-dialog-store";
import { CreateWorkoutDialog } from "../molecules/CreateWorkoutDialog/CreateWorkoutDialog";
import type { KRD, Sport, ValidationError } from "../../types/krd";

const AiWorkoutInput = lazy(() =>
  import("../organisms/AiWorkoutInput/AiWorkoutInput").then((m) => ({
    default: m.AiWorkoutInput,
  }))
);

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
  const settingsShow = useSettingsDialogStore((s) => s.show);

  return (
    <>
      <Suspense fallback={null}>
        <AiWorkoutInput onSettingsClick={settingsShow} />
      </Suspense>

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
