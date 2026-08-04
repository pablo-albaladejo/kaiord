import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IntegrationPolicy } from "../../../types/integration-policy";
import { useGarminGate } from "./use-garmin-gate";

const mockState = { extensionInstalled: false, sessionActive: false };
let mockPolicies: IntegrationPolicy[] = [];

vi.mock("../../../contexts", () => ({
  useGarminBridge: () => ({ ...mockState }),
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

const ENABLED_POLICY: IntegrationPolicy = {
  id: "00000000-0000-0000-0000-000000000001",
  profileId: "p1",
  dataType: "workout",
  bridgeId: "garmin-bridge",
  direction: "export",
  mode: "manual",
  enabled: true,
  updatedAt: "2026-05-01T00:00:00.000Z",
};

describe("useGarminGate", () => {
  beforeEach(() => {
    mockState.extensionInstalled = false;
    mockState.sessionActive = false;
    mockPolicies = [];
  });

  it("should report the missing bridge first, so the commonest cause is nameable", () => {
    // Arrange
    mockPolicies = [ENABLED_POLICY];

    // Act
    const { result } = renderHook(() => useGarminGate("p1"));

    // Assert
    expect(result.current).toBe("no-extension");
  });

  it("should report a missing export route once the bridge is present", () => {
    // Arrange
    mockState.extensionInstalled = true;
    mockPolicies = [];

    // Act
    const { result } = renderHook(() => useGarminGate("p1"));

    // Assert
    expect(result.current).toBe("export-disabled");
  });

  it.each([
    {
      label: "the policy is disabled",
      policy: { ...ENABLED_POLICY, enabled: false },
    },
    {
      label: "the enabled policy targets another bridge",
      policy: { ...ENABLED_POLICY, bridgeId: "whoop-bridge" },
    },
  ])("should report export-disabled when $label", ({ policy }) => {
    // Arrange
    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockPolicies = [policy];

    // Act
    const { result } = renderHook(() => useGarminGate("p1"));

    // Assert
    expect(result.current).toBe("export-disabled");
  });

  it("should report the expired session last, once bridge and route are in place", () => {
    // Arrange
    mockState.extensionInstalled = true;
    mockState.sessionActive = false;
    mockPolicies = [ENABLED_POLICY];

    // Act
    const { result } = renderHook(() => useGarminGate("p1"));

    // Assert
    expect(result.current).toBe("no-session");
  });

  it("should report a reachable watch when the whole chain is intact", () => {
    // Arrange
    mockState.extensionInstalled = true;
    mockState.sessionActive = true;
    mockPolicies = [ENABLED_POLICY];

    // Act
    const { result } = renderHook(() => useGarminGate("p1"));

    // Assert
    expect(result.current).toBe("ready");
  });
});
