import type { RefObject } from "react";
import type { KRD, ValidationError } from "../../../types/krd";
import { createParseError, parseFile } from "./file-parser";

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
  onFileLoad,
  onError,
}: FileUploadActionsParams) {
  const handleError = (errorState: ErrorState) => {
    setError(errorState);
    setIsLoading(false);
    setFileName(null);
    setConversionProgress(0);
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
    setConversionProgress(0);
    setError(null);
    try {
      const krd = await parseFile(file, (progress) => {
        setConversionProgress(progress);
      });
      setError(null);
      setConversionProgress(100);
      onFileLoad(krd);
      setIsLoading(false);
    } catch (error) {
      handleError(createParseError(error));
    }
  };

  const triggerFileInput = () => {
    setError(null);
    setConversionProgress(0);
    fileInputRef.current?.click();
  };

  const handleRetry = () => {
    setError(null);
    setConversionProgress(0);
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
