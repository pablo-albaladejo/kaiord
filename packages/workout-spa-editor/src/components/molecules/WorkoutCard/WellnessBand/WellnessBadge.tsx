import { Link } from "wouter";

import { useTranslate } from "../../../../i18n/use-translate";
import type { WellnessBadgeDef } from "./wellness-badge-defs";
import { WELLNESS_BADGE_ROUTES } from "./wellness-badge-routes";

export type WellnessBadgeProps = {
  def: WellnessBadgeDef;
  value: string;
};

const badgeClass =
  "inline-flex items-center gap-1 rounded-lg bg-surface-elevated px-1.5 py-0.5 text-xs tabular-nums text-ink-body motion-safe:transition-colors hover:bg-surface-deep hover:text-ink-strong";

export function WellnessBadge({ def, value }: WellnessBadgeProps) {
  const t = useTranslate("calendar");
  return (
    <Link
      href={WELLNESS_BADGE_ROUTES[def.metric]}
      aria-label={`${t(`wellnessBand.${def.metric}`)} ${value}`}
      data-testid={`wellness-badge-${def.metric}`}
      className={badgeClass}
    >
      <def.icon className="h-3 w-3 shrink-0" />
      <span>{value}</span>
    </Link>
  );
}
