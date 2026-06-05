import { Link } from "wouter";

import type { WellnessMetric } from "../../../types/health/day-wellness";
import { WELLNESS_BADGE_ROUTES } from "../../molecules/WorkoutCard/WellnessBand/wellness-badge-routes";

type SubRouteDef = {
  metric: WellnessMetric;
  label: string;
};

const SUB_ROUTES: ReadonlyArray<SubRouteDef> = [
  { metric: "sleep", label: "Sleep" },
  { metric: "hrv", label: "Recovery" },
  { metric: "weight", label: "Weight" },
  { metric: "steps", label: "Activity" },
];

const linkClass =
  "flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";

export function HealthSubRouteLinks() {
  return (
    <nav
      data-testid="health-sub-route-links"
      aria-label="Health detail pages"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {SUB_ROUTES.map((sub) => (
        <Link
          key={sub.metric}
          href={WELLNESS_BADGE_ROUTES[sub.metric]}
          className={linkClass}
        >
          {sub.label}
        </Link>
      ))}
    </nav>
  );
}
