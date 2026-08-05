import { useUnits } from "../../../contexts/units-context";
import { useTranslate } from "../../../i18n/use-translate";
import {
  type ActiveSport,
  deriveThresholdMetrics,
  deriveZoneMap,
} from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { Card } from "../../atoms/Card";
import { Icon, STATUS_ICON } from "../../atoms/Icon";
import { SectionHead } from "../../molecules/SectionHead";
import { ZoneMap } from "../../organisms/ZoneMap";

type ZoneMapCardProps = {
  profile: Profile;
  sport: ActiveSport;
  sportLabel: string;
};

export function ZoneMapCard({ profile, sport, sportLabel }: ZoneMapCardProps) {
  const t = useTranslate("athlete");
  const units = useUnits();
  const zones = deriveZoneMap(profile, sport, units);
  // The zone map derives from the sport's primary threshold, which is the
  // first metric the same candidate order yields — naming it here is what
  // makes the reason a reason rather than a slogan.
  const primary = deriveThresholdMetrics(profile, sport, units)[0];

  const reason = primary
    ? t("zonesReason", {
        metric: primary.label,
        value: primary.unit
          ? `${primary.value} ${primary.unit}`
          : primary.value,
      })
    : t("zonesReasonNoThreshold");

  return (
    <div>
      <SectionHead title={t("zonesTitle", { sport: sportLabel })} />
      <Card className="flex flex-col gap-4 p-4">
        {/* Principle 8: the reason goes above what it justifies. */}
        <div className="flex items-start gap-2.5 rounded-xl border border-edge-soft bg-surface-elevated px-3.5 py-3">
          <span className="mt-px text-ink-muted">
            <Icon
              icon={STATUS_ICON.info}
              size="sm"
              color="inherit"
              strokeWidth={2.25}
            />
          </span>
          <p className="text-[12.5px] leading-[1.55] text-ink-body tabular-nums">
            {reason}
          </p>
        </div>
        {zones ? (
          <ZoneMap zones={zones} caption={t("zonesEncoding")} />
        ) : (
          <p className="text-[13px] text-ink-muted">
            {t("noThreshold", { sport: sportLabel.toLowerCase() })}
          </p>
        )}
      </Card>
    </div>
  );
}
