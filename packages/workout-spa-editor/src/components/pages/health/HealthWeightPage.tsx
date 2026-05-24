/**
 * /health/weight — last 90 days of weight measurements (+ latest body
 * composition if available).
 */
import { useHealthBodyCompositionLatestLive } from "../../../hooks/health/use-health-body-composition-latest-live";
import { useHealthWeightHistoryLive } from "../../../hooks/health/use-health-weight-history-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { lastNinetyDays } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";

const RANGE = lastNinetyDays();
const EMPTY_MSG = "No weight records yet for the last 90 days.";

export default function HealthWeightPage() {
  const active = useActiveProfileLive();
  const profileId = active?.id;
  const records = useHealthWeightHistoryLive(profileId ?? "", RANGE);
  const composition = useHealthBodyCompositionLatestLive(profileId ?? "");
  const loading = records === undefined;
  return (
    <section data-testid="health-weight">
      <HealthPageHeader
        title="Weight"
        subtitle={`${RANGE.start} → ${RANGE.end}`}
      />
      {composition && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-800 dark:bg-blue-950">
          <div className="font-medium">Body composition (latest)</div>
          <div className="text-gray-600 dark:text-gray-400">
            {composition.date}
          </div>
        </div>
      )}
      {loading && <p className="text-sm text-gray-600">Loading…</p>}
      {!loading && records.length === 0 && (
        <p className="text-sm text-gray-600">{EMPTY_MSG}</p>
      )}
      {!loading && records.length > 0 && (
        <ul className="space-y-1">
          {records.map((r) => (
            <li
              key={r.id}
              className="flex justify-between rounded border border-gray-200 p-2 text-sm dark:border-slate-800"
            >
              <span>{r.date}</span>
              <span className="font-mono">{r.krd.weightKilograms} kg</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
