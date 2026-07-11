import { useTranslate } from "../../../i18n/use-translate";
import type { ActiveSport } from "../../../lib/athlete";
import { Icon, ICON_MAP, SPORT_ICON_NAME } from "../../atoms/Icon";
import { Pill } from "../../atoms/Pill";

export type CreateResultHeaderProps = {
  sport: ActiveSport;
  title: string;
};

/** Generated-session header: sport tile, title, AI provenance pill. */
export function CreateResultHeader({ sport, title }: CreateResultHeaderProps) {
  const t = useTranslate("create-workout");
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-surface-deep">
        <Icon icon={ICON_MAP[SPORT_ICON_NAME[sport]]} size="md" color="muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[16px] font-bold text-ink-strong">
            {title}
          </span>
          <Pill tone="accent" icon="sparkle">
            {t("result.aiBadge")}
          </Pill>
        </div>
        <p className="text-[12.5px] text-ink-muted">{t("result.tapToTune")}</p>
      </div>
    </div>
  );
}
