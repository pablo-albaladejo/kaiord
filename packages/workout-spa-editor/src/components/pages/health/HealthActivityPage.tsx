/**
 * /health/activity — daily wellness (steps / calories / intensity)
 * for today.
 */
import { useHealthDailyTodayLive } from "../../../hooks/health/use-health-daily-today-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { todayIso } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";

const EMPTY_MSG = "No activity recorded today yet.";

export default function HealthActivityPage() {
  const active = useActiveProfileLive();
  const today = todayIso();
  const record = useHealthDailyTodayLive(active?.id ?? "", today);
  const loading = record === undefined;
  return (
    <section data-testid="health-activity">
      <HealthPageHeader title="Activity" subtitle={today} />
      {loading && <p className="text-sm text-gray-600">{EMPTY_MSG}</p>}
      {!loading && (
        <dl className="grid gap-3 sm:grid-cols-3">
          <Stat label="Steps" value={record.krd.steps} />
          <Stat label="Active kcal" value={record.krd.activeCalories} />
          <Stat label="Resting kcal" value={record.krd.restingCalories} />
        </dl>
      )}
    </section>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded border border-gray-200 p-3 text-center dark:border-slate-800">
    <dt className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">
      {label}
    </dt>
    <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
      {value}
    </dd>
  </div>
);
