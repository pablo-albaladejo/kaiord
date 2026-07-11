import { useUnits } from "../../../contexts/units-context";
import { useTranslate } from "../../../i18n/use-translate";
import { type ActiveSport, deriveZoneMap } from "../../../lib/athlete";
import type { Profile } from "../../../types/profile";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP } from "../../atoms/Icon";
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

  return (
    <div>
      <SectionHead title={t("zonesTitle", { sport: sportLabel })} />
      <Card className="rounded-[20px] border border-edge bg-surface p-4">
        {zones ? (
          <ZoneMap zones={zones} />
        ) : (
          <p className="text-[13.5px] text-ink-muted">
            {t("noThreshold", { sport: sportLabel.toLowerCase() })}
          </p>
        )}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent/15 bg-accent/5 p-3">
          <span className="mt-px text-accent">
            <Icon
              icon={ICON_MAP.sparkle}
              size="sm"
              color="inherit"
              strokeWidth={1.9}
            />
          </span>
          <p className="text-[12.5px] text-ink-body">{t("zonesBlurb")}</p>
        </div>
      </Card>
    </div>
  );
}
