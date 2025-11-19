import { useRef, useState } from "react";
import type { ValidationError } from "../../../types/krd";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

export function useFileUploadState() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<ErrorState>(null);
  const [conversionProgress, setConversionProgress] = useState(0);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
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
  };
}
