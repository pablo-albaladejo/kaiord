import { Link } from "wouter";

import { useUnits } from "../../../contexts/units-context";
import { useTranslate } from "../../../i18n/use-translate";
import {
  type ActiveSport,
  formatThreshold,
  sportPaceBase,
  storedThreshold,
  thresholdFieldLabel,
  thresholdFieldSpecs,
} from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";

type ZonesThresholdSummaryProps = {
  profile: Profile;
  sport: ActiveSport;
};

/* The numbers these zones derive from, stated and linked rather than edited:
   a threshold has one home, the Athlete page (audit P-01). */
export function ZonesThresholdSummary({
  profile,
  sport,
}: ZonesThresholdSummaryProps) {
  const t = useTranslate("athlete");
  const hrUnit = useTranslate("common")("units.hr");
  const units = useUnits();
  const base =
    profile.sportZones[sport]?.thresholds.paceUnit ?? sportPaceBase(sport);
  const ctx = { swimming: sport === "swimming", base, units, hrUnit, t };

  const items = thresholdFieldSpecs(sport).flatMap((spec) => {
    const value = storedThreshold(profile, sport, spec.id);
    if (value === undefined) return [];
    const label = thresholdFieldLabel(spec, ctx);
    const shown = formatThreshold(spec.id, value, base, units);
    return [t("zonesPage.thresholdItem", { label, value: shown })];
  });

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-edge-soft bg-surface-elevated px-3.5 py-3 text-[13px]">
      <p className="m-0 text-ink-body tabular-nums">
        {items.length > 0
          ? t("zonesPage.thresholds", { list: items.join(" · ") })
          : t("zonesPage.noThresholds")}
      </p>
      <Link
        href="/athlete"
        className="font-medium text-ink-strong underline underline-offset-2 hover:text-ink-body"
      >
        {t("editThresholds")}
      </Link>
    </div>
  );
}
