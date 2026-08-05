/**
 * /health/weight — last 90 days of weight measurements (+ latest body
 * composition if available).
 */
import { useUnits } from "../../../contexts/units-context";
import { useHealthBodyCompositionLatestLive } from "../../../hooks/health/use-health-body-composition-latest-live";
import { useHealthWeightHistoryLive } from "../../../hooks/health/use-health-weight-history-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { formatWeightKg } from "../../../lib/units/units";
import { lastNinetyDays } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";
import { HealthSourceBadge } from "./HealthSourceBadge";

export default function HealthWeightPage() {
  const t = useTranslate("health");
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
        title={t("weight.title")}
        subtitle={`${range.start} → ${range.end}`}
      />
      {composition && (
        <div className="mb-4 rounded-2xl border border-edge bg-surface-elevated p-3 text-sm">
          <div className="font-medium text-ink-strong">
            {t("weight.bodyComposition")}
          </div>
          <div className="tabular-nums text-ink-muted">{composition.date}</div>
        </div>
      )}
      {loading && (
        <p className="text-sm text-ink-muted">{t("common.loading")}</p>
      )}
      {!loading && records.length === 0 && (
        <p className="text-sm text-ink-muted">{t("weight.empty")}</p>
      )}
      {!loading && records.length > 0 && (
        <ul className="m-0 list-none rounded-2xl border border-edge-soft bg-surface p-0 px-4">
          {records.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 border-b border-edge-soft py-3 text-sm last:border-b-0"
            >
              <span className="tabular-nums text-ink-body">{r.date}</span>
              <span className="flex items-center gap-2">
                <span className="font-medium tabular-nums slashed-zero text-ink-strong">
                  {formatWeightKg(r.krd.weightKilograms, units)}
                </span>
                <HealthSourceBadge sourceBridgeId={r.sourceBridgeId} />
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs leading-relaxed text-pretty text-ink-muted">
        {t("weight.feedsNote")}
      </p>
    </section>
  );
}
