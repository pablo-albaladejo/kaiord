/**
 * WeekNavigation - Previous/Next week + Today button.
 *
 * Syncs with URL via wouter useLocation.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

import { getAdjacentWeekId } from "../../../utils/week-utils";

export type WeekNavigationProps = {
  weekId: string;
  weekLabel: string;
};

export function WeekNavigation({ weekId, weekLabel }: WeekNavigationProps) {
  const [, navigate] = useLocation();

  const goPrev = () => navigate(`/calendar/${getAdjacentWeekId(weekId, -1)}`);
  const goNext = () => navigate(`/calendar/${getAdjacentWeekId(weekId, 1)}`);
  const goToday = () => navigate("/calendar");

  return (
    <div className="flex items-center gap-3" data-testid="week-navigation">
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous week"
        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="min-w-[140px] text-center font-medium">{weekLabel}</span>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next week"
        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={goToday}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Today
      </button>
    </div>
  );
}
