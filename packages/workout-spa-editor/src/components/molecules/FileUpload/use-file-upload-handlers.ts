import type { KRD, ValidationError } from "../../../types/krd";
import { createParseError, parseFile, validateKRD } from "./file-parser";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

type FileUploadHandlersProps = {
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
  setError: (error: ErrorState) => void;
  setIsLoading: (loading: boolean) => void;
  setFileName: (name: string | null) => void;
  resetInput: () => void;
};

export function createFileUploadHandlers({
  onFileLoad,
  onError,
  setError,
  setIsLoading,
  setFileName,
  resetInput,
}: FileUploadHandlersProps) {
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

  return { handleFileChange };
}
