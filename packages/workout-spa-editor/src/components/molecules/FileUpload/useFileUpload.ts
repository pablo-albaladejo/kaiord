import { useRef, useState } from "react";
import type { KRD, ValidationError } from "../../../types/krd";
import { createParseError, parseFile, validateKRD } from "./file-parser";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

type UseFileUploadProps = {
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
};

export const useFileUpload = ({ onFileLoad, onError }: UseFileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<ErrorState>(null);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      const jsonData = await parseFile(file);
      const krd = validateKRD(jsonData);
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

  return {
    fileInputRef,
    isLoading,
    fileName,
    error,
    handleFileChange,
    triggerFileInput,
    handleRetry,
    handleDismiss: () => setError(null),
  };
};
