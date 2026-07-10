import type { DayEnergyBalance } from "@kaiord/core";

import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { MacroRings } from "./MacroRings";

export type MacroSummaryCardProps = { balance: DayEnergyBalance | null };

/** Full-size macro rings (actuals vs targets) for the Nutrition page. */
export function MacroSummaryCard({ balance }: MacroSummaryCardProps) {
  const t = useTranslate("nutrition");
  return (
    <Card className="border-edge bg-surface p-4" data-testid="macro-summary">
      <p className="m-0 mb-3 text-[15px] font-semibold text-ink-strong">
        {t("macros.title")}
      </p>
      <MacroRings
        actuals={balance?.macro_actuals}
        targets={balance?.macro_targets}
      />
    </Card>
  );
}
