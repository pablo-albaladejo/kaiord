import { useTranslate } from "../../../i18n/use-translate";
import {
  Icon,
  ICON_MAP,
  type IconName,
  SPORT_ICON_NAME,
} from "../../atoms/Icon";

const SPORT_LABEL_KEYS: Record<string, string> = {
  cycling: "sport.cycling",
  running: "sport.running",
  swimming: "sport.swimming",
  strength: "sport.strength",
};

const TILE_SIZE = 52;

export type WorkoutDetailTitleProps = {
  sport: string;
  title: string;
  tag: string | undefined;
};

const sportIcon = (sport: string): IconName =>
  SPORT_ICON_NAME[sport as keyof typeof SPORT_ICON_NAME] ?? "zap";

/** Sport icon tile + title + "`${SportLabel} · ${tag||'Planned'}`" subtitle. */
export function WorkoutDetailTitle({
  sport,
  title,
  tag,
}: WorkoutDetailTitleProps) {
  const t = useTranslate("workout-detail");
  const labelKey = SPORT_LABEL_KEYS[sport];
  const sportLabel = labelKey ? t(labelKey) : t("fallbackTitle");
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-[16px] bg-surface-deep"
        style={{ width: TILE_SIZE, height: TILE_SIZE }}
      >
        <Icon icon={ICON_MAP[sportIcon(sport)]} size="lg" color="muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[18px] font-bold text-ink-strong">
          {title}
        </div>
        <p className="text-[12.5px] text-ink-muted">
          {sportLabel} · {tag || t("title.planned")}
        </p>
      </div>
    </div>
  );
}
