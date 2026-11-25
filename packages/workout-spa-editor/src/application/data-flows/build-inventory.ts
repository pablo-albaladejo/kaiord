/**
 * The inventory shown in Settings, Privacy: every destination, grouped, with
 * every flow that reaches it and the kinds of data that flow carries, all
 * read from the flow registry. `active` says whether a destination is set up
 * for this athlete now.
 */
import { DATA_FLOW_IDS, DATA_FLOWS, type DataFlowId } from "./data-flows";
import type { DataKind } from "./data-kinds";
import {
  type Destination,
  DESTINATION_IDS,
  type DestinationId,
  DESTINATIONS,
} from "./destinations";

const flowsTo = (destination: DestinationId): DataFlowId[] =>
  DATA_FLOW_IDS.filter((id) =>
    (DATA_FLOWS[id].to as readonly DestinationId[]).includes(destination)
  );

export type InventoryDestination = {
  id: DestinationId;
  name: string;
  active: boolean;
  flows: { id: DataFlowId; kinds: readonly DataKind[] }[];
};

export type InventoryGroup = {
  group: Destination["group"];
  destinations: InventoryDestination[];
};

const GROUP_ORDER: readonly Destination["group"][] = [
  "provider",
  "platform",
  "service",
  "analytics",
];

export const buildDataFlowInventory = (
  active: (id: DestinationId) => boolean
): InventoryGroup[] =>
  GROUP_ORDER.map((group) => ({
    group,
    destinations: DESTINATION_IDS.filter(
      (id) => DESTINATIONS[id].group === group
    ).map((id) => ({
      id,
      name: DESTINATIONS[id].name,
      active: active(id),
      flows: flowsTo(id).map((flow) => ({
        id: flow,
        kinds: DATA_FLOWS[flow].kinds,
      })),
    })),
  }));
