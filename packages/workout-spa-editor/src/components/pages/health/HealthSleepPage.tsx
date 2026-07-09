/**
 * /health/sleep — last 7 days of sleep records.
 */
import { useHealthSleepWeekLive } from "../../../hooks/health/use-health-sleep-week-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { lastSevenDays } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";
import { HealthSourceBadge } from "./HealthSourceBadge";

export default function HealthSleepPage() {
  const t = useTranslate("health");
  // Computed per render so the window stays current across day rollovers.
  const range = lastSevenDays();
  const active = useActiveProfileLive();
  const profileId = active?.id;
  const records = useHealthSleepWeekLive(profileId ?? "", range);
  const loading = records === undefined;
  return (
    <section data-testid="health-sleep">
      <HealthPageHeader
        title={t("sleep.title")}
        subtitle={`${range.start} → ${range.end}`}
      />
      {loading && (
        <p className="text-sm text-gray-600">{t("common.loading")}</p>
      )}
      {!loading && records.length === 0 && (
        <p className="text-sm text-gray-600">{t("sleep.empty")}</p>
      )}
      {!loading && records.length > 0 && (
        <ul className="space-y-2">
          {records.map((r) => (
            <li
              key={r.id}
              className="rounded border border-gray-200 p-3 text-sm dark:border-slate-800"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{r.date}</div>
                <HealthSourceBadge sourceBridgeId={r.sourceBridgeId} />
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {r.krd.startTime} → {r.krd.endTime}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
