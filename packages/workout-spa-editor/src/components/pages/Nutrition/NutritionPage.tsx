import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { RouteSpinner } from "../../atoms/RouteSpinner";
import { useRealTodayIso } from "../Daily/use-real-today-iso";
import { NutritionEmptyState } from "./NutritionEmptyState";
import { NutritionPageBody } from "./NutritionPageBody";

export default function NutritionPage() {
  const active = useActiveProfileLive();
  const today = useRealTodayIso();

  return (
    <>
      {/* Eager route heading (route-shell contract): rendered from first paint
          so useFocusOnRouteChange finds it regardless of the data state. */}
      <h1 tabIndex={-1} {...{ [ROUTE_HEADING_ATTR]: "" }} className="sr-only">
        Nutrition
      </h1>
      <NutritionPageContent active={active} today={today} />
    </>
  );
}

function NutritionPageContent({
  active,
  today,
}: {
  active: ReturnType<typeof useActiveProfileLive>;
  today: string;
}) {
  if (active === undefined) {
    return <RouteSpinner />;
  }
  if (active.profile === null || active.id === null) {
    return <NutritionEmptyState />;
  }
  return <NutritionPageBody profileId={active.id} date={today} />;
}
