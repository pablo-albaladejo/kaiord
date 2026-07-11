import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import type { WeekEnergyPlanRowView } from "./week-energy-plan-view-model";

export type WeeklyPlanRowProps = { row: WeekEnergyPlanRowView };

/** One day of the weekly energy plan: weekday, expenditure, target, sport flag. */
export function WeeklyPlanRow({ row }: WeeklyPlanRowProps) {
  const t = useTranslate("nutrition");
  return (
    <div
      className="flex items-center gap-3 py-1.5 text-[13px]"
      data-testid="weekly-plan-row"
    >
      <span className="w-4 font-semibold text-ink-body">{row.dayLabel}</span>
      {row.hasWorkout ? (
        <Icon
          icon={ICON_MAP.flame}
          size="sm"
          color="inherit"
          data-testid="weekly-plan-workout"
          aria-label={t("plan.workoutScheduled")}
        />
      ) : (
        <span className="w-4" aria-hidden="true" />
      )}
      <span
        className="ml-auto tabular-nums text-ink-body"
        data-testid="weekly-plan-expenditure"
      >
        {row.expenditureText}
      </span>
      <span
        className="w-20 text-right tabular-nums text-ink-muted"
        data-testid="weekly-plan-target"
      >
        {row.targetText}
      </span>
    </div>
  );
}
