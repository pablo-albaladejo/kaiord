import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("../adapters/dexie/dexie-database", () => ({ db: {} }));

vi.mock("../adapters/dexie/dexie-export-ledger-repository", () => ({
  createDexieExportLedgerRepository: () => ({}),
}));

vi.mock("../adapters/trainingpeaks/trainingpeaks-workout-transport", () => ({
  pushTrainingPeaksWorkout: mocks.push,
}));

vi.mock("./integration-policy-repo", () => ({ policyRepo: {} }));

const { buildTrainingPeaksPushFn, TRAININGPEAKS_BRIDGE_ID } =
  await import("./trainingpeaks-push-fn");

const EXTENSION_ID = "tp-extension";
const PAYLOAD = { title: "Threshold 3x10", structure: '{"structure":[]}' };
const WORKOUT_ID = 4_242_424;

describe("buildTrainingPeaksPushFn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should relay the payload to the transport under the given extension", async () => {
    // Arrange
    mocks.push.mockResolvedValue(WORKOUT_ID);
    const pushFn = buildTrainingPeaksPushFn(EXTENSION_ID);

    // Act
    await pushFn(PAYLOAD);

    // Assert
    expect(mocks.push).toHaveBeenCalledWith(EXTENSION_ID, PAYLOAD);
  });

  it("should return the id as a string, since the ledger stores strings", async () => {
    // Arrange
    mocks.push.mockResolvedValue(WORKOUT_ID);
    const pushFn = buildTrainingPeaksPushFn(EXTENSION_ID);

    // Act
    const result = await pushFn(PAYLOAD);

    // Assert
    expect(result).toEqual({ externalId: String(WORKOUT_ID) });
    expect(typeof result.externalId).toBe("string");
  });

  it("should let a transport error propagate rather than invent an id", async () => {
    // Arrange
    mocks.push.mockRejectedValue(new Error("402 beyond the planning horizon"));
    const pushFn = buildTrainingPeaksPushFn(EXTENSION_ID);

    // Act
    const act = pushFn(PAYLOAD);

    // Assert
    await expect(act).rejects.toThrow("402 beyond the planning horizon");
  });

  it("should re-export the bridge id the push is routed to", () => {
    // Arrange
    const id = TRAININGPEAKS_BRIDGE_ID;

    // Act
    const isNonEmpty = typeof id === "string" && id.length > 0;

    // Assert
    expect(isNonEmpty).toBe(true);
  });
});
