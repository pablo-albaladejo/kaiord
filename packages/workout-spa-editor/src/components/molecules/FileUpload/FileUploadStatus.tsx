import { useEffect, useState } from "react";
import type { ValidationError } from "../../../types/krd";
import { detectFormat } from "../../../utils/file-format-detector";
import { ErrorMessage } from "../../atoms/ErrorMessage/ErrorMessage";
import { FormatBadge } from "./FormatBadge";

type ErrorState = {
  title: string;
  message?: string;
  validationErrors?: Array<ValidationError>;
} | null;

type FileUploadStatusProps = {
  fileName: string | null;
  isLoading: boolean;
  conversionProgress: number;
  error: ErrorState;
  onRetry: () => void;
  onDismiss: () => void;
};

function useConversionTimeEstimate(
  isLoading: boolean,
  progress: number
): string | null {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimate, setEstimate] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
    } else if (!isLoading) {
      setStartTime(null);
      setEstimate(null);
    }
  }, [isLoading, startTime]);

  useEffect(() => {
    if (!isLoading || !startTime || progress <= 0 || progress >= 100) {
      return;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    const rate = progress / elapsed;
    const remaining = (100 - progress) / rate;

    if (remaining < 1) {
      setEstimate("Less than 1 second");
    } else if (remaining < 60) {
      setEstimate(`About ${Math.ceil(remaining)} seconds`);
    } else {
      const minutes = Math.ceil(remaining / 60);
      setEstimate(`About ${minutes} minute${minutes > 1 ? "s" : ""}`);
    }
  }, [isLoading, startTime, progress]);

  return estimate;
}

export function FileUploadStatus({
  fileName,
  isLoading,
  conversionProgress,
  error,
  onRetry,
  onDismiss,
}: FileUploadStatusProps) {
  const timeEstimate = useConversionTimeEstimate(isLoading, conversionProgress);

  if (isLoading && fileName) {
    const formatResult = detectFormat(fileName);
    const showProgress = conversionProgress > 0;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Converting {fileName}...
          </p>
          {formatResult.success && <FormatBadge format={formatResult.format} />}
        </div>
        {showProgress && (
          <div className="flex flex-col gap-1">
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
                role="progressbar"
                aria-valuenow={conversionProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Conversion progress: ${conversionProgress}%`}
              />
            </div>
            {timeEstimate && (
              <p
                className="text-xs text-gray-500 dark:text-gray-500"
                aria-live="polite"
              >
                {timeEstimate} remaining
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (fileName && !isLoading && !error) {
    const formatResult = detectFormat(fileName);

    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loaded: {fileName}
        </p>
        {formatResult.success && <FormatBadge format={formatResult.format} />}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title={error.title}
        message={error.message}
        validationErrors={error.validationErrors}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />
    );
  }

  return null;
}
