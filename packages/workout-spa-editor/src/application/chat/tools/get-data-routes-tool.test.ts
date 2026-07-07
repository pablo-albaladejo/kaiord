import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { DataHubMatrixSignals } from "../../data-hub/build-data-hub-matrix";
import { createGetDataRoutesTool } from "./get-data-routes-tool";

const PROFILE_ID = "p1";
const TODAY = "2026-07-07";

const signals = (): DataHubMatrixSignals => ({
  isConnected: () => false,
  isBridgeOnline: (bridgeId) => bridgeId === "train2go-bridge",
  bridgeAnnounces: (bridgeId, token) =>
    bridgeId === "train2go-bridge" && token === "read:training-plan",
  isRouteEnabled: (dataType, direction, bridgeId) =>
    dataType === "planned-session" &&
    direction === "import" &&
    bridgeId === "train2go-bridge",
  lastSyncedAt: (id) =>
    id === "train2go" ? "2026-07-06T08:00:00.000Z" : undefined,
  findRoute: (dataType, direction, bridgeId) =>
    dataType === "planned-session" &&
    direction === "import" &&
    bridgeId === "train2go-bridge"
      ? { id: "route-1", mode: "auto" as const }
      : undefined,
});

type ToolResult = { day: string; dataTypes: Array<{ dataType: string }> };

describe("createGetDataRoutesTool", () => {
  it("should be a read tool that never requires confirmation", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const tool = createGetDataRoutesTool({
      persistence,
      profileId: PROFILE_ID,
      today: TODAY,
      getMatrixSignals: async () => signals(),
    });

    // Act

    // Assert
    expect(tool.requiresConfirmation).toBe(false);
    expect(tool.name).toBe("get_data_routes");
  });

  it("should return every managed data type when no filter is given", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const tool = createGetDataRoutesTool({
      persistence,
      profileId: PROFILE_ID,
      today: TODAY,
      getMatrixSignals: async () => signals(),
    });

    // Act
    const result = (await tool.execute({})) as ToolResult;

    // Assert
    expect(result.dataTypes.map((d) => d.dataType).sort()).toEqual(
      [...managedDataTypes].sort()
    );
  });

  it("should restrict the answer to the requested data type", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const tool = createGetDataRoutesTool({
      persistence,
      profileId: PROFILE_ID,
      today: TODAY,
      getMatrixSignals: async () => signals(),
    });

    // Act
    const result = (await tool.execute({
      dataType: "planned-session",
    })) as ToolResult;

    // Assert
    expect(result.dataTypes).toHaveLength(1);
    expect(result.dataTypes[0].dataType).toBe("planned-session");
  });

  it("should name the real active source for a routed data type", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const tool = createGetDataRoutesTool({
      persistence,
      profileId: PROFILE_ID,
      today: TODAY,
      getMatrixSignals: async () => signals(),
    });

    // Act
    const result = (await tool.execute({ dataType: "planned-session" })) as {
      dataTypes: Array<{
        routes: Array<{
          integrationId: string;
          state: string;
          enabled: boolean;
        }>;
      }>;
    };

    // Assert
    const route = result.dataTypes[0].routes.find(
      (r) => r.integrationId === "train2go"
    );
    expect(route).toMatchObject({ state: "active", enabled: true });
  });
});
