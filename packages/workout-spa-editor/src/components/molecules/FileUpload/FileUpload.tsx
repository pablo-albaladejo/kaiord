<<<<<<< HEAD
import type { KRD, ValidationError } from "../../../types/krd";
import { FileUploadButton } from "./FileUploadButton";
import { FileUploadInput } from "./FileUploadInput";
import { FileUploadStatus } from "./FileUploadStatus";
import { useFileUpload } from "./useFileUpload";
=======
import { useRef, useState } from "react";
import type { KRD, ValidationError } from "../../../types/krd";
import { krdSchema } from "../../../types/schemas";
import { formatZodError } from "../../../types/validation";
import { Button } from "../../atoms/Button/Button";
import { ErrorMessage } from "../../atoms/ErrorMessage/ErrorMessage";
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)

export type FileUploadProps = {
  onFileLoad: (krd: KRD) => void;
  onError?: (error: string, validationErrors?: Array<ValidationError>) => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
};

<<<<<<< HEAD
=======
type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
export const FileUpload = ({
  onFileLoad,
  onError,
  accept = ".krd,.json",
  className = "",
  disabled = false,
}: FileUploadProps) => {
<<<<<<< HEAD
  const upload = useFileUpload({ onFileLoad, onError });

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <FileUploadInput
        fileInputRef={upload.fileInputRef}
        accept={accept}
        disabled={disabled}
        isLoading={upload.isLoading}
        onFileChange={upload.handleFileChange}
      />
      <FileUploadButton
        onClick={upload.triggerFileInput}
        disabled={disabled}
        isLoading={upload.isLoading}
      />
      <FileUploadStatus
        fileName={upload.fileName}
        isLoading={upload.isLoading}
        error={upload.error}
        onRetry={upload.handleRetry}
        onDismiss={upload.handleDismiss}
      />
=======
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<ErrorState>(null);

  const handleButtonClick = () => {
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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);

    try {
      // Read file content
      const text = await file.text();

      // Parse JSON
      let jsonData: unknown;
      try {
        jsonData = JSON.parse(text);
      } catch (parseError) {
        const errorMessage = `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : "Invalid JSON format"}`;
        setError({
          title: "Invalid File Format",
          message: errorMessage,
        });
        onError?.(errorMessage);
        setIsLoading(false);
        setFileName(null);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Validate against KRD schema
      const result = krdSchema.safeParse(jsonData);

      if (!result.success) {
        const validationErrors = formatZodError(result.error);
        const errorMessage =
          "File validation failed. Please check that the file is a valid KRD format.";
        setError({
          title: "Validation Failed",
          message: errorMessage,
          validationErrors,
        });
        onError?.(errorMessage, validationErrors);
        setIsLoading(false);
        setFileName(null);
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Success - load the workout
      setError(null);
      onFileLoad(result.data);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`;
      setError({
        title: "File Read Error",
        message: errorMessage,
      });
      onError?.(errorMessage);
      setIsLoading(false);
      setFileName(null);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isLoading}
        aria-label="Upload workout file"
      />
      <Button
        onClick={handleButtonClick}
        disabled={disabled || isLoading}
        loading={isLoading}
        variant="primary"
        size="md"
      >
        {isLoading ? "Loading..." : "Upload Workout File"}
      </Button>
      {fileName && !isLoading && !error && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loaded: {fileName}
        </p>
      )}
      {error && (
        <ErrorMessage
          title={error.title}
          message={error.message}
          validationErrors={error.validationErrors}
          onRetry={handleRetry}
          onDismiss={handleDismiss}
        />
      )}
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
    </div>
  );
};
