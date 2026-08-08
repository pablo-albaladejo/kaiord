import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutFileFormat } from "../../../utils/file-format-detector";
import { getFormatName } from "../../../utils/file-format-metadata";

type FormatBadgeProps = {
  format: WorkoutFileFormat;
  className?: string;
};

/* One neutral chip for every format. Five arbitrary hues competed with
   nothing: the format's name already says which one it is, and the five
   product hues belong to training zones. */
const FORMAT_CHIP_CLASS =
  "bg-surface-elevated text-ink-body border border-edge";

export function FormatBadge({ format, className = "" }: FormatBadgeProps) {
  const t = useTranslate("import");
  const formatName = getFormatName(format);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FORMAT_CHIP_CLASS} ${className}`}
      role="status"
      aria-label={t("badge.ariaLabel", { format: formatName })}
    >
      {formatName}
    </span>
  );
}
