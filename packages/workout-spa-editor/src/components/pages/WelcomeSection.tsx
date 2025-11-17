import { Plus } from "lucide-react";
import { useState } from "react";
import type { KRD, Sport, ValidationError } from "../../types/krd";
import { Button } from "../atoms/Button/Button";
import { CreateWorkoutDialog } from "../molecules/CreateWorkoutDialog/CreateWorkoutDialog";
import { FileUpload } from "../molecules/FileUpload/FileUpload";

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
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
          Welcome to Workout Editor
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600 kiroween:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400 kiroween:bg-gray-800 kiroween:text-gray-300">
                Or
              </span>
            </div>
          </div>

          <FileUpload onFileLoad={onFileLoad} onError={onFileError} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white kiroween:text-white">
          Getting Started
        </h3>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400 kiroween:text-gray-300">
          <li>• Create a new workout from scratch</li>
          <li>• Load an existing workout file</li>
          <li>• Add, edit, and organize workout steps</li>
        </ul>
      </div>

      <CreateWorkoutDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={onCreateWorkout}
      />
    </>
  );
}
