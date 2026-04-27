import type { KRD, ValidationError } from "../../../types/krd";
import { detectFormat } from "../../../utils/file-format-detector";
import { createParseError, parseFile } from "./file-parser";
import { validateFileSize } from "./file-upload-constants";

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

function reportImported(
  filename: string,
  onImported?: (format: string) => void
) {
  if (!onImported) return;
  const detection = detectFormat(filename);
  if (detection.success) onImported(detection.format);
}

export function createFileChangeHandler(
  setFileName: (name: string | null) => void,
  setIsLoading: (loading: boolean) => void,
  setConversionProgress: (progress: number) => void,
  setError: (error: ErrorState) => void,
  onFileLoad: (krd: KRD) => void,
  handleError: (errorState: ErrorState) => void,
  createAbortController: () => AbortController,
  onImported?: (format: string) => void
) {
  return async (file: File | undefined) => {
    if (!file) return;

    const sizeError = validateFileSize(file);
    if (sizeError) {
      handleError(sizeError);
      return;
    }

    const controller = createAbortController();
    setFileName(file.name);
    setIsLoading(true);
    setConversionProgress(0);
    setError(null);

    try {
      const krd = await parseFile(
        file,
        (progress) => setConversionProgress(progress),
        controller.signal
      );
      setError(null);
      setConversionProgress(100);
      onFileLoad(krd);
      setIsLoading(false);
    } catch (error) {
      // AbortError is an expected cancellation, not a real failure.
      if (error instanceof Error && error.name === "AbortError") return;
      handleError(createParseError(error));
      return;
    }
    // Fire analytics outside the parse try so a throwing callback cannot
    // pollute the error-handling path.
    reportImported(file.name, onImported);
  };
}
