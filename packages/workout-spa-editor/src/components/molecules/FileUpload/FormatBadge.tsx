import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFormatName } from "../../../utils/file-format-metadata";

type FormatBadgeProps = {
  format: WorkoutFileFormat;
  className?: string;
};

const formatColors: Record<WorkoutFileFormat, string> = {
  fit: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  tcx: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  zwo: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  krd: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export function FormatBadge({ format, className = "" }: FormatBadgeProps) {
  const colorClass = formatColors[format];
  const formatName = getFormatName(format);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
      role="status"
      aria-label={`File format: ${formatName}`}
    >
      {formatName}
    </span>
  );
}
