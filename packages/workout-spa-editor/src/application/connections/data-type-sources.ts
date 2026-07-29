/**
 * The sources a managed data type actually has, expressed in the STORAGE KEYS
 * `resolveEffectiveSource` filters by: enabled import routes, plus `manual`
 * where a real manual-entry path exists.
 *
 * ONE definition, deliberately. The routing rows read a head out of this set
 * and the "Change" control writes an order over it; two copies would let the
 * pill name a source the control cannot offer, or the control rank a source
 * the resolver never reaches.
 */
import type { ManagedDataType } from "@kaiord/core";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { integrationIdForBridge } from "../../integrations/integration-registry";
import { MANUAL_ENTRY_TYPES } from "../../integrations/manual-entry-types";

export const MANUAL_SOURCE_ID = "manual";

export const toIntegrationId = (sourceId: string): string =>
  sourceId === MANUAL_SOURCE_ID
    ? MANUAL_SOURCE_ID
    : (integrationIdForBridge(sourceId) ?? sourceId);

export const availableSources = (
  byDataType: DataFlowsByType,
  dataType: ManagedDataType
): string[] => {
  const enabled = (byDataType.get(dataType)?.import ?? []).filter(
    (route) => route.enabled
  );
  const sources = [...new Set(enabled.map((route) => route.bridgeId))];
  // Appended last so a saved priority order (which the Data Hub editor only
  // ever fills with bridges) keeps deciding the head.
  //
  // ⚠ ASYMMETRY: this gate is MANUAL_ENTRY_TYPES, while
  // `resolveEffectiveSource` exempts "manual" from its enabled filter
  // UNCONDITIONALLY. Giving a type a manual entry path without adding it here
  // makes this set and the resolver disagree silently. Widening it to every
  // type is not the fix — it would claim a source for types with no way to
  // enter one (`planned-session` has no manual authoring path at all).
  if (MANUAL_ENTRY_TYPES.has(dataType)) sources.push(MANUAL_SOURCE_ID);
  return sources;
};

/**
 * The saved order's first entry that is still an available source — exactly
 * what `resolveEffectiveSource` consults, so no surface can name a source the
 * resolver would not read from.
 *
 * Deliberately NOT `orderSources`: that APPENDS available-but-unranked sources,
 * so its head can be a source the resolver never reaches. It is the right
 * helper for COMPOSING an order to store (afterwards every source really is in
 * the order) and the wrong one for reading a head out of one.
 */
export const rankedHead = (
  sources: readonly string[],
  saved: readonly string[]
): string | undefined => saved.find((sourceId) => sources.includes(sourceId));
