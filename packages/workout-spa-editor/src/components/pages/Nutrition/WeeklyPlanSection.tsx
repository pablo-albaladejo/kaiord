import { useWeeklyEnergyPlan } from "../../../hooks/energy/use-weekly-energy-plan";
import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { toWeekEnergyPlanRowView } from "./week-energy-plan-view-model";
import { WeeklyPlanRow } from "./WeeklyPlanRow";

export type WeeklyPlanSectionProps = { profileId: string; date: string };

/**
 * Forward weekly plan: each day's predicted expenditure + target and whether a
 * workout is scheduled (flame). Reads live from Dexie via `useWeeklyEnergyPlan`.
 */
export function WeeklyPlanSection({ profileId, date }: WeeklyPlanSectionProps) {
  const rows = useWeeklyEnergyPlan(profileId, date);
  const t = useTranslate("nutrition");
  return (
    <Card
      className="border-slate-800 bg-primary-900 p-4"
      data-testid="weekly-plan"
    >
      <div className="flex items-center gap-3">
        <Icon icon={ICON_MAP.calendar} size="md" color="inherit" />
        <p className="m-0 text-[15px] font-semibold text-slate-100">
          {t("plan.title")}
        </p>
        <span className="ml-auto text-[12px] font-medium text-slate-500">
          {t("plan.burnTarget")}
        </span>
      </div>
      <div className="mt-3 divide-y divide-slate-800">
        {(rows ?? []).map((row) => (
          <WeeklyPlanRow key={row.date} row={toWeekEnergyPlanRowView(row)} />
        ))}
      </div>
    </Card>
  );
}
