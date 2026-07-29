/**
 * build-connection-sources — pure assembly of the Connections page cards.
 *
 * One card per `INTEGRATION_REGISTRY` entry, ordered by what the user can act
 * on. Every live signal is injected, so the hook layer wires discovery, Dexie
 * and the connection store and this stays unit-testable.
 */
import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { ConnectionRecord } from "../../types/connection";
import type { BridgeRouteSignals } from "./bridge-route-types";
import { bridgeRouteTypes } from "./bridge-route-types";
import { isSourceConnected } from "./connected-source";
import {
  type ConnectionSource,
  connectionSourceRank,
} from "./connection-source";
import {
  type BridgeSessionSignal,
  sourceStatus,
} from "./connection-source-status";

export type ConnectionSourceSignals = BridgeRouteSignals & {
  record: (integrationId: string) => ConnectionRecord | undefined;
  session: (bridgeId: string) => BridgeSessionSignal | undefined;
  isDiscovered: (bridgeId: string) => boolean;
  /** Injected rather than inferred — see connection-source-status. */
  hasSessionProbe: (bridgeId: string) => boolean;
  lastSyncAt: (bridgeId: string) => string | undefined;
};

const EMPTY: readonly never[] = [];

const buildOne = (
  entry: IntegrationRegistryEntry,
  s: ConnectionSourceSignals
): ConnectionSource => {
  const bridgeId = entry.bridgeId;
  const state = bridgeId === null ? undefined : s.session(bridgeId);
  const record = s.record(entry.id);
  const connected = isSourceConnected(entry, record, (id) =>
    s.isDiscovered(id)
  );
  // Capabilities are announced by a running extension. An absent one has
  // announced nothing, so no chip may claim what it "would" carry.
  const detected = bridgeId !== null && s.isDiscovered(bridgeId);
  return {
    id: entry.id,
    name: entry.name,
    mark: entry.mark,
    mechanism: entry.mechanism,
    bridgeId,
    status: sourceStatus(
      entry,
      state,
      connected,
      bridgeId !== null && s.hasSessionProbe(bridgeId)
    ),
    bridgeDetected: detected,
    disconnected: record?.status === "disconnected",
    sessionVerifiable: bridgeId !== null && s.hasSessionProbe(bridgeId),
    needsReauth: state?.needsReauth === true,
    outdated: state?.outdated === true,
    lastSyncAt: bridgeId === null ? undefined : s.lastSyncAt(bridgeId),
    importTypes:
      detected && bridgeId !== null
        ? bridgeRouteTypes(bridgeId, "import", s)
        : EMPTY,
    exportTypes:
      detected && bridgeId !== null
        ? bridgeRouteTypes(bridgeId, "export", s)
        : EMPTY,
  };
};

export const buildConnectionSources = (
  integrations: readonly IntegrationRegistryEntry[],
  signals: ConnectionSourceSignals
): ConnectionSource[] =>
  integrations
    .map((entry) => buildOne(entry, signals))
    .map((source, index) => ({ source, index }))
    .sort(
      (a, b) =>
        connectionSourceRank(a.source) - connectionSourceRank(b.source) ||
        a.index - b.index
    )
    .map(({ source }) => source);
