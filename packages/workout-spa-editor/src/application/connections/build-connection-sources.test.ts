import { describe, expect, it } from "vitest";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { ConnectionRecord } from "../../types/connection";
import {
  buildConnectionSources,
  type ConnectionSourceSignals,
} from "./build-connection-sources";
import type { BridgeSessionSignal } from "./connection-source-status";

const NOW = "2026-07-29T00:00:00.000Z";
const CHECKED_AT = 1_700_000_000_000;

const INTEGRATIONS: IntegrationRegistryEntry[] = [
  {
    id: "garmin",
    name: "Garmin",
    mark: "G",
    mechanism: "bridge",
    bridgeId: "garmin-bridge",
  },
  {
    id: "tanita",
    name: "Tanita",
    mark: "Ta",
    mechanism: "bridge",
    bridgeId: "tanita-bridge",
  },
  {
    id: "manual",
    name: "Manual",
    mark: "M",
    mechanism: "manual",
    bridgeId: null,
  },
];

const live: BridgeSessionSignal = {
  sessionActive: true,
  checking: false,
  error: null,
  needsReauth: false,
  lastCheckedAt: CHECKED_AT,
};

const probeless: BridgeSessionSignal = {
  ...live,
  sessionActive: false,
  lastCheckedAt: null,
};

const signals = (
  over: Partial<ConnectionSourceSignals> = {}
): ConnectionSourceSignals => ({
  record: () => undefined,
  session: (id) => (id === "tanita-bridge" ? probeless : live),
  isDiscovered: () => true,
  lastSyncAt: () => undefined,
  announces: () => true,
  supportsRoute: () => true,
  ...over,
});

const byId = (sources: ReturnType<typeof buildConnectionSources>, id: string) =>
  sources.find((source) => source.id === id);

describe("buildConnectionSources", () => {
  it("should order connected sources ahead of manual entry", () => {
    // Arrange
    const s = signals();

    // Act
    const sources = buildConnectionSources(INTEGRATIONS, s);

    // Assert
    expect(sources.map((source) => source.id)).toEqual([
      "garmin",
      "tanita",
      "manual",
    ]);
  });

  it("should sink a disconnected bridge below the working ones", () => {
    // Arrange
    const disconnected: ConnectionRecord = {
      profileId: "p1",
      providerId: "garmin",
      status: "disconnected",
      mechanism: "bridge",
      updatedAt: NOW,
    };
    const s = signals({
      record: (id) => (id === "garmin" ? disconnected : undefined),
    });

    // Act
    const sources = buildConnectionSources(INTEGRATIONS, s);

    // Assert
    expect(sources[0]?.id).toBe("tanita");
    expect(byId(sources, "garmin")?.status).toBe("available");
    expect(byId(sources, "garmin")?.disconnected).toBe(true);
  });

  it("should claim no routes for an undiscovered extension", () => {
    // Arrange
    // Capabilities are announced by a running extension; an absent one has
    // announced nothing, so no chip may guess what it would carry.
    const s = signals({ isDiscovered: () => false });

    // Act
    const sources = buildConnectionSources(INTEGRATIONS, s);

    // Assert
    expect(byId(sources, "garmin")?.importTypes).toEqual([]);
    expect(byId(sources, "garmin")?.exportTypes).toEqual([]);
    expect(byId(sources, "garmin")?.bridgeDetected).toBe(false);
  });

  it("should drop a route the bridge announces but the SPA does not serve", () => {
    // Arrange
    const s = signals({
      supportsRoute: (_bridgeId, _dataType, direction) =>
        direction === "import",
    });

    // Act
    const sources = buildConnectionSources(INTEGRATIONS, s);

    // Assert
    expect(byId(sources, "garmin")?.exportTypes).toEqual([]);
    expect(byId(sources, "garmin")?.importTypes.length).toBeGreaterThan(0);
  });
});
