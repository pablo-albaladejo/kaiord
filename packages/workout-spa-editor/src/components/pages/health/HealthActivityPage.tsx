/**
 * /health/activity — daily wellness (steps / calories / intensity)
 * for today.
 */
import { Link } from "wouter";

import { useHealthDailyTodayLive } from "../../../hooks/health/use-health-daily-today-live";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { todayIso } from "./health-date-windows";
import { HealthPageHeader } from "./HealthPageHeader";

const NUTRITION_HREF = "/nutrition";

export default function HealthActivityPage() {
  const t = useTranslate("health");
  const active = useActiveProfileLive();
  const today = todayIso();
  const record = useHealthDailyTodayLive(active?.id ?? "", today);
  const loading = record === undefined;
  return (
    <section data-testid="health-activity">
      <HealthPageHeader title={t("activity.title")} subtitle={today} />
      {loading && (
        <p className="text-sm text-ink-muted">{t("activity.empty")}</p>
      )}
      {!loading && (
        <>
          <dl className="grid gap-3 sm:grid-cols-3">
            <Stat label={t("activity.steps")} value={record.krd.steps} />
            <Stat
              label={t("activity.activeKcal")}
              value={record.krd.activeCalories}
            />
            <Stat
              label={t("activity.restingKcal")}
              value={record.krd.restingCalories}
            />
          </dl>
          {/* The reason goes above what it justifies (principle 8): these
              three are the expenditure side Nutrition reads. */}
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-edge-soft bg-surface-deep px-4 py-3">
            <p className="m-0 flex-1 text-xs leading-relaxed text-pretty text-ink-muted">
              {t("activity.feedsNote")}
            </p>
            <Link
              href={NUTRITION_HREF}
              className="shrink-0 rounded-lg border border-edge px-3 py-2 text-sm font-medium text-ink-body transition-colors hover:border-edge-strong hover:text-ink-strong"
            >
              {t("activity.openNutrition")}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-2xl border border-edge-soft bg-surface p-4">
    <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
      {label}
    </dt>
    <dd className="m-0 mt-1 text-2xl font-semibold tracking-[-0.026em] tabular-nums slashed-zero text-ink-strong">
      {value}
    </dd>
  </div>
);
