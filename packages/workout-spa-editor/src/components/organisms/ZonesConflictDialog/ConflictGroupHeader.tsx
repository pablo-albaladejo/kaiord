import { pluralKey } from "../../../i18n/plural-key";
import { useTranslate } from "../../../i18n/use-translate";

export type ConflictGroupHeaderProps = {
  label: string;
  bandCount: number;
  expanded: boolean;
  onToggleExpand: () => void;
};

export const ConflictGroupHeader = ({
  label,
  bandCount,
  expanded,
  onToggleExpand,
}: ConflictGroupHeaderProps) => {
  const t = useTranslate("zones");
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">
          {t(pluralKey("conflict.bandsDiffer", bandCount), {
            count: bandCount,
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        className="text-xs text-muted-foreground hover:underline"
      >
        {expanded ? t("conflict.hide") : t("conflict.detail")}
      </button>
    </div>
  );
};
