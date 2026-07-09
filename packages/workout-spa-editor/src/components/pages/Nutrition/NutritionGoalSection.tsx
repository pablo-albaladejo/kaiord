import { useState } from "react";

import type { DayEnergyBalanceResult } from "../../../application/energy/day-energy-balance-result";
import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { GoalSetupDialog } from "../../molecules/GoalSetupDialog/GoalSetupDialog";
import { toEnergyBalanceViewModel } from "../Daily/energy-balance-view-model";

export type NutritionGoalSectionProps = {
  profileId: string;
  date: string;
  result: DayEnergyBalanceResult | undefined;
};

/**
 * Goal setup + summary: shows the day's target (or a prompt when no goal is
 * set) and launches the shared GoalSetupDialog wizard.
 */
export function NutritionGoalSection({
  profileId,
  date,
  result,
}: NutritionGoalSectionProps) {
  const [goalOpen, setGoalOpen] = useState(false);
  const t = useTranslate("nutrition");
  const vm =
    result && !result.gated
      ? toEnergyBalanceViewModel(result.balance, result.goal)
      : null;
  return (
    <Card
      className="border-slate-800 bg-primary-900 p-4"
      data-testid="nutrition-goal"
    >
      <div className="flex items-center gap-3">
        <Icon icon={ICON_MAP.target} size="md" color="inherit" />
        <p className="m-0 text-[15px] font-semibold text-slate-100">
          {t("goal.title")}
        </p>
        <button
          type="button"
          onClick={() => setGoalOpen(true)}
          data-testid="nutrition-set-goal"
          className="ml-auto text-[13px] font-semibold text-blue-400"
        >
          {vm?.target ? t("goal.edit") : t("goal.set")}
        </button>
      </div>
      <p
        className="m-0 mt-3 text-[13px] text-slate-300"
        data-testid="nutrition-goal-target"
      >
        {vm?.target ? t("goal.target", { value: vm.target }) : t("goal.none")}
      </p>
      <GoalSetupDialog
        open={goalOpen}
        onOpenChange={setGoalOpen}
        profileId={profileId}
        today={date}
      />
    </Card>
  );
}
