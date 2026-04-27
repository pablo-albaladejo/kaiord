import type { KRD, ValidationError } from "../../../types/krd";
import { useFileUploadActions } from "./use-file-upload-actions";
import { useFileUploadState } from "./use-file-upload-state";

type UseFileUploadProps = {
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
  /**
   * Called after a successful import with the detected file format
   * (e.g., `"fit"`, `"tcx"`, `"zwo"`, `"krd"`, `"gcn"`). Intended for
   * analytics; not invoked on failure or when format detection fails.
   */
  onImported?: (format: string) => void;
};

export const useFileUpload = ({
  onFileLoad,
  onError,
  onImported,
}: UseFileUploadProps) => {
  const state = useFileUploadState();
  const actions = useFileUploadActions({
    ...state,
    onFileLoad,
    onError,
    onImported,
  });

  return {
    fileInputRef: state.fileInputRef,
    isLoading: state.isLoading,
    fileName: state.fileName,
    error: state.error,
    conversionProgress: state.conversionProgress,
    abortCurrentOperation: state.abortCurrentOperation,
    ...actions,
  };
};
