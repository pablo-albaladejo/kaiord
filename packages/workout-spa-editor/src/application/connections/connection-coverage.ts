/**
 * Which managed data types have a source, and which lost the one they had.
 *
 * An import only ever runs behind an ENABLED `IntegrationPolicy` row — every
 * runner in `bridge-import/` gates on the policy repository before it touches
 * a bridge — so "a route is switched on, and its source is present" is the
 * strongest claim the product can make about a type being fed.
 *
 * `covered` counts manual entry, `paused` does not, and the two are
 * deliberately not complements. Manual entry is a real path (it is what
 * `MANUAL_ENTRY_TYPES` records) so a type it serves is not sourceless; but
 * nobody types a weight in because a bridge broke, so a source that stops
 * sending still stopped, and the banner says so.
 */
import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { MANUAL_ENTRY_TYPES } from "../../integrations/manual-entry-types";
import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "./connection-source";

/**
 * Statuses under which a route's data can still arrive. `checking` is one of
 * them on purpose: a probe is in flight for a few hundred milliseconds every
 * poll, and dropping the type for that window would make the counter twitch
 * without anything having changed.
 */
const DELIVERING: ReadonlySet<ConnectionSourceStatus> = new Set([
  "connected",
  "installed",
  "checking",
]);

export type ConnectionCoverage = {
  /** A route is on and its source is present, or the type can be typed in. */
  readonly covered: readonly ManagedDataType[];
  /** A route is on and its source needs attention — whatever else is true. */
  readonly broken: readonly ManagedDataType[];
  /** Broken with nothing else delivering it: no source is sending this. */
  readonly paused: readonly ManagedDataType[];
  readonly total: number;
};

export const buildConnectionCoverage = (
  sources: readonly ConnectionSource[],
  byDataType: DataFlowsByType
): ConnectionCoverage => {
  const statusOf = new Map<string, ConnectionSourceStatus>(
    sources.flatMap((source) =>
      source.bridgeId === null ? [] : [[source.bridgeId, source.status]]
    )
  );
  const covered: ManagedDataType[] = [];
  const broken: ManagedDataType[] = [];
  const paused: ManagedDataType[] = [];

  for (const dataType of managedDataTypes) {
    const enabled = (byDataType.get(dataType)?.import ?? []).filter(
      (policy) => policy.enabled
    );
    const status = (policy: { bridgeId: string }) =>
      statusOf.get(policy.bridgeId);
    const delivering = enabled.some((policy) => {
      const value = status(policy);
      return value !== undefined && DELIVERING.has(value);
    });
    const failing = enabled.some((policy) => status(policy) === "attention");

    if (delivering || MANUAL_ENTRY_TYPES.has(dataType)) covered.push(dataType);
    if (failing) broken.push(dataType);
    if (failing && !delivering) paused.push(dataType);
  }

  return { covered, broken, paused, total: managedDataTypes.length };
};
