import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY, managedDataTypes } from "@kaiord/core";

import type { IntegrationPolicyDirection } from "../../../types/integration-policy";

export type ConnectionFlow = {
  label: string;
  sublabel: string;
  dataType: ManagedDataType;
  direction: IntegrationPolicyDirection;
};

export type FlowAvailability = "operational" | "manual" | "coming-soon";

const DIRECTIONS: readonly IntegrationPolicyDirection[] = ["import", "export"];
const DIRECTION_COPY: Record<
  IntegrationPolicyDirection,
  { label: string; sublabel: string }
> = {
  import: { label: "Import", sublabel: "Reads from this bridge" },
  export: { label: "Export", sublabel: "Sends to this bridge" },
};

/** Required bridge capability token for a flow, sourced from the single
    domain registry — never hardcoded per flow, so a newly-announced
    capability (e.g. F4.1 adding read:body/read:sleep) makes the matching
    flow operational without any UI change. */
function requiredCapability(flow: ConnectionFlow): string | undefined {
  return MANAGED_DATA_REGISTRY[flow.dataType].capabilities[flow.direction];
}

/** Whether a flow is backed by the connected bridge's verified
    capabilities. Import flows without backend fall back to the existing
    manual FIT-import path ("manual"); export flows without backend have no
    manual equivalent, so they're flagged "coming-soon". Never returns
    "operational" unless the bridge actually announced the capability. */
export function flowAvailability(
  flow: ConnectionFlow,
  capabilities: readonly string[]
): FlowAvailability {
  const required = requiredCapability(flow);
  if (required !== undefined && capabilities.includes(required)) {
    return "operational";
  }
  return flow.direction === "import" ? "manual" : "coming-soon";
}

/**
 * Derives the flows a connected bridge can actually serve: every
 * (dataType, direction) in MANAGED_DATA_REGISTRY whose capability token
 * is among the bridge's REAL announced capabilities. Replaces the
 * hand-curated GARMIN_FLOWS/WHOOP_FLOWS catalogs (removed) — a newly
 * announced capability makes its flow appear with zero UI changes, and
 * a capability the bridge never announces never shows an aspirational
 * "manual" placeholder (F1.0 consensus: honest state over fake fallback).
 *
 * `flowAvailability` is still the source of truth for each derived
 * flow's status, kept as a separate call at the render site — so a
 * future staleness signal (bridge seen but capabilities expired) can
 * extend that function without another rewrite here.
 */
export function deriveConnectionFlows(
  capabilities: readonly string[]
): ConnectionFlow[] {
  const flows: ConnectionFlow[] = [];
  for (const dataType of managedDataTypes) {
    for (const direction of DIRECTIONS) {
      const token = MANAGED_DATA_REGISTRY[dataType].capabilities[direction];
      if (token === undefined || !capabilities.includes(token)) continue;
      const copy = DIRECTION_COPY[direction];
      flows.push({
        label: `${copy.label} ${MANAGED_DATA_REGISTRY[dataType].label}`,
        sublabel: copy.sublabel,
        dataType,
        direction,
      });
    }
  }
  return flows;
}
