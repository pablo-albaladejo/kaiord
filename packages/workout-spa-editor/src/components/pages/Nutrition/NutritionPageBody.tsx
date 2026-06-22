import { useAdaptiveMaintenance } from "../../../hooks/energy/use-adaptive-maintenance";
import { useDayEnergyBalance } from "../../../hooks/energy/use-day-energy-balance";
import { AdaptiveMaintenanceCard } from "./AdaptiveMaintenanceCard";
import { IntakeEntryList } from "./IntakeEntryList";
import { IntakeLoggerForm } from "./IntakeLoggerForm";
import { MacroSummaryCard } from "./MacroSummaryCard";
import { NutritionGoalSection } from "./NutritionGoalSection";
import { PresetList } from "./PresetList";
import { EnergyTrendsSection } from "./trends/EnergyTrendsSection";
import { useIntakeActions } from "./use-intake-actions";
import { useIntakeForDate } from "./use-intake-for-date";
import { useIntakePresets } from "./use-intake-presets";
import { WeeklyPlanSection } from "./WeeklyPlanSection";

export type NutritionPageBodyProps = { profileId: string; date: string };

/**
 * Authenticated Nutrition surface: goal summary, quick logger, presets, the
 * day's entries, and the macro rings — all reading live from Dexie.
 */
export function NutritionPageBody({ profileId, date }: NutritionPageBodyProps) {
  const actions = useIntakeActions(profileId);
  const result = useDayEnergyBalance(profileId, date);
  const entries = useIntakeForDate(profileId, date);
  const presets = useIntakePresets(profileId);
  const adaptive = useAdaptiveMaintenance(profileId, date);
  const balance = result && !result.gated ? result.balance : null;

  return (
    <div className="space-y-5 px-4 py-4" data-testid="nutrition-page-body">
      <NutritionGoalSection profileId={profileId} date={date} result={result} />
      <AdaptiveMaintenanceCard adaptive={adaptive} />
      <WeeklyPlanSection profileId={profileId} date={date} />
      <EnergyTrendsSection profileId={profileId} date={date} />
      <MacroSummaryCard balance={balance} />
      <IntakeLoggerForm date={date} actions={actions} />
      <PresetList
        presets={presets}
        onApply={(presetId) => void actions.applyPreset(date, presetId)}
        onRemove={(id) => void actions.removePreset(id)}
      />
      <IntakeEntryList
        entries={entries}
        onDelete={(id) => void actions.deleteEntry(id)}
      />
    </div>
  );
}
