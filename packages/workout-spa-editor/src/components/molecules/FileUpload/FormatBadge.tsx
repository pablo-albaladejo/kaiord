import type { SupportedFormat } from "../../../utils/file-format-detector";
import { getFormatName } from "../../../utils/file-format-detector";

type FormatBadgeProps = {
  format: SupportedFormat;
};

export function FormatBadge({ format }: FormatBadgeProps) {
  const formatName = getFormatName(format);

  const colorClasses = {
    fit: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    tcx: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    pwx: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    krd: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClasses[format]}`}
    >
      {formatName}
    </span>
  );
}
