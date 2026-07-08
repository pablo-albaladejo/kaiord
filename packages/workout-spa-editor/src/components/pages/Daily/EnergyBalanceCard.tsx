import { useState } from "react";
import { Link } from "wouter";

import { useDayEnergyBalance } from "../../../hooks/energy/use-day-energy-balance";
import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { GoalSetupDialog } from "../../molecules/GoalSetupDialog/GoalSetupDialog";
import { MacroRings } from "../Nutrition/MacroRings";
import { toEnergyBalanceViewModel } from "./energy-balance-view-model";
import { EnergyBalanceGated } from "./EnergyBalanceGated";
import { EnergyBalanceStats } from "./EnergyBalanceStats";

const COMPACT_RING_SIZE = 44;

export type EnergyBalanceCardProps = {
  profileId: string | null;
  date: string;
};

/**
 * Compact Today surface for the day's energy balance: expenditure (with a
 * measured/predicted label), intake (or "untracked"), net deficit/surplus,
 * the goal target + safety warning when present, and a "Set goal" affordance
 * launching the goal wizard. Falls back to a profile-completion prompt when
 * BMR inputs are missing for an uncovered day.
 */
export function EnergyBalanceCard({ profileId, date }: EnergyBalanceCardProps) {
  const t = useTranslate("daily");
  const [goalOpen, setGoalOpen] = useState(false);
  const result = useDayEnergyBalance(profileId, date);
  if (result === undefined) return null;
  if (result.gated) return <EnergyBalanceGated />;

  const vm = toEnergyBalanceViewModel(result.balance, result.goal);
  const hasMacros =
    result.balance.macro_actuals !== undefined ||
    result.balance.macro_targets !== undefined;
  return (
    <Card
      className="bg-primary-900 border-slate-800 p-4"
      data-testid="energy-balance-card"
    >
      <div className="flex items-center gap-3">
        <Icon icon={ICON_MAP.flame} size="md" color="inherit" />
        <p className="text-[15px] font-semibold text-slate-100 m-0">
          {t("energyBalance.title")}
        </p>
        {profileId && (
          <button
            type="button"
            onClick={() => setGoalOpen(true)}
            data-testid="energy-balance-set-goal"
            className="ml-auto text-[13px] font-semibold text-blue-400"
          >
            {t("energyBalance.setGoal")}
          </button>
        )}
      </div>
      <EnergyBalanceStats vm={vm} />
      {hasMacros && (
        <div className="mt-4 border-t border-slate-800 pt-4">
          <MacroRings
            actuals={result.balance.macro_actuals}
            targets={result.balance.macro_targets}
            size={COMPACT_RING_SIZE}
          />
        </div>
      )}
      <Link
        href="/nutrition"
        data-testid="energy-balance-nutrition-link"
        className="mt-3 block text-[13px] font-semibold text-blue-400"
      >
        {t("energyBalance.logNutrition")}
      </Link>
      {profileId && (
        <GoalSetupDialog
          open={goalOpen}
          onOpenChange={setGoalOpen}
          profileId={profileId}
          today={date}
        />
      )}
    </Card>
  );
}
