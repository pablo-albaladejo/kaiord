import type { ValidationError } from "../../../types/krd";
import { ErrorMessage } from "../../atoms/ErrorMessage/ErrorMessage";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

type FileUploadStatusProps = {
  fileName: string | null;
  isLoading: boolean;
  error: ErrorState;
  onRetry: () => void;
  onDismiss: () => void;
};

export function FileUploadStatus({
  fileName,
  isLoading,
  error,
  onRetry,
  onDismiss,
}: FileUploadStatusProps) {
  if (fileName && !isLoading && !error) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Loaded: {fileName}
      </p>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title={error.title}
        message={error.message}
        validationErrors={error.validationErrors}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    );
  }

  return null;
}
