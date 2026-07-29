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
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import { DEFAULT_DATA_TYPE_SOURCE_MODE } from "../../types/data-type-source-policy";
import {
  availableSources,
  MANUAL_SOURCE_ID,
  rankedHead,
  toIntegrationId,
} from "./data-type-sources";

export { MANUAL_SOURCE_ID };

export type RoutingOrigin =
  | { readonly kind: "none" }
  | { readonly kind: "only"; readonly sourceId: string }
  | {
      readonly kind: "primary";
      readonly sourceId: string;
      readonly count: number;
    }
  | { readonly kind: "unranked"; readonly count: number }
  /** Ranked mode whose order pins nothing available — the resolver reads NO
      record at all here, so this is the one origin that reports a problem. */
  | { readonly kind: "rankedUnavailable"; readonly count: number };

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

/**
 * The mode is consulted for ONE source too, not just for several. A ranked
 * order that excludes the lone available source makes the resolver read
 * nothing, so short-circuiting on `length === 1` would name a source whose
 * records never surface — e.g. stress ranked to garmin (which announces no
 * `read:body`, so that route can never be enabled) leaves manual entry as the
 * only source while the user's hand-typed stress resolves to nothing.
 */
const originOf = (
  sources: readonly string[],
  policy: DataTypeSourcePolicy | undefined
): RoutingOrigin => {
  const count = sources.length;
  const [first] = sources;
  if (first === undefined) return { kind: "none" };
  const only = (sourceId: string) =>
    ({ kind: "only", sourceId: toIntegrationId(sourceId) }) as const;
  const mode = policy?.mode ?? DEFAULT_DATA_TYPE_SOURCE_MODE;
  if (mode !== "priority") {
    return count === 1 ? only(first) : { kind: "unranked", count };
  }
  const head = rankedHead(sources, policy?.sourceOrder ?? []);
  if (head === undefined) return { kind: "rankedUnavailable", count };
  return count === 1
    ? only(head)
    : { kind: "primary", sourceId: toIntegrationId(head), count };
};

export const buildDataTypeRoutingRows = (
  byDataType: DataFlowsByType,
  policies: readonly DataTypeSourcePolicy[]
): DataTypeRoutingRow[] => {
  const byType = new Map(policies.map((policy) => [policy.dataType, policy]));
  return managedDataTypes.map((dataType) => ({
    dataType,
    origin: originOf(
      availableSources(byDataType, dataType),
      byType.get(dataType)
    ),
    sentTo: [
      ...new Set(
        (byDataType.get(dataType)?.export ?? [])
          .filter((route) => route.enabled)
          .map((route) => toIntegrationId(route.bridgeId))
      ),
    ],
    exportable:
      MANAGED_DATA_REGISTRY[dataType].capabilities.export !== undefined,
  }));
};
