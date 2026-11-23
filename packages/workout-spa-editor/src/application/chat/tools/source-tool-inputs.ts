/**
 * Inputs of the two Tools that change where a kind of data is read from.
 * `integrationId` and `sourceOrder` hold chat-facing INTEGRATION_REGISTRY ids
 * (e.g. "whoop", "train2go"), resolved to the storage key (the bridge id) by
 * the op implementation (hooks/chat/). A `sourceOrder` of a single id means
 * "read only from that source".
 */
import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeSourceMode } from "../../../types/data-type-source-policy";
import type { IntegrationPolicyDirection } from "../../../types/integration-policy";

/** `set_data_route`: switch one source's import or export on or off. */
export type SetDataRouteInput = {
  action: "enable_route" | "disable_route";
  dataType: ManagedDataType;
  integrationId: string;
  direction: IntegrationPolicyDirection;
};

/** `set_authority`: the athlete's own choice of Authority for one kind. */
export type SetAuthorityInput = {
  dataType: ManagedDataType;
  mode: DataTypeSourceMode;
  sourceOrder?: string[];
};
