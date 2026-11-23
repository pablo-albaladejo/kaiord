/**
 * The kinds of data a run of one Provider flow sent, read from the same
 * registry the inventory shows: every kind the flow carries, less its health
 * kinds when the athlete did not let them go. A Trace records this list.
 */
import { DATA_FLOWS, type HealthFlowId } from "./data-flows";
import { type DataKind, isHealthKind } from "./data-kinds";

export const kindsSent = (
  flow: HealthFlowId,
  healthSent: boolean
): DataKind[] =>
  (DATA_FLOWS[flow].kinds as readonly DataKind[]).filter(
    (kind) => healthSent || !isHealthKind(kind)
  );
