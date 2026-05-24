/**
 * /health/recovery — HRV history (90 d) + today's stress episodes.
 */
import { useHealthHrvHistoryLive } from "../../../hooks/health/use-health-hrv-history-live";
import { useHealthStressDayLive } from "../../../hooks/health/use-health-stress-day-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { lastNinetyDays, todayIso } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";

const RANGE = lastNinetyDays();

export default function HealthRecoveryPage() {
  const active = useActiveProfileLive();
  const profileId = active?.id ?? "";
  const today = todayIso();
  const hrv = useHealthHrvHistoryLive(profileId, RANGE);
  const stress = useHealthStressDayLive(profileId, today);
  const hrvLoading = hrv === undefined;
  const stressLoading = stress === undefined;
  return (
    <section data-testid="health-recovery">
      <HealthPageHeader
        title="Recovery"
        subtitle={`HRV ${RANGE.start} → ${RANGE.end} · Stress ${today}`}
      />
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
        HRV history
      </h2>
      {hrvLoading && <p className="text-sm text-gray-600">Loading…</p>}
      {!hrvLoading && hrv.length === 0 && (
        <p className="mb-4 text-sm text-gray-600">No HRV records yet.</p>
      )}
      {!hrvLoading && hrv.length > 0 && (
        <ul className="mb-4 space-y-1">
          {hrv.map((r) => (
            <li
              key={r.id}
              className="flex justify-between rounded border border-gray-200 p-2 text-sm dark:border-slate-800"
            >
              <span>{r.date}</span>
              <span className="font-mono">{r.krd.rMSSD} ms</span>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
        Stress today
      </h2>
      {stressLoading && <p className="text-sm text-gray-600">Loading…</p>}
      {!stressLoading && stress.length === 0 && (
        <p className="text-sm text-gray-600">
          No stress episodes recorded today.
        </p>
      )}
      {!stressLoading && stress.length > 0 && (
        <ul className="space-y-1">
          {stress.map((r) => (
            <li
              key={r.id}
              className="rounded border border-gray-200 p-2 text-sm dark:border-slate-800"
            >
              Avg {r.krd.averageLevel} · Peak {r.krd.peakLevel}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
