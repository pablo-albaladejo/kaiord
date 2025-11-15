/**
 * useFileUpload Hook
 *
 * Custom hook for handling file upload logic.
 */

import { useRef, useState } from "react";
import type { KRD, ValidationError } from "../../../types/krd";
import { krdSchema } from "../../../types/schemas";
import { formatZodError } from "../../../types/validation";

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const parseFile = async (file: File): Promise<unknown> => {
    const text = await file.text();
    return JSON.parse(text);
  };

  const validateKRD = (data: unknown): KRD => {
    const result = krdSchema.safeParse(data);

    if (!result.success) {
      const validationErrors = formatZodError(result.error);
      throw {
        title: "Validation Failed",
        message:
          "File validation failed. Please check that the file is a valid KRD format.",
        validationErrors,
      };
    }

    return result.data;
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
      if (error && typeof error === "object" && "title" in error) {
        handleError(error as ErrorState);
      } else if (error instanceof SyntaxError) {
        handleError({
          title: "Invalid File Format",
          message: `Failed to parse JSON: ${error.message}`,
        });
      } else {
        handleError({
          title: "File Read Error",
          message: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
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

  const handleDismiss = () => {
    setError(null);
  };

  return {
    fileInputRef,
    isLoading,
    fileName,
    error,
    handleFileChange,
    triggerFileInput,
    handleRetry,
    handleDismiss,
  };
};
