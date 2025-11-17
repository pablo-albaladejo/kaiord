import type { ValidationError } from "../../../types/krd";
import { detectFormat } from "../../../utils/file-format-detector";
import { ErrorMessage } from "../../atoms/ErrorMessage/ErrorMessage";
import { FormatBadge } from "./FormatBadge";

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
    const format = detectFormat(fileName);
    return (
      <div className="flex items-center gap-2">
        {format && <FormatBadge format={format} />}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loaded: {fileName}
        </p>
      </div>
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
