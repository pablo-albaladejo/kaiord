import type { KRD, ValidationError } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { ErrorMessage } from "../../atoms/ErrorMessage/ErrorMessage";
import { useFileUpload } from "./useFileUpload";

export type FileUploadProps = {
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
};

export const FileUpload = ({
  onFileLoad,
  onError,
  accept = ".krd,.json",
  className = "",
  disabled = false,
}: FileUploadProps) => {
  const {
    fileInputRef,
    isLoading,
    fileName,
    error,
    handleFileChange,
    triggerFileInput,
    handleRetry,
    handleDismiss,
  } = useFileUpload({ onFileLoad, onError });

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files?.[0])}
        className="hidden"
        disabled={disabled || isLoading}
        aria-label="Upload workout file"
      />
      <Button
        onClick={triggerFileInput}
        disabled={disabled || isLoading}
        loading={isLoading}
        variant="primary"
        size="md"
      >
        {isLoading ? "Loading..." : "Upload Workout File"}
      </Button>
      {fileName && !isLoading && !error && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loaded: {fileName}
        </p>
      )}
      {error && (
        <ErrorMessage
          title={error.title}
          message={error.message}
          validationErrors={error.validationErrors}
          onRetry={handleRetry}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
};
