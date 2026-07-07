/**
 * Tests for useDataHubRouteEditor — mocks the Dexie repo + use cases (same
 * pattern as DataFlowsRow.test.tsx) since this hook is pure orchestration;
 * upsert/delete's own persistence guarantees are covered by their use-case
 * test suites.
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../types/integration-policy";

const { mockFindByNaturalKey, mockUpsert, mockDelete } = vi.hoisted(() => ({
  mockFindByNaturalKey: vi.fn(
    async (): Promise<IntegrationPolicy | undefined> => undefined
  ),
  mockUpsert: vi.fn(async () => ({}) as IntegrationPolicy),
  mockDelete: vi.fn(async () => undefined),
}));

vi.mock("../../adapters/dexie/dexie-database", () => ({ db: {} }));
vi.mock("../../adapters/dexie/dexie-integration-policy-repository", () => ({
  createDexieIntegrationPolicyRepository: () => ({
    findByNaturalKey: mockFindByNaturalKey,
    findByProfileDirection: vi.fn(async () => []),
    put: vi.fn(async () => undefined),
    deleteById: vi.fn(async () => undefined),
  }),
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

describe("useDataHubRouteEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindByNaturalKey.mockResolvedValue(undefined);
  });

  it("should upsert the found route with the new mode, preserving its other fields", async () => {
    // Arrange
    mockFindByNaturalKey.mockResolvedValueOnce(EXISTING);
    const { result } = renderHook(() => useDataHubRouteEditor(PROFILE_ID));

    // Act
    await result.current.setMode("workout", "export", "garmin-bridge", "auto");

    // Assert
    expect(mockFindByNaturalKey).toHaveBeenCalledWith({
      profileId: PROFILE_ID,
      dataType: "workout",
      direction: "export",
      bridgeId: "garmin-bridge",
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ...EXISTING, mode: "auto" })
    );
  });

  it("should no-op setMode when no route exists for that natural key", async () => {
    // Arrange
    mockFindByNaturalKey.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDataHubRouteEditor(PROFILE_ID));

    // Act
    await result.current.setMode("workout", "export", "garmin-bridge", "auto");

    // Assert
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("should no-op setMode when profileId is null", async () => {
    // Arrange
    const { result } = renderHook(() => useDataHubRouteEditor(null));

    // Act
    await result.current.setMode("workout", "export", "garmin-bridge", "auto");

    // Assert
    expect(mockFindByNaturalKey).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("should delete the route by id on remove", async () => {
    // Arrange
    const { result } = renderHook(() => useDataHubRouteEditor(PROFILE_ID));

    // Act
    await result.current.remove("route-1");

    // Assert
    expect(mockDelete).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: "route-1" })
    );
  });
});
