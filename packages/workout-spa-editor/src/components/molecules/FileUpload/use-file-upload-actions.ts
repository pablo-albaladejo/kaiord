import type { RefObject } from "react";
import type { KRD, ValidationError } from "../../../types/krd";
import {
  createErrorHandler,
  createFileChangeHandler,
} from "./file-upload-handlers";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

type FileUploadActionsParams = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  setIsLoading: (loading: boolean) => void;
  setFileName: (name: string | null) => void;
  setError: (error: ErrorState) => void;
  setConversionProgress: (progress: number) => void;
  resetInput: () => void;
  createAbortController: () => AbortController;
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
};

export function useFileUploadActions({
  fileInputRef,
  setIsLoading,
  setFileName,
  setError,
  setConversionProgress,
  resetInput,
  createAbortController,
  onFileLoad,
  onError,
}: FileUploadActionsParams) {
  const handleError = createErrorHandler(
    setError,
    setIsLoading,
    setFileName,
    setConversionProgress,
    resetInput,
    onError
  );

  const handleFileChange = createFileChangeHandler(
    setFileName,
    setIsLoading,
    setConversionProgress,
    setError,
    onFileLoad,
    handleError,
    createAbortController
  );

  const triggerFileInput = () => {
    setError(null);
    setConversionProgress(0);
    fileInputRef.current?.click();
  };

  const handleRetry = () => {
    setError(null);
    setConversionProgress(0);
    resetInput(); // Reset input to allow selecting the same file again
    fileInputRef.current?.click();
  };

  const handleDismiss = () => {
    setError(null);
    setConversionProgress(0);
  };

  return {
    handleFileChange,
    triggerFileInput,
    handleRetry,
    handleDismiss,
  };
}
