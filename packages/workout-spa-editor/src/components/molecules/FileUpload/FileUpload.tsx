import { FileUploadButton } from "./FileUploadButton";
import { FileUploadInput } from "./FileUploadInput";
import { FileUploadStatus } from "./FileUploadStatus";
import { useFileUpload } from "./useFileUpload";
import type { KRD, ValidationError } from "../../../types/krd";

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
  accept = ".fit,.tcx,.zwo,.krd,.json,.gcn",
  className = "",
  disabled = false,
}: FileUploadProps) => {
  const upload = useFileUpload({ onFileLoad, onError });

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <FileUploadInput
        fileInputRef={upload.fileInputRef}
        accept={accept}
        disabled={disabled}
        isLoading={upload.isLoading}
        onFileChange={upload.handleFileChange}
      />
      <FileUploadButton
        onClick={upload.triggerFileInput}
        disabled={disabled}
        isLoading={upload.isLoading}
      />
      <FileUploadStatus
        fileName={upload.fileName}
        isLoading={upload.isLoading}
        conversionProgress={upload.conversionProgress}
        error={upload.error}
        onRetry={upload.handleRetry}
        onDismiss={upload.handleDismiss}
      />
    </div>
  );
};
