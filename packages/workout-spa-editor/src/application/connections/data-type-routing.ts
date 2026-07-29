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
 * resolver would not read from.
 */
const rankedHead = (
  sources: readonly string[],
  saved: readonly string[]
): string | undefined => saved.find((sourceId) => sources.includes(sourceId));

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
  return managedDataTypes.map((dataType) => {
    const flows = byDataType.get(dataType);
    const sources = enabledSources(flows?.import ?? []);
    // Appended last so a saved priority order (which the Data Hub editor only
    // ever fills with bridges) keeps deciding the head.
    //
    // ⚠ ASYMMETRY: this gate is MANUAL_ENTRY_TYPES, while
    // `resolveEffectiveSource` exempts "manual" from its enabled filter
    // UNCONDITIONALLY. Giving a type a manual entry path without adding it here
    // makes the pill and the resolver disagree silently. Widening this to every
    // type is not the fix — it would claim a source for types with no way to
    // enter one (`planned-session` has no manual authoring path at all).
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
