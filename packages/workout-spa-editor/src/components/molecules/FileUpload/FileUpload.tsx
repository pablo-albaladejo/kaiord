import type { KRD, ValidationError } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { FileUploadInput } from "./FileUploadInput";
import { FileUploadStatus } from "./FileUploadStatus";
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
      <FileUploadInput
        fileInputRef={fileInputRef}
        accept={accept}
        disabled={disabled}
        isLoading={isLoading}
        onFileChange={handleFileChange}
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
      <FileUploadStatus
        fileName={fileName}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    </div>
  );
};
