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

  it.each([
    {
      scenario: "the bridge was never discovered",
      discovered: [] as Array<{ bridgeId: string }>,
      policies: [policy({})],
      profileId: PROFILE_ID as string | undefined,
      expected: "no-extension",
    },
    {
      scenario: "only another bridge is present",
      discovered: [{ bridgeId: "garmin-bridge" }],
      policies: [policy({})],
      profileId: PROFILE_ID as string | undefined,
      expected: "no-extension",
    },
    {
      scenario: "the bridge is present but no policy enables the export",
      discovered: [{ bridgeId: TP_BRIDGE }],
      policies: [],
      profileId: PROFILE_ID as string | undefined,
      expected: "export-disabled",
    },
    {
      scenario: "the policy exists but is off",
      discovered: [{ bridgeId: TP_BRIDGE }],
      policies: [policy({ enabled: false })],
      profileId: PROFILE_ID as string | undefined,
      expected: "export-disabled",
    },
    {
      scenario: "the only enabled policy belongs to another bridge",
      discovered: [{ bridgeId: TP_BRIDGE }],
      policies: [policy({ bridgeId: "garmin-bridge" })],
      profileId: PROFILE_ID as string | undefined,
      expected: "export-disabled",
    },
    {
      scenario: "no profile is given, so no policy resolves",
      discovered: [{ bridgeId: TP_BRIDGE }],
      policies: [policy({})],
      profileId: undefined,
      expected: "export-disabled",
    },
    {
      scenario: "the bridge is present and the export is enabled",
      discovered: [{ bridgeId: TP_BRIDGE }],
      policies: [policy({})],
      profileId: PROFILE_ID as string | undefined,
      expected: "ready",
    },
  ])(
    "should report $expected when $scenario",
    ({ discovered, policies, profileId, expected }) => {
      // Arrange
      mockDiscovered = discovered;
      mockPolicies = policies;

      // Act
      const { result } = renderHook(() => useTrainingPeaksGate(profileId));

      // Assert
      expect(result.current).toBe(expected);
    }
  );
});
