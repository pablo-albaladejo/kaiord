import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP, SPORT_ICON_NAME } from "../../atoms/Icon";
import { Pill } from "../../atoms/Pill";
import { ZoneDist } from "../ZoneDist";

export type LibraryCardProps = {
  title: string;
  sport: string;
  duration?: string;
  tss?: number;
  dist?: number[];
  tag?: string;
  onClick: () => void;
};

const SPORT_FALLBACK = "bike" as const;

export function LibraryCard({
  title,
  sport,
  duration,
  tss,
  dist,
  tag,
  onClick,
}: LibraryCardProps) {
  const sportIcon =
    SPORT_ICON_NAME[sport as keyof typeof SPORT_ICON_NAME] ?? SPORT_FALLBACK;

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className="cursor-pointer bg-primary-900 border-slate-800 p-4"
      data-testid="library-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
          <Icon icon={ICON_MAP[sportIcon]} size="md" color="inherit" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[15px] font-bold text-slate-50">
            {title}
          </p>
          <LibraryCardMeta duration={duration} tss={tss} />
        </div>
        {tag && (
          <Pill tone="neutral" className="shrink-0">
            {tag}
          </Pill>
        )}
      </div>
      {dist && dist.length > 0 && (
        <ZoneDist dist={dist} className="mt-3" height={8} />
      )}
    </Card>
  );
}

type LibraryCardMetaProps = {
  duration?: string;
  tss?: number;
};

function LibraryCardMeta({ duration, tss }: LibraryCardMetaProps) {
  if (duration === undefined && tss === undefined) return null;

  return (
    <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-slate-400">
      {duration !== undefined && (
        <span className="flex items-center gap-1">
          <Icon icon={ICON_MAP.clock} size="xs" color="inherit" />
          {duration}
        </span>
      )}
      {duration !== undefined && tss !== undefined && (
        <span aria-hidden="true">·</span>
      )}
      {tss !== undefined && (
        <span className="flex items-center gap-1">
          <Icon icon={ICON_MAP.flame} size="xs" color="inherit" />
          {tss} TSS
        </span>
      )}
    </div>
  );
}
