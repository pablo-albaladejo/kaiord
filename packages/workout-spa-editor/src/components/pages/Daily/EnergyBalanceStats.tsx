import { useTranslate } from "../../../i18n/use-translate";
import type { EnergyBalanceViewModel } from "./energy-balance-view-model";

const NET_TONE_CLASS: Record<EnergyBalanceViewModel["netTone"], string> = {
  deficit: "text-emerald-400",
  surplus: "text-amber-400",
  even: "text-ink-body",
  unknown: "text-ink-muted",
};

type StatProps = { label: string; value: string; valueClass?: string };

function Stat({ label, value, valueClass = "text-ink-strong" }: StatProps) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`text-[16px] font-bold tabular-nums ${valueClass}`}>
        {value}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mt-px">
        {label}
      </div>
    </div>
  );
}

export type EnergyBalanceStatsProps = { vm: EnergyBalanceViewModel };

export function EnergyBalanceStats({ vm }: EnergyBalanceStatsProps) {
  const t = useTranslate("daily");
  return (
    <>
      <div className="mt-4 flex gap-2 border-t border-edge pt-4">
        <Stat label={vm.expenditureLabel} value={vm.expenditure} />
        <Stat label={t("energyBalance.intake")} value={vm.intake} />
        <Stat
          label={t("energyBalance.net")}
          value={vm.net}
          valueClass={NET_TONE_CLASS[vm.netTone]}
        />
        {vm.target !== null && (
          <Stat label={t("energyBalance.target")} value={vm.target} />
        )}
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
