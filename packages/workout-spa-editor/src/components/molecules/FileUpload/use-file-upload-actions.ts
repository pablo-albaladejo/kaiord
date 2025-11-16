import type { RefObject } from "react";
import type { KRD, ValidationError } from "../../../types/krd";
import { createParseError, parseFile, validateKRD } from "./file-parser";

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
  resetInput: () => void;
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
};

export function useFileUploadActions({
  fileInputRef,
  setIsLoading,
  setFileName,
  setError,
  resetInput,
  onFileLoad,
  onError,
}: FileUploadActionsParams) {
  const handleError = (errorState: ErrorState) => {
    setError(errorState);
    setIsLoading(false);
    setFileName(null);
    resetInput();
    if (errorState && onError) {
      onError(
        errorState.message || errorState.title,
        errorState.validationErrors
      );
    }
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setIsLoading(true);
    try {
      const krd = validateKRD(await parseFile(file));
      setError(null);
      onFileLoad(krd);
      setIsLoading(false);
    } catch (error) {
      handleError(createParseError(error));
    }
  };

  const triggerFileInput = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleRetry = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleDismiss = () => setError(null);

  return {
    handleFileChange,
    triggerFileInput,
    handleRetry,
    handleDismiss,
  };
}
