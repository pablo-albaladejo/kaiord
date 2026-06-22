import type { EnergyRollup } from "../../../../application/energy/build-energy-rollup";
import { toEnergyRollupView } from "./energy-rollup-view-model";

export type EnergyRollupSummaryProps = { rollup: EnergyRollup };

const NET_TONE_CLASS: Record<string, string> = {
  deficit: "text-emerald-400",
  surplus: "text-amber-400",
  even: "text-slate-200",
  unknown: "text-slate-400",
};

/** Compact range roll-up: average burn/intake, net deficit/surplus, coverage. */
export function EnergyRollupSummary({ rollup }: EnergyRollupSummaryProps) {
  const vm = toEnergyRollupView(rollup);
  return (
    <div
      data-testid="energy-rollup-summary"
      className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-300"
    >
      <span data-testid="rollup-avg-expenditure">
        Avg burn {vm.avgExpenditure}
      </span>
      <span data-testid="rollup-avg-intake">Avg intake {vm.avgIntake}</span>
      <span data-testid="rollup-net" className={NET_TONE_CLASS[vm.netTone]}>
        Net {vm.net}
      </span>
      <span className="text-slate-500">{vm.daysTracked}</span>
    </div>
  );
}
