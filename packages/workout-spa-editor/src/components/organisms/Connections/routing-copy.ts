import type { RoutingOrigin } from "../../../application/connections/data-type-routing";
import type { Translate } from "../../../i18n/use-translate";
import { INTEGRATION_REGISTRY } from "../../../integrations/integration-registry";

const NAMES: ReadonlyMap<string, string> = new Map(
  INTEGRATION_REGISTRY.map((entry) => [entry.id, entry.name])
);

export const sourceName = (integrationId: string): string =>
  NAMES.get(integrationId) ?? integrationId;

/**
 * The one source a row's freshness may be attributed to — undefined when no
 * single source owns the type. `coachingSyncState` has a row per source, so
 * with several sources there is no non-arbitrary one to date the row by, and
 * showing none beats showing whichever happens to be first.
 */
export const originSourceId = (origin: RoutingOrigin): string | undefined =>
  origin.kind === "only" || origin.kind === "primary"
    ? origin.sourceId
    : undefined;

/**
 * A name is printed only when one is real. Under `union` — the DEFAULT mode —
 * several sources all keep writing and nothing ranks them, so the row states
 * how many there are; the design's confident "From: Garmin" would be showing
 * write order as a decision the user never made.
 */
export const originLabel = (origin: RoutingOrigin, t: Translate): string => {
  switch (origin.kind) {
    case "none":
      return t("routing.noSource");
    case "unranked":
      return t("routing.manySources", { count: origin.count });
    default:
      return sourceName(origin.sourceId);
  }
};
