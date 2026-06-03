import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { RouteSpinner } from "../../atoms/RouteSpinner";
import { AthleteEmptyState } from "./AthleteEmptyState";
import { AthletePageBody } from "./AthletePageBody";

export default function AthletePage() {
  const active = useActiveProfileLive();

  return (
    <>
      {/* Eager route heading (D5): part of the route shell, not the data
          payload — rendered from first paint so useFocusOnRouteChange finds
          it on the post-paint rAF regardless of the spinner/empty/body state.
          Copy is stable across data states; status lives in the body. */}
      <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }} className="sr-only">
        Athlete
      </h1>
      <AthletePageContent active={active} />
    </>
  );
}

function AthletePageContent({
  active,
}: {
  active: ReturnType<typeof useActiveProfileLive>;
}) {
  if (active === undefined) {
    return <RouteSpinner />;
  }

  if (active.profile === null || active.id === null) {
    return <AthleteEmptyState />;
  }

  return <AthletePageBody profileId={active.id} profile={active.profile} />;
}
