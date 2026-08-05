/**
 * The Health Hub's own navigation table: every `/health/*` route, in the
 * order the strip lists them.
 *
 * The four per-metric entries take their href from `WELLNESS_BADGE_ROUTES` so
 * the strip and the calendar wellness band can never drift; the trends hub and
 * labs have no wellness badge and carry their path here. Paths only — nothing
 * in this module imports a page component (no-dual-mount invariant).
 */
import { WELLNESS_BADGE_ROUTES } from "../../molecules/WorkoutCard/WellnessBand/wellness-badge-routes";

export type HealthSubRoute = {
  /** Stable id, used as the React key and in tests. */
  id: string;
  href: string;
  /** Key in the `health` i18n namespace. */
  labelKey: string;
};

export const HEALTH_SUB_ROUTES: ReadonlyArray<HealthSubRoute> = [
  { id: "trends", href: "/health", labelKey: "nav.trends" },
  { id: "sleep", href: WELLNESS_BADGE_ROUTES.sleep, labelKey: "nav.sleep" },
  { id: "recovery", href: WELLNESS_BADGE_ROUTES.hrv, labelKey: "nav.recovery" },
  { id: "weight", href: WELLNESS_BADGE_ROUTES.weight, labelKey: "nav.weight" },
  {
    id: "activity",
    href: WELLNESS_BADGE_ROUTES.steps,
    labelKey: "nav.activity",
  },
  { id: "labs", href: "/health/labs", labelKey: "nav.labs" },
];

/** Mirrors `health-routes.tsx`, so `/health/` still resolves to the hub. */
const normalize = (pathname: string): string =>
  pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

/**
 * Exact match, never `startsWith`: every sub-route's path is prefixed by the
 * hub's, so a prefix test would mark Trends current on all six.
 */
export const isCurrentHealthRoute = (
  route: HealthSubRoute,
  pathname: string
): boolean => normalize(pathname) === route.href;
