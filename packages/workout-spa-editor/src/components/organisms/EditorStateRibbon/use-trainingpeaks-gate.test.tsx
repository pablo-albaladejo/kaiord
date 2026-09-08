import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../../types/integration-policy";
import { useTrainingPeaksGate } from "./use-trainingpeaks-gate";

let mockDiscovered: Array<{ bridgeId: string }> = [];
let mockPolicies: IntegrationPolicy[] = [];

vi.mock("../../../hooks/use-discovered-bridges", () => ({
  useDiscoveredBridges: () => mockDiscovered,
}));

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (fn: () => unknown) => fn(),
}));

vi.mock("../../../hooks/integration-policy-repo", () => ({
  policyRepo: {},
}));

vi.mock(
  "../../../application/integration-policy/resolve-export-policies.use-case",
  () => ({ resolveExportPolicies: () => mockPolicies })
);

const PROFILE_ID = "p1";
const TP_BRIDGE = "trainingpeaks-bridge";

const policy = (overrides: Partial<IntegrationPolicy>): IntegrationPolicy => ({
  id: "00000000-0000-0000-0000-000000000002",
  profileId: PROFILE_ID,
  dataType: "workout",
  bridgeId: TP_BRIDGE,
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-01T00:00:00.000Z",
  ...overrides,
});

describe("useTrainingPeaksGate", () => {
  beforeEach(() => {
    mockDiscovered = [];
    mockPolicies = [];
  });

  it("should report no-extension when the bridge was never discovered", () => {
    // Arrange
    mockPolicies = [policy({})];

    // Act
    const { result } = renderHook(() => useTrainingPeaksGate(PROFILE_ID));

    // Assert
    expect(result.current).toBe("no-extension");
  });

  it("should report no-extension when only another bridge is present", () => {
    // Arrange
    mockDiscovered = [{ bridgeId: "garmin-bridge" }];
    mockPolicies = [policy({})];

    // Act
    const { result } = renderHook(() => useTrainingPeaksGate(PROFILE_ID));

    // Assert
    expect(result.current).toBe("no-extension");
  });

  it("should report export-disabled when no policy enables the export", () => {
    // Arrange
    mockDiscovered = [{ bridgeId: TP_BRIDGE }];
    mockPolicies = [];

    // Act
    const { result } = renderHook(() => useTrainingPeaksGate(PROFILE_ID));

    // Assert
    expect(result.current).toBe("export-disabled");
  });

  it("should report export-disabled when the policy exists but is off", () => {
    // Arrange
    mockDiscovered = [{ bridgeId: TP_BRIDGE }];
    mockPolicies = [policy({ enabled: false })];

    // Act
    const { result } = renderHook(() => useTrainingPeaksGate(PROFILE_ID));

    // Assert
    expect(result.current).toBe("export-disabled");
  });

  it("should not accept another bridge's enabled policy as this one's", () => {
    // Arrange
    mockDiscovered = [{ bridgeId: TP_BRIDGE }];
    mockPolicies = [policy({ bridgeId: "garmin-bridge" })];

    // Act
    const { result } = renderHook(() => useTrainingPeaksGate(PROFILE_ID));

    // Assert
    expect(result.current).toBe("export-disabled");
  });

  it("should report ready when the bridge is present and the export is enabled", () => {
    // Arrange
    mockDiscovered = [{ bridgeId: TP_BRIDGE }];
    mockPolicies = [policy({})];

    // Act
    const { result } = renderHook(() => useTrainingPeaksGate(PROFILE_ID));

    // Assert
    expect(result.current).toBe("ready");
  });

  it("should report export-disabled without a profile, since no policy resolves", () => {
    // Arrange
    mockDiscovered = [{ bridgeId: TP_BRIDGE }];
    mockPolicies = [policy({})];

    // Act
    const { result } = renderHook(() => useTrainingPeaksGate(undefined));

    // Assert
    expect(result.current).toBe("export-disabled");
  });
});
