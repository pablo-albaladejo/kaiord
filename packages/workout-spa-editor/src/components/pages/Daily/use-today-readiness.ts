/**
 * Resolves the Today page readiness model. HRV/sleep resolve through the
 * multi-source resolver (a governed "winning" record, not the query's last
 * row); the model's copy is localized via the active-locale translator.
 */
import type { HrvSummary, SleepRecord } from "@kaiord/core";

import { useEffectiveHealthRecordLive } from "../../../hooks/health/use-effective-health-record-live";
import { useHealthStressDayLive } from "../../../hooks/health/use-health-stress-day-live";
import { useTranslate } from "../../../i18n/use-translate";
import { pickEffectiveHealthRecord } from "./pick-effective-health-record";
import { buildReadinessModel, type ReadinessModel } from "./today-readiness";

export function useTodayReadiness(
  profileId: string | null,
  focusIso: string,
  isFocusToday: boolean
): ReadinessModel {
  const t = useTranslate("daily");
  const hrvResult = useEffectiveHealthRecordLive<HrvSummary>(
    profileId ?? "",
    "hrv",
    focusIso
  );
  const sleepResult = useEffectiveHealthRecordLive<SleepRecord>(
    profileId ?? "",
    "sleep",
    focusIso
  );
  const stressRecords = useHealthStressDayLive(profileId ?? "", focusIso);
  const hrvPick = pickEffectiveHealthRecord(hrvResult);
  const sleepPick = pickEffectiveHealthRecord(sleepResult);
  return buildReadinessModel(
    hrvPick.record,
    sleepPick.record,
    stressRecords?.map((record) => record.krd),
    isFocusToday,
    hrvPick,
    sleepPick,
    t
  );
}
