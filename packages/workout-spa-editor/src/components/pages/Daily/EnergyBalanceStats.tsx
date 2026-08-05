import { TriangleAlert } from "lucide-react";

import { useTranslate } from "../../../i18n/use-translate";
import type { EnergyBalanceViewModel } from "./energy-balance-view-model";

/* The sign in front of the number already says deficit or surplus, so the
   colour was saying it twice — in a green and an amber the palette no longer
   carries. Only "we do not know" still needs a level of its own. */
const NET_TONE_CLASS: Record<EnergyBalanceViewModel["netTone"], string> = {
  deficit: "text-ink-strong",
  surplus: "text-ink-strong",
  even: "text-ink-strong",
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
        <div
          role="status"
          data-testid="energy-balance-cap-warning"
          className="mt-3 flex items-start gap-2 rounded-xl border border-edge bg-surface-elevated p-3"
        >
          <TriangleAlert
            aria-hidden="true"
            className="mt-px h-[15px] w-[15px] shrink-0 text-ink-strong"
          />
          <p className="m-0 text-[12.5px] leading-relaxed tabular-nums text-ink-body">
            {vm.capWarning}
          </p>
        </div>
      )}
    </>
  );
}
