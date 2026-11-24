/**
 * The Authority the Kaiord App picks by itself, read through the resolver
 * every health reading goes through (`resolveEffectiveSource`).
 */
import { describe, expect, it } from "vitest";

import { createInMemoryCapabilityDecisionRepository } from "../../test-utils/in-memory-capability-decision-repository";
import { createInMemoryDataTypeSourcePolicyRepository } from "../../test-utils/in-memory-data-type-source-policy-repository";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { authorityInForce } from "./authority-in-force";
import { AUTHORITY_MATRIX_ID } from "./automatic-authority";
import { resolveEffectiveSource } from "./resolve-effective-source.use-case";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const DAY = "2026-11-20";

const route = (bridgeId: string, enabled = true): IntegrationPolicy => ({
  id: crypto.randomUUID(),
  profileId: PROFILE_ID,
  dataType: "weight",
  bridgeId,
  direction: "import",
  mode: "auto",
  enabled,
  updatedAt: "2026-11-01T00:00:00.000Z",
});

type Setup = {
  routes?: IntegrationPolicy[];
  records: Array<{ sourceBridgeId: string; record: { kg: number } }>;
  chosen?: DataTypeSourcePolicy;
  matrix?: boolean;
};

const resolveWeight = async ({
  routes = [],
  records,
  chosen,
  matrix,
}: Setup) => {
  const sourcePolicyRepo = createInMemoryDataTypeSourcePolicyRepository();
  if (chosen) await sourcePolicyRepo.put(chosen);
  const capabilityDecisions = createInMemoryCapabilityDecisionRepository();
  if (matrix !== undefined) {
    await capabilityDecisions.put({
      profileId: PROFILE_ID,
      capabilityId: AUTHORITY_MATRIX_ID,
      on: matrix,
      updatedAt: "2026-11-01T00:00:00.000Z",
    });
  }
  return resolveEffectiveSource(
    {
      sourcePolicyRepo,
      capabilityDecisions,
      policyRepo: {
        findByProfileDirection: async () => routes,
      } as never,
      getRecordsForDay: async () => records,
    },
    { profileId: PROFILE_ID, dataType: "weight", day: DAY }
  );
};

const effectiveOf = (result: Awaited<ReturnType<typeof resolveWeight>>) =>
  result.mode === "union" ? undefined : result.effective?.sourceBridgeId;

const TRAININGPEAKS = {
  sourceBridgeId: "trainingpeaks-bridge",
  record: { kg: 71 },
};
const TANITA = { sourceBridgeId: "tanita-bridge", record: { kg: 70.4 } };

describe("automatic Authority", () => {
  it("should let the scale decide weight when two Platforms report it and nobody chose", async () => {
    // Arrange
    const setup: Setup = {
      routes: [route("trainingpeaks-bridge"), route("tanita-bridge")],
      records: [TANITA, TRAININGPEAKS],
    };

    // Act
    const result = await resolveWeight(setup);

    // Assert
    expect(result.mode).toBe("automatic");
    expect(effectiveOf(result)).toBe("tanita-bridge");
  });

  it("should let a value the athlete entered win on its day", async () => {
    // Arrange
    const setup: Setup = {
      routes: [route("tanita-bridge")],
      records: [TANITA, { sourceBridgeId: "manual", record: { kg: 69.9 } }],
    };

    // Act
    const result = await resolveWeight(setup);

    // Assert
    expect(effectiveOf(result)).toBe("manual");
  });

  it("should hand the kind to the next Platform when the Authority disconnects", async () => {
    // Arrange
    const setup: Setup = {
      routes: [route("tanita-bridge", false), route("trainingpeaks-bridge")],
      records: [TANITA, TRAININGPEAKS],
    };

    // Act
    const result = await resolveWeight(setup);

    // Assert
    expect(effectiveOf(result)).toBe("trainingpeaks-bridge");
  });

  it("should still show a disconnected Platform's value on a day nobody else reported", async () => {
    // Arrange
    const setup: Setup = {
      routes: [route("tanita-bridge", false), route("trainingpeaks-bridge")],
      records: [TANITA],
    };

    // Act
    const result = await resolveWeight(setup);

    // Assert
    expect(effectiveOf(result)).toBe("tanita-bridge");
  });

  it("should still show a value from a source the rule does not name", async () => {
    // Arrange
    const setup: Setup = {
      records: [{ sourceBridgeId: "unknown", record: { kg: 72 } }],
    };

    // Act
    const result = await resolveWeight(setup);

    // Assert
    expect(effectiveOf(result)).toBe("unknown");
  });

  it("should let a choice in the matrix override the automatic one", async () => {
    // Arrange
    const setup: Setup = {
      routes: [route("trainingpeaks-bridge"), route("tanita-bridge")],
      records: [TANITA, TRAININGPEAKS],
      chosen: {
        profileId: PROFILE_ID,
        dataType: "weight",
        mode: "priority",
        sourceOrder: ["trainingpeaks-bridge"],
      },
    };

    // Act
    const result = await resolveWeight(setup);

    // Assert
    expect(result.mode).toBe("priority");
    expect(effectiveOf(result)).toBe("trainingpeaks-bridge");
  });

  it("should stop applying a stored choice while the matrix is off", async () => {
    // Arrange
    const setup: Setup = {
      routes: [route("trainingpeaks-bridge"), route("tanita-bridge")],
      records: [TANITA, TRAININGPEAKS],
      chosen: {
        profileId: PROFILE_ID,
        dataType: "weight",
        mode: "priority",
        sourceOrder: ["trainingpeaks-bridge"],
      },
      matrix: false,
    };

    // Act
    const result = await resolveWeight(setup);

    // Assert
    expect(result.mode).toBe("automatic");
    expect(effectiveOf(result)).toBe("tanita-bridge");
  });

  it("should keep every source for an athlete who chose that before and never turned the matrix off", async () => {
    // Arrange
    const setup: Setup = {
      routes: [route("trainingpeaks-bridge"), route("tanita-bridge")],
      records: [TANITA, TRAININGPEAKS],
      chosen: {
        profileId: PROFILE_ID,
        dataType: "weight",
        mode: "union",
        sourceOrder: [],
      },
    };

    // Act
    const result = await resolveWeight(setup);

    // Assert
    expect(result.mode).toBe("union");
    expect(result.mode === "union" ? result.records : []).toHaveLength(2);
  });
});

describe("what Kaiord picks the Authority for", () => {
  const HEALTH_DATA = [
    "weight",
    "body-composition",
    "sleep",
    "hrv",
    "daily-wellness",
    "stress",
    "strain",
    "vitals",
    "heart-rate-series",
  ] as const;
  const KEPT_FROM_EVERY_SOURCE = [
    "activity",
    "planned-session",
    "workout",
  ] as const;

  it("should pick one Platform for every kind of health data when nobody chose", () => {
    // Arrange
    const kinds = HEALTH_DATA;

    // Act
    const modes = kinds.map(
      (kind) => authorityInForce(kind, undefined, []).mode
    );

    // Assert
    expect(modes).toEqual(kinds.map(() => "automatic"));
  });

  it("should keep Activities, planned sessions and Workouts from every source when nobody chose", () => {
    // Arrange
    const kinds = KEPT_FROM_EVERY_SOURCE;

    // Act
    const read = kinds.map((kind) => authorityInForce(kind, undefined, []));

    // Assert
    expect(read).toEqual(
      kinds.map(() => ({ mode: "union", sourceOrder: [], disabled: new Set() }))
    );
  });
});
