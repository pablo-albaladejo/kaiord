import { Link, Redirect, useLocation, useParams } from "wouter";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { isActiveSport } from "../../../lib/athlete";
import { athleteZonesHref } from "../../../routing/athlete-zones-href";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { isSportKey, type SportKey } from "../../../types/sport-zones";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { RouteSpinner } from "../../atoms/RouteSpinner";
import { SportZoneEditor } from "../../organisms/ZoneEditor";
import { GenericThresholdField } from "./GenericThresholdField";
import { ZonesThresholdSummary } from "./ZonesThresholdSummary";

/** The one zone editor (audit P-01): a sport's zones, at a linkable URL,
    `/athlete/zones/:sport`. */
export default function AthleteZonesPage() {
  const { sport = "" } = useParams<{ sport: string }>();
  if (!isSportKey(sport)) {
    return <Redirect to={athleteZonesHref("cycling")} replace />;
  }
  return <ZonesForSport sport={sport} />;
}

function ZonesForSport({ sport }: { sport: SportKey }) {
  const t = useTranslate("athlete");
  const tZones = useTranslate("zones");
  const [, navigate] = useLocation();
  const active = useActiveProfileLive();

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <Link
        href="/athlete"
        className="flex w-fit items-center gap-1 text-[13px] font-medium text-ink-body hover:text-ink-strong"
      >
        <Icon icon={ICON_MAP.chevL} size="xs" color="inherit" />
        {t("zonesPage.back")}
      </Link>
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="m-0 text-xl font-semibold text-ink-strong"
      >
        {t("zonesTitle", { sport: tZones(`tabs.${sport}`) })}
      </h1>
      {active === undefined && <RouteSpinner />}
      {active && !active.profile && <Redirect to="/athlete" replace />}
      {active?.profile && (
        <SportZoneEditor
          key={sport}
          profileId={active.profile.id}
          initialSport={sport}
          onSportChange={(next) =>
            navigate(athleteZonesHref(next), { replace: true })
          }
          thresholds={
            isActiveSport(sport) ? (
              <ZonesThresholdSummary profile={active.profile} sport={sport} />
            ) : (
              <GenericThresholdField profile={active.profile} />
            )
          }
        />
      )}
    </div>
  );
}
