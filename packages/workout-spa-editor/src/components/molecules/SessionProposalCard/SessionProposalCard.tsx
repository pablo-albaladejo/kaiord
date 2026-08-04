import type { ReactNode } from "react";

import { dominantZone } from "../../../lib/workout-review/zone-emphasis";
import { zoneVar } from "../../../lib/zone-colors";
import { ZoneDist } from "../ZoneDist";

/** `was` is the value this metric is replacing. Absent means there is nothing
    to compare against — the metric then renders alone, with no dash and no
    empty comparison row. */
export type ProposalMetric = {
  value: string;
  was?: string;
  label: string;
};

export type SessionProposalCardProps = {
  title: string;
  subtitle?: string;
  metrics: ProposalMetric[];
  dist: number[];
  /** Actions for this proposal, rendered in their own footer row. */
  children?: ReactNode;
};

const ZONE_BAR_HEIGHT = 10;
const ZONE_BORDER_WIDTH = 4;

export function SessionProposalCard({
  title,
  subtitle,
  metrics,
  dist,
  children,
}: SessionProposalCardProps) {
  const zone = dominantZone(dist);

  return (
    <div
      className="overflow-hidden rounded-[16px] border border-edge-soft bg-surface"
      style={
        zone === null
          ? undefined
          : { borderLeft: `${ZONE_BORDER_WIDTH}px solid ${zoneVar(zone)}` }
      }
      data-testid="session-proposal"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="flex-1 text-[15px] font-semibold text-ink-strong">
            {title}
          </span>
          {subtitle && (
            <span className="text-[12.5px] text-ink-muted">{subtitle}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col gap-0.5">
              <span className="text-[20px] font-semibold tracking-[-0.02em] tabular-nums text-ink-strong">
                {metric.value}
              </span>
              <span className="text-[12px] tabular-nums text-ink-muted">
                {metric.was ?? metric.label}
              </span>
            </div>
          ))}
        </div>
        {dist.length > 0 && <ZoneDist dist={dist} height={ZONE_BAR_HEIGHT} />}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 border-t border-edge-soft p-4">
          {children}
        </div>
      )}
    </div>
  );
}
