import { detectFormat } from "../../../utils/file-format-detector";
import { FormatBadge } from "./FormatBadge";
import { useConversionTimeEstimate } from "./use-conversion-time-estimate";

type LoadingStatusProps = {
  fileName: string;
  conversionProgress: number;
};

export function LoadingStatus({
  fileName,
  conversionProgress,
}: LoadingStatusProps) {
  const timeEstimate = useConversionTimeEstimate(true, conversionProgress);
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

