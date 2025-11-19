import type { KRD, ValidationError } from "../../../types/krd";
import { useFileUploadActions } from "./use-file-upload-actions";
import { useFileUploadState } from "./use-file-upload-state";

type UseFileUploadProps = {
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
};

export const useFileUpload = ({ onFileLoad, onError }: UseFileUploadProps) => {
  const state = useFileUploadState();
  const actions = useFileUploadActions({
    ...state,
    onFileLoad,
    onError,
  });

  return {
    fileInputRef: state.fileInputRef,
    isLoading: state.isLoading,
    fileName: state.fileName,
    error: state.error,
    conversionProgress: state.conversionProgress,
    ...actions,
  };
};
