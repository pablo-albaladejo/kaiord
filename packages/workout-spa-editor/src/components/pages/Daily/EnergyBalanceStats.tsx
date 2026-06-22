import type { EnergyBalanceViewModel } from "./energy-balance-view-model";

const NET_TONE_CLASS: Record<EnergyBalanceViewModel["netTone"], string> = {
  deficit: "text-emerald-400",
  surplus: "text-amber-400",
  even: "text-slate-200",
  unknown: "text-slate-500",
};

type StatProps = { label: string; value: string; valueClass?: string };

function Stat({ label, value, valueClass = "text-slate-50" }: StatProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`text-[16px] font-bold tabular-nums ${valueClass}`}>
        {value}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mt-px">
        {label}
      </div>
    </div>
  );
}

export type EnergyBalanceStatsProps = { vm: EnergyBalanceViewModel };

export function EnergyBalanceStats({ vm }: EnergyBalanceStatsProps) {
  return (
    <>
      <div className="mt-4 flex gap-2 border-t border-slate-800 pt-4">
        <Stat label={vm.expenditureLabel} value={vm.expenditure} />
        <Stat label="Intake" value={vm.intake} />
        <Stat
          label="Net"
          value={vm.net}
          valueClass={NET_TONE_CLASS[vm.netTone]}
        />
        {vm.target !== null && <Stat label="Target" value={vm.target} />}
      </div>
      {vm.capWarning !== null && (
        <p
          role="status"
          data-testid="energy-balance-cap-warning"
          className="mt-3 text-[12px] font-medium text-amber-400 m-0"
        >
          {vm.capWarning}
        </p>
      )}
    </>
  );
}
