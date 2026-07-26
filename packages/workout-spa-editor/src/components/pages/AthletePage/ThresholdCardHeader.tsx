import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { Toggle } from "../../atoms/Toggle";

type ThresholdCardHeaderProps = {
  auto: boolean;
  onAutoChange: (next: boolean) => void;
};

export function ThresholdCardHeader({
  auto,
  onAutoChange,
}: ThresholdCardHeaderProps) {
  const t = useTranslate("athlete");
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-accent">
        <Icon
          icon={ICON_MAP.target}
          size="sm"
          color="inherit"
          strokeWidth={1.9}
        />
        <span className="text-[15px] font-semibold text-ink-strong">
          {t("thresholds")}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span
          className={`text-[13px] ${auto ? "text-accent" : "text-ink-muted"}`}
        >
          {auto ? t("autoZones") : t("manualZones")}
        </span>
        <Toggle
          checked={auto}
          onCheckedChange={onAutoChange}
          aria-label={t("autoZones")}
        />
      </div>
    </div>
  );
}
