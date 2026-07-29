/**
 * Supported-route filter behaviour in `cellState`. The filter is what keeps
 * phantom Data Hub cells (a bridge announcing the shared `read:body` token for
 * a type its importer never persists) from rendering as actionable.
 */
import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { bridgeSupportsRoute } from "../../integrations/bridge-supported-routes";
import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import type { IntegrationPolicyDirection } from "../../types/integration-policy";
import { cellState, type DataHubMatrixSignals } from "./data-hub-cell-state";

const READ_BODY = "read:body";
const IMPORT: IntegrationPolicyDirection = "import";

const entry = (id: string, bridgeId: string): IntegrationRegistryEntry => ({
  id,
  name: id,
  mark: id.slice(0, 2),
  mechanism: "bridge",
  bridgeId,
});

const TRAININGPEAKS = entry("trainingpeaks", "trainingpeaks-bridge");
const WHOOP = entry("whoop", "whoop-bridge");

const signals = (
  o: Partial<DataHubMatrixSignals> = {}
): DataHubMatrixSignals => ({
  isConnected: () => false,
  isBridgeConnected: () => true,
  bridgeAnnounces: () => true,
  isRouteEnabled: () => false,
  lastSyncedAt: () => undefined,
  findRoute: () => undefined,
  supportsRoute: bridgeSupportsRoute,
  ...o,
});

describe("cellState — supported-route filter", () => {
  it("should render an unsupported route as na even when online and announcing", () => {
    // Arrange
    const s = signals();

    // Act
    const result = cellState(
      TRAININGPEAKS,
      READ_BODY,
      IMPORT,
      s,
      "hrv" as ManagedDataType
    );

    // Assert
    expect(result).toBe("na");
  });

  it("should render an unsupported route as na even while the bridge is OFFLINE", () => {
    // Arrange
    // Support is a static property of the bridge, not of its session: an
    // offline unsupported cell must not read "not-connected" (it would invite
    // the user to install an extension that can never serve the route).
    const s = signals({ isBridgeConnected: () => false });

    // Act
    const result = cellState(
      TRAININGPEAKS,
      READ_BODY,
      IMPORT,
      s,
      "hrv" as ManagedDataType
    );

    // Assert
    expect(result).toBe("na");
  });

  it("should leave a supported route free to reach available", () => {
    // Arrange
    const s = signals();

    // Act
    const result = cellState(
      TRAININGPEAKS,
      READ_BODY,
      IMPORT,
      s,
      "weight" as ManagedDataType
    );

    // Assert
    expect(result).toBe("available");
  });

  it("should leave a bridge with no declared entry unrestricted", () => {
    // Arrange
    const s = signals();

    // Act
    const result = cellState(
      WHOOP,
      READ_BODY,
      IMPORT,
      s,
      "hrv" as ManagedDataType
    );

    // Assert
    expect(result).toBe("available");
  });

  it("should still report not-connected for a supported route on an offline bridge", () => {
    // Arrange
    const s = signals({ isBridgeConnected: () => false });

    // Act
    const result = cellState(
      TRAININGPEAKS,
      READ_BODY,
      IMPORT,
      s,
      "weight" as ManagedDataType
    );

    // Assert
    expect(result).toBe("not-connected");
  });
});
