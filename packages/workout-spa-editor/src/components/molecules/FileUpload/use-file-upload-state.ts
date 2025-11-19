import { useEffect, useRef, useState } from "react";
import type { ValidationError } from "../../../types/krd";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

export function useFileUploadState() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<ErrorState>(null);
  const [conversionProgress, setConversionProgress] = useState(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Safe state setters that check if component is mounted
  const safeSetIsLoading = (loading: boolean) => {
    if (isMountedRef.current) setIsLoading(loading);
  };

  const safeSetFileName = (name: string | null) => {
    if (isMountedRef.current) setFileName(name);
  };

  const safeSetError = (errorState: ErrorState) => {
    if (isMountedRef.current) setError(errorState);
  };

  const safeSetConversionProgress = (progress: number) => {
    if (isMountedRef.current) setConversionProgress(progress);
  };

  return {
    fileInputRef,
    isLoading,
    setIsLoading: safeSetIsLoading,
    fileName,
    setFileName: safeSetFileName,
    error,
    setError: safeSetError,
    conversionProgress,
    setConversionProgress: safeSetConversionProgress,
    resetInput,
  };
}
