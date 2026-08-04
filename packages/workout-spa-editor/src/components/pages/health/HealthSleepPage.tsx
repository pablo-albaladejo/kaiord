/**
 * /health/sleep — last 7 days of sleep records.
 */
import { useHealthSleepWeekLive } from "../../../hooks/health/use-health-sleep-week-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { lastSevenDays } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";
import { SleepNightRow } from "./SleepNightRow";

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
        <p className="text-sm text-ink-muted">{t("common.loading")}</p>
      )}
      {!loading && records.length === 0 && (
        <p className="text-sm text-ink-muted">{t("sleep.empty")}</p>
      )}
      {!loading && records.length > 0 && (
        <ul className="m-0 list-none rounded-2xl border border-edge-soft bg-surface p-0 px-4">
          {records.map((r) => (
            <SleepNightRow key={r.id} record={r} />
          ))}
        </ul>
      )}
    </section>
  );
}
