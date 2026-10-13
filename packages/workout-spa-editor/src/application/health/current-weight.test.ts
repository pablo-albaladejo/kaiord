import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { HealthWeightRecord } from "../../types/health/health-records";
import { getCurrentWeightKg, loadLatestWeighIn } from "./current-weight";

const PROFILE_ID = "p1";
const PROFILE_KG = 72.5;
const WEIGH_IN_KG = 71.9;
const OLDER_KG = 74;
const FUTURE_KG = 69;

const weighIn = (date: string, kg: number): HealthWeightRecord => ({
  id: `w-${date}`,
  profileId: PROFILE_ID,
  date,
  krd: {
    kind: "weight",
    version: "2.0",
    measuredAt: `${date}T07:00:00.000Z`,
    weightKilograms: kg,
  },
});

describe("getCurrentWeightKg", () => {
  it.each([
    {
      case: "a weigh-in wins over the profile weight",
      profile: { bodyWeight: PROFILE_KG },
      latest: weighIn("2026-10-12", WEIGH_IN_KG),
      expected: WEIGH_IN_KG,
    },
    {
      case: "a stale weigh-in still wins: it is a measurement",
      profile: { bodyWeight: PROFILE_KG },
      latest: weighIn("2020-01-01", OLDER_KG),
      expected: OLDER_KG,
    },
    {
      case: "a weigh-in counts even when the profile has no weight",
      profile: {},
      latest: weighIn("2026-10-12", WEIGH_IN_KG),
      expected: WEIGH_IN_KG,
    },
    {
      case: "no weigh-in falls back to the profile weight",
      profile: { bodyWeight: PROFILE_KG },
      latest: undefined,
      expected: PROFILE_KG,
    },
    {
      case: "nothing known is undefined, never a guess",
      profile: {},
      latest: undefined,
      expected: undefined,
    },
    {
      case: "no profile and no weigh-in is undefined",
      profile: undefined,
      latest: undefined,
      expected: undefined,
    },
  ])("should resolve $case", ({ profile, latest, expected }) => {
    // Arrange
    // Act
    const weight = getCurrentWeightKg(profile, latest);

    // Assert
    expect(weight).toBe(expected);
  });
});

describe("loadLatestWeighIn", () => {
  it("should pick the latest weigh-in up to the day and ignore later ones", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthWeight.put(weighIn("2026-10-01", OLDER_KG));
    await persistence.healthWeight.put(weighIn("2026-10-12", WEIGH_IN_KG));
    await persistence.healthWeight.put(weighIn("2026-10-20", FUTURE_KG));

    // Act
    const latest = await loadLatestWeighIn(
      persistence,
      PROFILE_ID,
      "2026-10-13"
    );

    // Assert
    expect(latest?.krd.weightKilograms).toBe(WEIGH_IN_KG);
  });

  it("should return undefined when the athlete has no weigh-ins", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const latest = await loadLatestWeighIn(
      persistence,
      PROFILE_ID,
      "2026-10-13"
    );

    // Assert
    expect(latest).toBeUndefined();
  });
});
