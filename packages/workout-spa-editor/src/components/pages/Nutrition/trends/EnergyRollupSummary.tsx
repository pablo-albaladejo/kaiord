import type { EnergyRollup } from "../../../../application/energy/build-energy-rollup";
import { useTranslate } from "../../../../i18n/use-translate";
import { toEnergyRollupView } from "./energy-rollup-view-model";

export type EnergyRollupSummaryProps = { rollup: EnergyRollup };

const NET_TONE_CLASS: Record<string, string> = {
  deficit: "text-emerald-400",
  surplus: "text-amber-400",
  even: "text-ink-body",
  unknown: "text-ink-muted",
};

/** Compact range roll-up: average burn/intake, net deficit/surplus, coverage. */
export function EnergyRollupSummary({ rollup }: EnergyRollupSummaryProps) {
  const t = useTranslate("nutrition");
  const vm = toEnergyRollupView(rollup, t);
  return (
    <div
      data-testid="energy-rollup-summary"
      className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-body"
    >
      <span data-testid="rollup-avg-expenditure">
        {t("trends.avgBurn", { value: vm.avgExpenditure })}
      </span>
      <span data-testid="rollup-avg-intake">
        {t("trends.avgIntake", { value: vm.avgIntake })}
      </span>
      <span data-testid="rollup-net" className={NET_TONE_CLASS[vm.netTone]}>
        {t("trends.net", { value: vm.net })}
      </span>
      <span className="text-ink-muted">{vm.daysTracked}</span>
    </div>
  );
}
