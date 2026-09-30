/**
 * Disconnect → reconnect round trip: a reconnect restores exactly the routes
 * the Disconnect switched off, and nothing the user decided.
 */
import { describe, expect, it } from "vitest";

import { createInMemoryIntegrationPolicyRepository } from "../../test-utils/in-memory-integration-policy-repository";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { disableRoutesOnDisconnect } from "./disable-routes-on-disconnect.use-case";
import { restoreDisconnectedRoutes } from "./restore-disconnected-routes.use-case";
import { upsertIntegrationPolicy } from "./upsert-integration-policy.use-case";

const PROFILE_ID = "33333333-3333-4333-8333-333333333333";
const BRIDGE = "garmin-bridge";

const row = (
  id: string,
  over: Partial<IntegrationPolicy>
): IntegrationPolicy => ({
  id,
  profileId: PROFILE_ID,
  dataType: "activity",
  direction: "import",
  bridgeId: BRIDGE,
  mode: "auto",
  enabled: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const setup = (rows: IntegrationPolicy[]) => {
  const store = new Map(rows.map((r) => [r.id, r]));
  const deps = { policyRepo: createInMemoryIntegrationPolicyRepository(store) };
  return { store, deps };
};

describe("restoreDisconnectedRoutes", () => {
  it("should switch back on, in both directions, what a disconnect switched off", async () => {
    // Arrange
    const activity = row("a", { mode: "manual" });
    const workout = row("w", { dataType: "workout", direction: "export" });
    const { store, deps } = setup([activity, workout]);
    await disableRoutesOnDisconnect(deps, [activity, workout]);

    // Act
    await restoreDisconnectedRoutes(deps, {
      profileId: PROFILE_ID,
      bridgeId: BRIDGE,
    });

    // Assert
    expect(store.get("a")).toMatchObject({ enabled: true, mode: "manual" });
    expect(store.get("w")).toMatchObject({ enabled: true, mode: "auto" });
    expect(store.get("a")).not.toHaveProperty("disabledBy");
    expect(store.get("w")).not.toHaveProperty("disabledBy");
  });

  it("should leave a route the user had switched off before the disconnect off", async () => {
    // Arrange
    const userOff = row("a", { enabled: false });
    const { store, deps } = setup([userOff]);
    await disableRoutesOnDisconnect(deps, [userOff]);

    // Act
    await restoreDisconnectedRoutes(deps, {
      profileId: PROFILE_ID,
      bridgeId: BRIDGE,
    });

    // Assert
    expect(store.get("a")).toEqual(userOff);
  });

  it("should leave off a route the user toggled after the disconnect", async () => {
    // Arrange
    const activity = row("a", {});
    const { store, deps } = setup([activity]);
    await disableRoutesOnDisconnect(deps, [activity]);
    await upsertIntegrationPolicy(deps, {
      profileId: PROFILE_ID,
      dataType: "activity",
      direction: "import",
      bridgeId: BRIDGE,
      mode: "auto",
      enabled: false,
    });

    // Act
    await restoreDisconnectedRoutes(deps, {
      profileId: PROFILE_ID,
      bridgeId: BRIDGE,
    });

    // Assert
    expect(store.get("a")).toMatchObject({ enabled: false });
    expect(store.get("a")).not.toHaveProperty("disabledBy");
  });

  it("should not touch another bridge's disconnected routes", async () => {
    // Arrange
    const other = row("t", {
      bridgeId: "train2go-bridge",
      dataType: "planned-session",
    });
    const { store, deps } = setup([other]);
    await disableRoutesOnDisconnect(deps, [other]);

    // Act
    await restoreDisconnectedRoutes(deps, {
      profileId: PROFILE_ID,
      bridgeId: BRIDGE,
    });

    // Assert
    expect(store.get("t")).toMatchObject({
      enabled: false,
      disabledBy: "disconnect",
    });
  });
});
