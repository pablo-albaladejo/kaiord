import type { KRD, ValidationError } from "../../../types/krd";
import { FileUploadButton } from "./FileUploadButton";
import { FileUploadInput } from "./FileUploadInput";
import { FileUploadStatus } from "./FileUploadStatus";
import { useFileUpload } from "./useFileUpload";

export type FileUploadProps = {
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
  /**
   * Optional callback fired after a successful import with the detected
   * file format (e.g., `"fit"`, `"tcx"`). Use this to forward an
   * analytics event without coupling the upload component to any port.
   */
  onImported?: (format: string) => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
};

export const FileUpload = ({
  onFileLoad,
  onError,
  onImported,
  accept = ".fit,.tcx,.zwo,.krd,.json,.gcn",
  className = "",
  disabled = false,
}: FileUploadProps) => {
  const upload = useFileUpload({ onFileLoad, onError, onImported });

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
