import type { KRD, ValidationError } from "../../types/krd";
import { FileUpload } from "../molecules/FileUpload/FileUpload";

export type WelcomeSectionProps = {
  onFileLoad: (krd: KRD) => void;
  onFileError: (
    error: string,
    validationErrors?: Array<ValidationError>
  ) => void;
};

export function WelcomeSection({
  onFileLoad,
  onFileError,
}: WelcomeSectionProps) {
  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to Workout Editor
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Create, edit, and manage your structured workout files in KRD format.
        </p>
        <FileUpload onFileLoad={onFileLoad} onError={onFileError} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Getting Started
        </h3>
        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
          <li>• Load an existing workout file</li>
          <li>• Create a new workout from scratch</li>
          <li>• Use templates for common workout patterns</li>
        </ul>
      </div>
    </>
  );
}
