/**
 * Where one managed data type comes from, derived only from state that exists.
 *
 * With no choice in force the App's automatic Authority decides, and the row
 * names the Platform it picks (`automatic`), the one `resolveEffectiveSource`
 * reads when the athlete entered nothing that day. A kind with no Authority,
 * or a choice to keep every source (`union`), has NO winner: it keeps every
 * source's record, so with 2+ sources this reports a COUNT and never a name.
 * Under `priority` the head is the one the resolver consults. `policies`
 * holds only the choices in force (none while the matrix is off); `manual`
 * counts as a source where a manual-entry path exists.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import type { DataFlowsByType } from "../../hooks/connections/use-data-flows";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import { automaticHead } from "../data-source-policy/automatic-authority";
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
  /** `automatic`: picked by the App's rule, nobody chose. */
  | {
      readonly kind: "primary" | "automatic";
      readonly sourceId: string;
      readonly count: number;
    }
  | { readonly kind: "unranked"; readonly count: number }
  /** A ranked order that pins nothing available: the resolver reads NOTHING. */
  | { readonly kind: "rankedUnavailable"; readonly count: number };

export type DataTypeRoutingRow = {
  readonly dataType: ManagedDataType;
  readonly origin: RoutingOrigin;
  /** Integration ids with an ENABLED export route for this type. */
  readonly sentTo: readonly string[];
  /** False when no bridge could ever export this type. */
  readonly exportable: boolean;
};

/* A ranked order is consulted for ONE source too: one that excludes the lone
   available source makes the resolver read nothing (stress ranked to garmin,
   which can never send it, while the athlete typed their stress by hand). */
const originOf = (
  dataType: ManagedDataType,
  sources: readonly string[],
  policy: DataTypeSourcePolicy | undefined
): RoutingOrigin => {
  const count = sources.length;
  const [first] = sources;
  if (first === undefined) return { kind: "none" };
  const only = (sourceId: string) =>
    ({ kind: "only", sourceId: toIntegrationId(sourceId) }) as const;
  if (count === 1 && policy?.mode !== "priority") return only(first);
  const mode = policy?.mode ?? "automatic";
  const picked =
    mode === "automatic" ? automaticHead(dataType, sources) : undefined;
  if (picked !== undefined) {
    return { kind: "automatic", sourceId: toIntegrationId(picked), count };
  }
  if (mode !== "priority") return { kind: "unranked", count };
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
      dataType,
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
