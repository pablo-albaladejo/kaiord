import type { RefObject } from "react";

import { useTranslate } from "../../../i18n/use-translate";
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
  onImported?: (format: string) => void;
  onWarnings?: (warnings: Array<string>) => void;
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
  onImported,
  onWarnings,
}: FileUploadActionsParams) {
  const t = useTranslate("import");
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
    createAbortController,
    onImported,
    onWarnings,
    t
  );

  const handleDismiss = () => {
    setError(null);
    setConversionProgress(0);
  };

  const triggerFileInput = () => {
    handleDismiss();
    fileInputRef.current?.click();
  };

  const handleRetry = () => {
    handleDismiss();
    resetInput(); // Reset input to allow selecting the same file again
    fileInputRef.current?.click();
  };

  return {
    handleFileChange,
    triggerFileInput,
    handleRetry,
    handleDismiss,
  };
}
