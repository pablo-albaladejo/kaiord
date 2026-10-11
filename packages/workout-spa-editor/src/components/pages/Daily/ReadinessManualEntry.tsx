import { useState } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { WellnessEntryDialog } from "../../molecules/WellnessEntryDialog/WellnessEntryDialog";

export type ReadinessManualEntryProps = { date: string };

/** Typing HRV and sleep by hand is a first-class way to get a readiness. */
export function ReadinessManualEntry({ date }: ReadinessManualEntryProps) {
  const t = useTranslate("daily");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-testid="readiness-log-manually"
        onClick={() => setOpen(true)}
        className="mt-3 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-body transition-colors hover:border-edge-strong hover:text-ink-strong"
      >
        {t("readiness.logManually")}
      </button>
      {open && (
        <WellnessEntryDialog
          open
          onOpenChange={setOpen}
          date={date}
          focusMetric="hrv"
        />
      )}
    </>
  );
}
