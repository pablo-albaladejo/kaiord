import { Icon, ICON_MAP } from "../../atoms/Icon";
import type { WeekEnergyPlanRowView } from "./week-energy-plan-view-model";

export type WeeklyPlanRowProps = { row: WeekEnergyPlanRowView };

/** One day of the weekly energy plan: weekday, expenditure, target, sport flag. */
export function WeeklyPlanRow({ row }: WeeklyPlanRowProps) {
  return (
    <div
      className="flex items-center gap-3 py-1.5 text-[13px]"
      data-testid="weekly-plan-row"
    >
      <span className="w-4 font-semibold text-slate-300">{row.dayLabel}</span>
      {row.hasWorkout ? (
        <Icon
          icon={ICON_MAP.flame}
          size="sm"
          color="inherit"
          data-testid="weekly-plan-workout"
          aria-label="Workout scheduled"
        />
      ) : (
        <span className="w-4" aria-hidden="true" />
      )}
      <span
        className="ml-auto tabular-nums text-slate-200"
        data-testid="weekly-plan-expenditure"
      >
        {row.expenditureText}
      </span>
      <span
        className="w-20 text-right tabular-nums text-slate-400"
        data-testid="weekly-plan-target"
      >
        {row.targetText}
      </span>
    </div>
  );
}
