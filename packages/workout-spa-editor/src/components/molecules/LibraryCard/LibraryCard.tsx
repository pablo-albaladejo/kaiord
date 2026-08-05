import { dominantZone } from "../../../lib/workout-review/zone-emphasis";
import { zoneVar } from "../../../lib/zone-colors";
import { Pill } from "../../atoms/Pill";
import { ZoneDist } from "../ZoneDist";

export type LibraryCardProps = {
  title: string;
  /** Already-translated sport name; the row says the sport in words. */
  sportLabel: string;
  duration?: string;
  tss?: number;
  dist?: number[];
  tag?: string;
  onClick: () => void;
};

const ZONE_BAR_HEIGHT = 10;
const ZONE_BORDER_WIDTH = 4;

const CARD_CLASS =
  "w-full cursor-pointer rounded-[16px] border border-edge-soft bg-surface p-4 text-left transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] hover:border-edge-strong";

export function LibraryCard({
  title,
  sportLabel,
  duration,
  tss,
  dist,
  tag,
  onClick,
}: LibraryCardProps) {
  /* A template with no classifiable structure gets no zone colour: it has no
     dominant zone, and a neutral bar would claim it does. */
  const zone = dist ? dominantZone(dist) : null;
  /* `timeInZone` returns a length-5 all-zero array when nothing classifies, so
     a length check would always pass and render an empty bar plus its gaps. */
  const hasZones = Boolean(dist?.some((value) => value > 0));
  const meta = [sportLabel, duration, tss === undefined ? null : `${tss} TSS`]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      className={CARD_CLASS}
      style={
        zone === null
          ? undefined
          : { borderLeft: `${ZONE_BORDER_WIDTH}px solid ${zoneVar(zone)}` }
      }
      data-testid="library-card"
    >
      <div className="flex items-baseline gap-x-2 gap-y-1">
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.02em] text-ink-strong">
          {title}
        </span>
        {tag && (
          <Pill tone="neutral" className="shrink-0">
            {tag}
          </Pill>
        )}
      </div>
      {meta !== "" && (
        <span className="mt-1 block text-[12px] tabular-nums text-ink-muted">
          {meta}
        </span>
      )}
      {dist && hasZones && (
        <ZoneDist
          dist={dist}
          className="mt-2 max-w-[280px]"
          height={ZONE_BAR_HEIGHT}
        />
      )}
    </button>
  );
}
