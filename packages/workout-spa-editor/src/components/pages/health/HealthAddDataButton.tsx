import { useState } from "react";

import type { ManualHealthMetric } from "../../../application/health/manual-health-metric";
import { useTranslate } from "../../../i18n/use-translate";
import { WellnessEntryDialog } from "../../molecules/WellnessEntryDialog/WellnessEntryDialog";
import { todayIso } from "./health-date-windows";

export type HealthAddDataButtonProps = { metric: ManualHealthMetric };

/** Opens the manual wellness dialog for today, on this page's metric. */
export function HealthAddDataButton({ metric }: HealthAddDataButtonProps) {
  const t = useTranslate("health");
  const [date, setDate] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        data-testid="health-add-data"
        onClick={() => setDate(todayIso())}
        className="shrink-0 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-body transition-colors hover:border-edge-strong hover:text-ink-strong"
      >
        {t("addData")}
      </button>
      {date !== null && (
        <WellnessEntryDialog
          open
          onOpenChange={(open) => !open && setDate(null)}
          date={date}
          focusMetric={metric}
        />
      )}
    </>
  );
}
