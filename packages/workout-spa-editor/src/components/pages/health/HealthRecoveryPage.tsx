/**
 * /health/recovery — HRV history (90 d) + today's stress episodes.
 */
import { useHealthHrvHistoryLive } from "../../../hooks/health/use-health-hrv-history-live";
import { useHealthStressDayLive } from "../../../hooks/health/use-health-stress-day-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { lastNinetyDays, todayIso } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";
import { HrvHistoryList } from "./HrvHistoryList";
import { TodayStressList } from "./TodayStressList";

export default function HealthRecoveryPage() {
  const t = useTranslate("health");
  // Computed per render so the window stays current across day rollovers.
  const range = lastNinetyDays();
  const today = todayIso();
  const active = useActiveProfileLive();
  const profileId = active?.id ?? "";
  const hrv = useHealthHrvHistoryLive(profileId, range);
  const stress = useHealthStressDayLive(profileId, today);
  return (
    <section data-testid="health-recovery">
      <HealthPageHeader
        title={t("recovery.title")}
        subtitle={t("recovery.subtitle", {
          start: range.start,
          end: range.end,
          today,
        })}
      />
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
        {t("recovery.hrvHistory")}
      </h2>
      <HrvHistoryList loading={hrv === undefined} records={hrv} />
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
        {t("recovery.stressToday")}
      </h2>
      <TodayStressList loading={stress === undefined} records={stress} />
    </section>
  );
}
