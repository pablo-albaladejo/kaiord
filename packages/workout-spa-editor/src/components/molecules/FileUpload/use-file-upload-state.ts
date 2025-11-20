import { useRef, useState } from "react";
import type { ValidationError } from "../../../types/krd";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

export function useFileUploadState() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<ErrorState>(null);
  const [conversionProgress, setConversionProgress] = useState(0);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const abortCurrentOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const createAbortController = () => {
    abortCurrentOperation();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  };

  return {
    fileInputRef,
    isLoading,
    setIsLoading,
    fileName,
    setFileName,
    error,
    setError,
    conversionProgress,
    setConversionProgress,
    resetInput,
    abortControllerRef,
    abortCurrentOperation,
    createAbortController,
  };
}
