/**
 * Tests for useDataHubRouteEditor — mocks the use cases (same pattern as
 * DataFlowsRow.test.tsx) since this hook is pure orchestration; upsert/delete's
 * own persistence guarantees are covered by their use-case test suites. The
 * repositories come from a real in-memory `PersistencePort` through the
 * provider, which is what the hook now reads: removing a route has to tombstone
 * against the same port the rest of the app writes through.
 */
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { IntegrationPolicy } from "../../types/integration-policy";

const { mockUpsert, mockDelete } = vi.hoisted(() => ({
  mockUpsert: vi.fn(async () => ({}) as IntegrationPolicy),
  mockDelete: vi.fn(async () => undefined),
}));

vi.mock(
  "../../application/integration-policy/upsert-integration-policy.use-case",
  () => ({ upsertIntegrationPolicy: mockUpsert })
);
vi.mock(
  "../../application/integration-policy/delete-integration-policy.use-case",
  () => ({ deleteIntegrationPolicy: mockDelete })
);

import { useDataHubRouteEditor } from "./use-data-hub-route-editor";

const PROFILE_ID = "p1";
const EXISTING: IntegrationPolicy = {
  id: "route-1",
  profileId: PROFILE_ID,
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const renderEditor = (profileId: string | null) => {
  const persistence = createInMemoryPersistence();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(PersistenceProvider, { persistence, children });
  return {
    persistence,
    ...renderHook(() => useDataHubRouteEditor(profileId), { wrapper }),
  };
};

describe("useDataHubRouteEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upsert the found route with the new mode, preserving its other fields", async () => {
    // Arrange
    const { persistence, result } = renderEditor(PROFILE_ID);
    await persistence.integrationPolicy.put(EXISTING);

    // Act
    await result.current.setMode("workout", "export", "garmin-bridge", "auto");

    // Assert
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ...EXISTING, mode: "auto" })
    );
  });

  it("should query the natural key but not upsert when no route exists", async () => {
    // Arrange
    // the store is empty, so the lookup runs and finds nothing.
    const { persistence, result } = renderEditor(PROFILE_ID);
    const findByNaturalKey = vi.spyOn(
      persistence.integrationPolicy,
      "findByNaturalKey"
    );

    // Act
    await result.current.setMode("workout", "export", "garmin-bridge", "auto");

    // Assert
    expect(findByNaturalKey).toHaveBeenCalledWith({
      profileId: PROFILE_ID,
      dataType: "workout",
      direction: "export",
      bridgeId: "garmin-bridge",
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("should not even query when profileId is null", async () => {
    // Arrange
    // distinct from the case above: the guard returns BEFORE the
    // lookup, so "didn't query" and "queried and found nothing" stay
    // distinguishable.
    const { persistence, result } = renderEditor(null);
    const findByNaturalKey = vi.spyOn(
      persistence.integrationPolicy,
      "findByNaturalKey"
    );

    // Act
    await result.current.setMode("workout", "export", "garmin-bridge", "auto");

    // Assert
    expect(findByNaturalKey).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("should delete the route by id on remove", async () => {
    // Arrange
    const { result } = renderEditor(PROFILE_ID);

    // Act
    await result.current.remove("route-1");

    // Assert
    expect(mockDelete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: "route-1" })
    );
  });

  it("should pass the composed port's tombstone surface to the delete use case", async () => {
    // Arrange
    const { persistence, result } = renderEditor(PROFILE_ID);

    // Act
    await result.current.remove("route-1");

    // Assert
    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        policyRepo: persistence.integrationPolicy,
        tombstones: persistence.tombstones,
      }),
      expect.anything()
    );
  });
});
