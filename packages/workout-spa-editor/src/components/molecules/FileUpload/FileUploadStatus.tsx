import type { ValidationError } from "../../../types/krd";
import { ErrorMessage } from "../../atoms/ErrorMessage/ErrorMessage";
import { LoadingStatus } from "./LoadingStatus";
import { SuccessStatus } from "./SuccessStatus";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

type FileUploadStatusProps = {
  fileName: string | null;
  isLoading: boolean;
  conversionProgress: number;
  error: ErrorState;
  onRetry: () => void;
  onDismiss: () => void;
};

export function FileUploadStatus({
  fileName,
  isLoading,
  conversionProgress,
  error,
  onRetry,
  onDismiss,
}: FileUploadStatusProps) {
  if (isLoading && fileName) {
    return (
      <LoadingStatus
        fileName={fileName}
        conversionProgress={conversionProgress}
      />
    );
  }

  if (fileName && !isLoading && !error) {
    return <SuccessStatus fileName={fileName} />;
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
