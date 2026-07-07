/**
 * /health/weight — last 90 days of weight measurements (+ latest body
 * composition if available).
 */
import { useUnits } from "../../../contexts/units-context";
import { useHealthBodyCompositionLatestLive } from "../../../hooks/health/use-health-body-composition-latest-live";
import { useHealthWeightHistoryLive } from "../../../hooks/health/use-health-weight-history-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { formatWeightKg } from "../../../lib/units/units";
import { lastNinetyDays } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";
import { HealthSourceBadge } from "./HealthSourceBadge";

const EMPTY_MSG = "No weight records yet for the last 90 days.";

export default function HealthWeightPage() {
  // Computed per render so the window stays current across day rollovers.
  const range = lastNinetyDays();
  const units = useUnits();
  const active = useActiveProfileLive();
  const profileId = active?.id;
  const records = useHealthWeightHistoryLive(profileId ?? "", range);
  const composition = useHealthBodyCompositionLatestLive(profileId ?? "");
  const loading = records === undefined;
  return (
    <section data-testid="health-weight">
      <HealthPageHeader
        title="Weight"
        subtitle={`${range.start} → ${range.end}`}
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
              className="flex items-center justify-between gap-2 rounded border border-gray-200 p-2 text-sm dark:border-slate-800"
            >
              <span>{r.date}</span>
              <span className="flex items-center gap-2">
                <span className="font-mono">
                  {formatWeightKg(r.krd.weightKilograms, units)}
                </span>
                <HealthSourceBadge sourceBridgeId={r.sourceBridgeId} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
