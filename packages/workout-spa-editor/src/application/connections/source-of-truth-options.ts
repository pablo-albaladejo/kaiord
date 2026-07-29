/**
 * What the row's "Change" control may offer, and what it stores when a source
 * is picked.
 *
 * Two rules keep this honest:
 *
 * 1. Every offered source is one `resolveEffectiveSource` would consult — the
 *    candidates come from `availableSources`, the same set the row's pill
 *    counts, so the writer and the reader cannot disagree about "first".
 * 2. A source that CANNOT serve the type is not offered. Chat `enable_route`
 *    performs no capability check (issue #1085), so an enabled import route
 *    exists for pairings the Data Hub itself renders `na` — ranking one of
 *    those first would name a source that can never produce a record.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY } from "@kaiord/core";

import type {
  DataTypeSourceMode,
  DataTypeSourcePolicy,
} from "../../types/data-type-source-policy";
import { DEFAULT_DATA_TYPE_SOURCE_MODE } from "../../types/data-type-source-policy";
import type { IntegrationPolicyDirection } from "../../types/integration-policy";
import { orderSources } from "../data-hub/source-policy-rows";
import { MANUAL_SOURCE_ID, rankedHead } from "./data-type-sources";

export type SourceCapabilitySignals = {
  /** Announced wire tokens, or `null` while the bridge is unverified. */
  capabilitiesFor: (bridgeId: string) => readonly string[] | null;
  supportsRoute: (
    bridgeId: string,
    dataType: ManagedDataType,
    direction: IntegrationPolicyDirection
  ) => boolean;
};

export type SourceOfTruthOptions = {
  readonly mode: DataTypeSourceMode;
  /** Storage keys, in the order the type is read today. */
  readonly choices: readonly string[];
  /** The choice ranked first, when the stored order ranks one of them. */
  readonly current: string | undefined;
};

/**
 * `null` capabilities mean "not verified yet", NOT "cannot": an enabled route
 * whose extension is not running in this browser still owns records the
 * resolver reads, and dropping it would take a real source off the list every
 * time the page loads before discovery answers.
 */
const canServe = (
  sourceId: string,
  dataType: ManagedDataType,
  signals: SourceCapabilitySignals
): boolean => {
  if (sourceId === MANUAL_SOURCE_ID) return true;
  if (!signals.supportsRoute(sourceId, dataType, "import")) return false;
  const announced = signals.capabilitiesFor(sourceId);
  if (announced === null) return true;
  const token = MANAGED_DATA_REGISTRY[dataType].capabilities.import;
  return token !== undefined && announced.includes(token);
};

export const buildSourceOfTruthOptions = (
  dataType: ManagedDataType,
  sources: readonly string[],
  policy: DataTypeSourcePolicy | undefined,
  signals: SourceCapabilitySignals
): SourceOfTruthOptions => {
  const saved = policy?.sourceOrder ?? [];
  const capable = sources.filter((id) => canServe(id, dataType, signals));
  const mode = policy?.mode ?? DEFAULT_DATA_TYPE_SOURCE_MODE;
  return {
    mode,
    choices: orderSources(capable, saved),
    current: mode === "priority" ? rankedHead(capable, saved) : undefined,
  };
};

/**
 * Offered only where the row has a decision to make: two or more sources, or
 * one source under a ranking already stored — which must stay reversible
 * however few sources are left. A lone source under the DEFAULT mode has
 * nothing to choose between, so a control there could only change the stored
 * semantics without changing what is read.
 *
 * A row with no source at all is excluded even under a stored ranking. There is
 * nothing to pick and nothing to keep, the two modes read identically (both
 * return nothing), and a panel would have to describe a ranking problem the row
 * does not have — its trouble is that the type has no source, which it already
 * says. Reachable: rank `planned-session` through chat, then Disconnect
 * Train2Go, which switches off every policy on the bridge.
 *
 * It is also why this control can never store an order that resolves to
 * nothing: `picked` is always one of `choices`, and where `choices` is empty
 * there is no control to pick from.
 */
export const canChooseSource = (options: SourceOfTruthOptions): boolean =>
  options.choices.length >= (options.mode === "priority" ? 1 : 2);

/**
 * The order to store when `picked` becomes the source of truth: it leads, and
 * every other choice stays behind it as a ranked fallback rather than being
 * dropped. `choices` is already `orderSources`-merged, so a previous ranking
 * survives underneath the new head.
 */
export const promoteSource = (
  options: SourceOfTruthOptions,
  picked: string
): string[] => [
  picked,
  ...options.choices.filter((sourceId) => sourceId !== picked),
];
