import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { DISABLED_BY_DISCONNECT } from "../../types/integration-policy";
import { useZonesAutoImport } from "./use-zones-auto-import";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000e1";

const store = vi.hoisted(() => ({
  persistence: null as ReturnType<typeof createInMemoryPersistence> | null,
}));

vi.mock("../integration-policy-repo", () => ({
  policyRepo: new Proxy(
    {},
    {
      get:
        (_target, name: string) =>
        (...args: never[]) =>
          (
            store.persistence?.integrationPolicy as unknown as Record<
              string,
              (...a: never[]) => unknown
            >
          )[name](...args),
    }
  ),
}));

const route: IntegrationPolicy = {
  id: "00000000-0000-4000-8000-0000000000e2",
  profileId: PROFILE_ID,
  dataType: "training-zones",
  direction: "import",
  bridgeId: "train2go-bridge",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const disconnected: IntegrationPolicy = {
  ...route,
  mode: "auto",
  enabled: false,
  disabledBy: DISABLED_BY_DISCONNECT,
};

describe("useZonesAutoImport", () => {
  it("should treat a mode change after Disconnect as a decision that drops the marker", async () => {
    // Arrange
    store.persistence = createInMemoryPersistence();
    await store.persistence.integrationPolicy.put(disconnected);
    const { result } = renderHook(() => useZonesAutoImport(PROFILE_ID));

    // Act
    await act(() => result.current.setEnabled(false));

    // Assert
    const saved = await store.persistence.integrationPolicy.getById(
      disconnected.id
    );
    expect(saved).toMatchObject({ mode: "manual", enabled: false });
    expect(saved).not.toHaveProperty("disabledBy");
  });

  it("should switch the mode without touching whether the route is on", async () => {
    // Arrange
    store.persistence = createInMemoryPersistence();
    await store.persistence.integrationPolicy.put(route);
    const { result } = renderHook(() => useZonesAutoImport(PROFILE_ID));

    // Act
    await act(() => result.current.setEnabled(true));

    // Assert
    expect(
      await store.persistence.integrationPolicy.getById(route.id)
    ).toMatchObject({ mode: "auto", enabled: true });
  });
});
