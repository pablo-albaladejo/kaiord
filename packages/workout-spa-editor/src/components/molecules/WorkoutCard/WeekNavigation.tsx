/**
 * WeekNavigation - Previous/Next week + Today button.
 *
 * Syncs with URL via wouter useLocation.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

import { getAdjacentWeekId, getCurrentWeekId } from "../../../utils/week-utils";

const ARROW =
  "flex rounded-lg p-1.5 text-ink-body motion-safe:transition-colors hover:bg-surface-elevated hover:text-ink-strong";

export type WeekNavigationProps = {
  weekId: string;
  weekLabel: string;
};

export function WeekNavigation({ weekId, weekLabel }: WeekNavigationProps) {
  const [, navigate] = useLocation();

  const goPrev = () => navigate(`/calendar/${getAdjacentWeekId(weekId, -1)}`);
  const goNext = () => navigate(`/calendar/${getAdjacentWeekId(weekId, 1)}`);
  const goToday = () => navigate(`/calendar/${getCurrentWeekId()}`);

  return (
    <div className="flex items-center gap-3" data-testid="week-navigation">
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous week"
        className={ARROW}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-[148px] text-center text-[15px] font-medium tabular-nums text-ink-strong">
        {weekLabel}
      </span>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next week"
        className={ARROW}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={goToday}
        className="rounded-lg border border-edge px-3.5 py-1.5 text-[13px] font-medium text-ink-strong motion-safe:transition-colors hover:border-edge-strong"
      >
        Today
      </button>
    </div>
  );
}
