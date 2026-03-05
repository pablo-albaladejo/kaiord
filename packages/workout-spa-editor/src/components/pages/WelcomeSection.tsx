import { Plus } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { GettingStartedTips } from "./GettingStartedTips";
import { OrDivider } from "./OrDivider";
import { useSettingsDialogStore } from "../../store/settings-dialog-store";
import { Button } from "../atoms/Button/Button";
import { CreateWorkoutDialog } from "../molecules/CreateWorkoutDialog/CreateWorkoutDialog";
import { FileUpload } from "../molecules/FileUpload/FileUpload";
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
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to Workout Editor
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Create, edit, and manage your structured workout files in KRD format.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="w-full"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create New Workout
          </Button>

          <OrDivider />

          <FileUpload onFileLoad={onFileLoad} onError={onFileError} />
        </div>
      </div>

      <Suspense fallback={null}>
        <AiWorkoutInput onSettingsClick={settingsShow} />
      </Suspense>

      <GettingStartedTips />

      <CreateWorkoutDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={onCreateWorkout}
      />
    </>
  );
}
