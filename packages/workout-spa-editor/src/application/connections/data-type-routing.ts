/**
 * Where one managed data type comes from, derived only from state that exists.
 *
 * `union` is the DEFAULT multi-source mode and has NO winner: it keeps every
 * source's record for a day, and a consumer needing a single value takes the
 * last one written. So with 2+ sources in union mode this reports a COUNT and
 * never a name — naming one would present write order as if it were a choice.
 * A name is only claimed when exactly one source exists, or when the user has
 * actually switched the type to `priority`, whose head is the same one
 * `resolveEffectiveSource` consults.
 *
 * `manual` counts as a source for the types that have a real manual-entry path;
 * the resolver exempts it from the enabled-policy filter for the same reason.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { integrationIdForBridge } from "../../integrations/integration-registry";
import { MANUAL_ENTRY_TYPES } from "../../integrations/manual-entry-types";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import { DEFAULT_DATA_TYPE_SOURCE_MODE } from "../../types/data-type-source-policy";

export const MANUAL_SOURCE_ID = "manual";

export type RoutingOrigin =
  | { readonly kind: "none" }
  | { readonly kind: "only"; readonly sourceId: string }
  | {
      readonly kind: "primary";
      readonly sourceId: string;
      readonly count: number;
    }
  | { readonly kind: "unranked"; readonly count: number };

export type DataTypeRoutingRow = {
  readonly dataType: ManagedDataType;
  readonly origin: RoutingOrigin;
  /** Integration ids with an ENABLED export route for this type. */
  readonly sentTo: readonly string[];
  /** False when no bridge could ever export this type — 11 of 13 have no
      export capability, so even "Nowhere" would imply a route that cannot
      be created. */
  readonly exportable: boolean;
};

const toIntegrationId = (sourceId: string): string =>
  sourceId === MANUAL_SOURCE_ID
    ? MANUAL_SOURCE_ID
    : (integrationIdForBridge(sourceId) ?? sourceId);

const enabledSources = (
  rows: readonly { bridgeId: string; enabled: boolean }[]
): string[] => [
  ...new Set(rows.filter((row) => row.enabled).map((row) => row.bridgeId)),
];

/**
 * The saved order's first entry that is still an available source — exactly
 * what `resolveEffectiveSource` consults, so the pill cannot name a source the
 * resolver would not read from. Undefined when the saved order pins none of
 * them, which is NOT a corner case: the chat `set_data_route` tool persists
 * `priority` with an order emptied by unresolvable ids, and disabling every
 * ranked route in the Data Hub leaves the same shape behind.
 */
const rankedHead = (
  sources: readonly string[],
  saved: readonly string[]
): string | undefined => saved.find((sourceId) => sources.includes(sourceId));

const originOf = (
  sources: readonly string[],
  policy: DataTypeSourcePolicy | undefined
): RoutingOrigin => {
  const [first, ...rest] = sources;
  if (first === undefined) return { kind: "none" };
  if (rest.length === 0)
    return { kind: "only", sourceId: toIntegrationId(first) };
  const unranked = { kind: "unranked", count: sources.length } as const;
  const mode = policy?.mode ?? DEFAULT_DATA_TYPE_SOURCE_MODE;
  if (mode !== "priority") return unranked;
  const head = rankedHead(sources, policy?.sourceOrder ?? []);
  // "Priority selected, nothing ranked yet" is the honest reading. Naming
  // `sources[0]` here would attribute the type to whichever import route
  // happened to be created first — the same overclaim union avoids, arriving
  // through a different door.
  if (head === undefined) return unranked;
  return {
    kind: "primary",
    sourceId: toIntegrationId(head),
    count: sources.length,
  };
};

export const buildDataTypeRoutingRows = (
  byDataType: DataFlowsByType,
  policies: readonly DataTypeSourcePolicy[]
): DataTypeRoutingRow[] => {
  const byType = new Map(policies.map((policy) => [policy.dataType, policy]));
  return managedDataTypes.map((dataType) => {
    const flows = byDataType.get(dataType);
    const sources = enabledSources(flows?.import ?? []);
    // Appended last so a saved priority order (which the Data Hub editor only
    // ever fills with bridges) keeps deciding the head.
    if (MANUAL_ENTRY_TYPES.has(dataType)) sources.push(MANUAL_SOURCE_ID);
    return {
      dataType,
      origin: originOf(sources, byType.get(dataType)),
      sentTo: enabledSources(flows?.export ?? []).map(toIntegrationId),
      exportable:
        MANAGED_DATA_REGISTRY[dataType].capabilities.export !== undefined,
    };
  });
};
