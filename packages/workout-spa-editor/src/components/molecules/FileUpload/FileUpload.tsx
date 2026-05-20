import { type RefObject, useEffect } from "react";

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
  /**
   * Optional ref exposing the underlying `<input type="file">` to a
   * parent. Used by the editor's import mode to focus the input on
   * mount via a chain from `EditorNewWorkout`.
   */
  inputRef?: RefObject<HTMLInputElement | null>;
};

export const FileUpload = ({
  onFileLoad,
  onError,
  onImported,
  accept = ".fit,.tcx,.zwo,.krd,.json,.gcn",
  className = "",
  disabled = false,
  inputRef,
}: FileUploadProps) => {
  const upload = useFileUpload({ onFileLoad, onError, onImported });

  useEffect(() => {
    if (!inputRef) return;
    inputRef.current = upload.fileInputRef.current;
    return () => {
      if (inputRef) inputRef.current = null;
    };
  }, [inputRef, upload.fileInputRef]);

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
