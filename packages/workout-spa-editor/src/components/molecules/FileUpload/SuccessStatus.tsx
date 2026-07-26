import { useTranslate } from "../../../i18n/use-translate";
import { detectFormat } from "../../../utils/file-format-detector";
import { FormatBadge } from "./FormatBadge";

type SuccessStatusProps = {
  fileName: string;
};

export function SuccessStatus({ fileName }: SuccessStatusProps) {
  const t = useTranslate("import");
  const formatResult = detectFormat(fileName);

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t("status.loaded", { fileName })}
      </p>
      {formatResult.success && <FormatBadge format={formatResult.format} />}
    </div>
  );
}
