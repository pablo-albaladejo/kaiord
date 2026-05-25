import { Link } from "wouter";

import type { WellnessBadgeDef } from "./wellness-badge-defs";
import { WELLNESS_BADGE_ROUTES } from "./wellness-badge-routes";

export type WellnessBadgeProps = {
  def: WellnessBadgeDef;
  value: string;
};

const badgeClass =
  "inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700";

export function WellnessBadge({ def, value }: WellnessBadgeProps) {
  return (
    <Link
      href={WELLNESS_BADGE_ROUTES[def.metric]}
      aria-label={`${def.label} ${value}`}
      data-testid={`wellness-badge-${def.metric}`}
      className={badgeClass}
    >
      <def.icon className="h-3 w-3 shrink-0" />
      <span>{value}</span>
    </Link>
  );
}
