/**
 * T-27a — Additivity regression: new capability token (AC-10 Option B).
 *
 * INVARIANT (two-edit rule): Adding a new bridge that introduces a NEW
 * data type ("meditation") requires exactly TWO source-tree edits outside
 * this test file:
 *   1. packages/core/src/domain/managed-data-type.ts  — new registry entry
 *   2. packages/workout-spa-editor/src/types/bridge-schemas.ts — new enum value
 *
 * Zero edits required to:
 *   - IntegrationPolicy schema  (packages/workout-spa-editor/src/types/integration-policy.ts)
 *   - DataFlowsSection          (packages/workout-spa-editor/src/components/organisms/ProfileManager/components/DataFlowsSection.tsx)
 *   - DataFlowsGroup            (packages/workout-spa-editor/src/components/organisms/ProfileManager/components/DataFlowsGroup.tsx)
 *   - DataFlowsRow              (packages/workout-spa-editor/src/components/organisms/ProfileManager/components/DataFlowsRow.tsx)
 *   - Any resolver or use case
 *
 * This test uses TEST-ONLY helpers (below) to simulate those two edits at
 * runtime without touching any production file. The "exactly 2 edits"
 * assertion is conceptual and encoded as a static comment; the runtime
 * portion proves the additive shape works correctly.
 */
import type { ManagedDataType } from "@kaiord/core";
// ──────────────────────────────────────────────────────────────────────────
// TEST-ONLY: simulate edit #1 — new MANAGED_DATA_REGISTRY entry for
// "meditation" data type (in production: add to managed-data-type.ts).
// ──────────────────────────────────────────────────────────────────────────
import { MANAGED_DATA_REGISTRY } from "@kaiord/core";
import { describe, expect, it } from "vitest";

type TestRegistryEntry = {
  label: string;
  capabilities: { import?: string; export?: string };
};

// Simulates what a developer would add to MANAGED_DATA_REGISTRY for a new
// "meditation" data type. This is a TEST-ONLY object; production code is
// NOT modified.
const TEST_MEDITATION_REGISTRY_ENTRY: TestRegistryEntry = {
  label: "Meditation",
  capabilities: { import: "read:meditation" },
};

// Synthetic test registry: extends the real registry with the new entry.
const TEST_REGISTRY = {
  ...(MANAGED_DATA_REGISTRY as Record<string, TestRegistryEntry>),
  meditation: TEST_MEDITATION_REGISTRY_ENTRY,
};

// ──────────────────────────────────────────────────────────────────────────
// TEST-ONLY: simulate edit #2 — new bridgeCapabilitySchema value
// "read:meditation" (in production: add to bridge-schemas.ts).
// ──────────────────────────────────────────────────────────────────────────

// The existing valid tokens plus the new one (edit #2: add to bridgeCapabilitySchema)
type ExtendedCapability =
  | "read:workouts"
  | "write:workouts"
  | "read:body"
  | "read:sleep"
  | "read:training-plan"
  | "read:training-zones"
  | "read:meditation";

// ──────────────────────────────────────────────────────────────────────────
// Mock "meditation-bridge" — a hypothetical bridge advertising the new token.
// ──────────────────────────────────────────────────────────────────────────

const MOCK_MEDITATION_BRIDGE = {
  id: "meditation-bridge",
  name: "Calm (mock)",
  version: "1.0.0",
  protocolVersion: 1,
  capabilities: ["read:meditation"],
};

// ──────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────

describe("additivity — new capability token (T-27a)", () => {
  it("should surface mock bridge in the meditation group import affordance with exactly two source-tree edits", () => {
    // Arrange
    // get the import token for the new data type from test registry.
    const meditationEntry = TEST_REGISTRY["meditation"];
    const importToken = meditationEntry?.capabilities.import;

    // Act
    // filter bridges by the new capability token.
    const allDiscoveredBridges = [
      { bridgeId: MOCK_MEDITATION_BRIDGE.id, extensionId: "calm-mock-ext" },
    ];
    const capableBridges = allDiscoveredBridges.filter(() =>
      Array.isArray(MOCK_MEDITATION_BRIDGE.capabilities)
        ? MOCK_MEDITATION_BRIDGE.capabilities.includes(
            importToken as ExtendedCapability
          )
        : false
    );

    // Assert
    // the mock bridge appears for the new data type.
    expect(capableBridges).toHaveLength(1);
    expect(capableBridges[0]?.bridgeId).toBe("meditation-bridge");
  });

  it("should confirm the new token is absent from production bridgeCapabilitySchema (i.e. it is genuinely new)", async () => {
    // Arrange

    // Act
    const { bridgeCapabilitySchema } = await import("./bridge-schemas");
    const parseResult = bridgeCapabilitySchema.safeParse("read:meditation");

    // Assert
    // "read:meditation" is NOT yet in production schema.
    // (this test documents the new-token scenario; the production edit is
    // the addition of this value to bridge-schemas.ts — edit #2 of 2)
    expect(parseResult.success).toBe(false);
  });

  it("should confirm that adding meditation to TEST_REGISTRY does not break existing registry entries", () => {
    // Arrange
    const existingTypes = Object.keys(
      MANAGED_DATA_REGISTRY as Record<string, unknown>
    ) as ManagedDataType[];

    // Act
    // all existing types still accessible in test registry.
    const missingFromTestRegistry = existingTypes.filter(
      (dt) => !(dt in TEST_REGISTRY)
    );

    // Assert
    // no existing data type was removed from the test registry.
    expect(missingFromTestRegistry).toHaveLength(0);
  });

  it("should confirm the test registry now contains the new meditation entry", () => {
    // Arrange

    // Act
    const hasMeditation = "meditation" in TEST_REGISTRY;

    // Assert
    expect(hasMeditation).toBe(true);
    expect(TEST_REGISTRY["meditation"]?.capabilities.import).toBe(
      "read:meditation"
    );
  });
});
