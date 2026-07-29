/**
 * The two per-type maps the routing rows read, assembled over the whole of
 * `managedDataTypes` rather than over the rows that happen to have a policy:
 * a type with no source still has a row, and it is the row that most needs to
 * be told which sources could give it one.
 */
import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import {
  buildRouteToggles,
  type DataTypeRouteToggle,
  type RouteToggleSignals,
} from "./data-type-route-toggles";
import { availableSources } from "./data-type-sources";
import {
  buildSourceOfTruthOptions,
  type SourceCapabilitySignals,
  type SourceOfTruthOptions,
} from "./source-of-truth-options";

export const optionsByType = (
  byDataType: DataFlowsByType,
  policies: readonly DataTypeSourcePolicy[],
  signals: SourceCapabilitySignals
): ReadonlyMap<ManagedDataType, SourceOfTruthOptions> => {
  const byType = new Map(policies.map((policy) => [policy.dataType, policy]));
  return new Map(
    managedDataTypes.map((dataType) => [
      dataType,
      buildSourceOfTruthOptions(
        dataType,
        availableSources(byDataType, dataType),
        byType.get(dataType),
        signals
      ),
    ])
  );
};

export const togglesByType = (
  byDataType: DataFlowsByType,
  integrations: readonly IntegrationRegistryEntry[],
  signals: RouteToggleSignals
): ReadonlyMap<ManagedDataType, readonly DataTypeRouteToggle[]> =>
  new Map(
    managedDataTypes.map((dataType) => [
      dataType,
      buildRouteToggles(
        dataType,
        integrations,
        byDataType.get(dataType)?.import ?? [],
        signals
      ),
    ])
  );
