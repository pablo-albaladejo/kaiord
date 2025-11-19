import type { KRD, ValidationError } from "../../../types/krd";
import { createParseError, parseFile } from "./file-parser";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

export function createErrorHandler(
  setError: (error: ErrorState) => void,
  setIsLoading: (loading: boolean) => void,
  setFileName: (name: string | null) => void,
  setConversionProgress: (progress: number) => void,
  resetInput: () => void,
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void
) {
  return (errorState: ErrorState) => {
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
}

export function createFileChangeHandler(
  setFileName: (name: string | null) => void,
  setIsLoading: (loading: boolean) => void,
  setConversionProgress: (progress: number) => void,
  setError: (error: ErrorState) => void,
  onFileLoad: (krd: KRD) => void,
  handleError: (errorState: ErrorState) => void
) {
  return async (file: File | undefined) => {
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
}
