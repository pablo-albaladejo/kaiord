import { FormatBadge } from "./FormatBadge";
import { detectFormat } from "../../../utils/file-format-detector";

type SuccessStatusProps = {
  fileName: string;
};

export function SuccessStatus({ fileName }: SuccessStatusProps) {
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
