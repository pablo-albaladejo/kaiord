import {
  Icon,
  ICON_MAP,
  type IconName,
  SPORT_ICON_NAME,
} from "../../atoms/Icon";

const SPORT_LABELS: Record<string, string> = {
  cycling: "Cycling",
  running: "Running",
  swimming: "Swimming",
  strength: "Strength",
};

const TILE_SIZE = 52;

export type WorkoutDetailTitleProps = {
  sport: string;
  title: string;
  tag: string | undefined;
};

const sportIcon = (sport: string): IconName =>
  SPORT_ICON_NAME[sport as keyof typeof SPORT_ICON_NAME] ?? "zap";

const sportLabel = (sport: string): string => SPORT_LABELS[sport] ?? "Workout";

/** Sport icon tile + title + "`${SportLabel} · ${tag||'Planned'}`" subtitle. */
export function WorkoutDetailTitle({
  sport,
  title,
  tag,
}: WorkoutDetailTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center justify-center rounded-[16px] bg-surface-deep"
        style={{ width: TILE_SIZE, height: TILE_SIZE }}
      >
        <Icon icon={ICON_MAP[sportIcon(sport)]} size="lg" color="muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[18px] font-bold text-slate-50">
          {title}
        </div>
        <p className="text-[12.5px] text-slate-500">
          {sportLabel(sport)} · {tag || "Planned"}
        </p>
      </div>
    </div>
  );
}
