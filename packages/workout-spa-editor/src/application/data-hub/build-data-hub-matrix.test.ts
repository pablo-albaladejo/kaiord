import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { IntegrationPolicyDirection } from "../../types/integration-policy";
import {
  buildDataHubMatrix,
  type DataHubMatrixSignals,
  type DataHubRow,
} from "./build-data-hub-matrix";

const INTEGRATIONS: IntegrationRegistryEntry[] = [
  {
    id: "garmin",
    name: "Garmin",
    mark: "G",
    mechanism: "bridge",
    bridgeId: "garmin-bridge",
  },
  {
    id: "train2go",
    name: "Train2Go",
    mark: "T2",
    mechanism: "bridge",
    bridgeId: "train2go-bridge",
  },
  {
    id: "manual",
    name: "Manual",
    mark: "M",
    mechanism: "manual",
    bridgeId: null,
  },
  {
    id: "intervals",
    name: "intervals.icu",
    mark: "i",
    mechanism: "api-key",
    bridgeId: null,
  },
  {
    id: "strava",
    name: "Strava",
    mark: "S",
    mechanism: "not-supported",
    bridgeId: null,
  },
];

const signals = (
  o: Partial<DataHubMatrixSignals> = {}
): DataHubMatrixSignals => ({
  isConnected: () => false,
  isBridgeOnline: () => false,
  bridgeAnnounces: () => false,
  isRouteEnabled: () => false,
  lastSyncedAt: () => undefined,
  ...o,
});

const cell = (
  rows: DataHubRow[],
  dataType: ManagedDataType,
  integrationId: string,
  direction: IntegrationPolicyDirection
) =>
  rows
    .find((r) => r.dataType === dataType)
    ?.cells.find(
      (c) => c.integrationId === integrationId && c.direction === direction
    );

describe("buildDataHubMatrix", () => {
  it("should render one row per managed data type with the registry label", () => {
    // Arrange

    // Act
    const rows = buildDataHubMatrix(INTEGRATIONS, signals());

    // Assert
    expect(rows).toHaveLength(managedDataTypes.length);
    expect(cell(rows, "workout", "garmin", "export")?.state).toBeDefined();
  });

  it("should mark Manual active only for types with a real manual path", () => {
    // Arrange

    // Act
    const rows = buildDataHubMatrix(INTEGRATIONS, signals());

    // Assert
    expect(cell(rows, "weight", "manual", "import")?.state).toBe("manual");
    expect(cell(rows, "workout", "manual", "import")?.state).toBe("manual");
    // No manual authoring path for a coach session, and export never manual.
    expect(cell(rows, "planned-session", "manual", "import")?.state).toBe("na");
    expect(cell(rows, "workout", "manual", "export")?.state).toBe("na");
  });

  it("should mark a not-supported provider aspirational", () => {
    // Arrange

    // Act
    const rows = buildDataHubMatrix(INTEGRATIONS, signals());

    // Assert
    expect(cell(rows, "workout", "strava", "export")?.state).toBe(
      "aspirational"
    );
  });

  it("should read not-connected from the connection signal, not policies", () => {
    // Arrange
    const s = signals({ isRouteEnabled: () => true });

    // Act
    const rows = buildDataHubMatrix(INTEGRATIONS, s);

    // Assert
    // Even with an enabled policy, no connection ⇒ not-connected.
    expect(cell(rows, "workout", "garmin", "export")?.state).toBe(
      "not-connected"
    );
  });

  it("should mark a linked-but-offline bridge not-operational", () => {
    // Arrange
    const s = signals({ isConnected: () => true, isBridgeOnline: () => false });

    // Act
    const rows = buildDataHubMatrix(INTEGRATIONS, s);

    // Assert
    expect(cell(rows, "workout", "garmin", "export")?.state).toBe(
      "not-operational"
    );
  });

  it("should mark an eligible connected bridge available without a policy", () => {
    // Arrange
    const s = signals({
      isConnected: (id) => id === "garmin",
      isBridgeOnline: () => true,
      bridgeAnnounces: (b, t) =>
        b === "garmin-bridge" && t === "write:workouts",
    });

    // Act
    const rows = buildDataHubMatrix(INTEGRATIONS, s);

    // Assert
    expect(cell(rows, "workout", "garmin", "export")?.state).toBe("available");
  });

  it("should mark an enabled route active and surface its freshness", () => {
    // Arrange
    const s = signals({
      isConnected: (id) => id === "garmin",
      isBridgeOnline: () => true,
      bridgeAnnounces: (b, t) =>
        b === "garmin-bridge" && t === "write:workouts",
      isRouteEnabled: (dt, dir, b) =>
        dt === "workout" && dir === "export" && b === "garmin-bridge",
      lastSyncedAt: () => "2026-05-01T10:00:00.000Z",
    });

    // Act
    const rows = buildDataHubMatrix(INTEGRATIONS, s);
    const c = cell(rows, "workout", "garmin", "export");

    // Assert
    expect(c?.state).toBe("active");
    expect(c?.enabled).toBe(true);
    expect(c?.lastSyncedAt).toBe("2026-05-01T10:00:00.000Z");
  });

  it("should mark a connected bridge n/a for a capability it never announces", () => {
    // Arrange
    // garmin is connected + online but never announces the flow token.
    const s = signals({
      isConnected: () => true,
      isBridgeOnline: () => true,
      bridgeAnnounces: () => false,
    });

    // Act
    const rows = buildDataHubMatrix(INTEGRATIONS, s);

    // Assert
    expect(cell(rows, "planned-session", "garmin", "import")?.state).toBe("na");
  });
});
