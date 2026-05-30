import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { RouteSpinner } from "../../atoms/RouteSpinner";
import { AthleteEmptyState } from "./AthleteEmptyState";
import { AthletePageBody } from "./AthletePageBody";

export default function AthletePage() {
  const active = useActiveProfileLive();

  if (active === undefined) {
    return <RouteSpinner />;
  }

  if (active.profile === null || active.id === null) {
    return <AthleteEmptyState />;
  }

  return <AthletePageBody profileId={active.id} profile={active.profile} />;
}
