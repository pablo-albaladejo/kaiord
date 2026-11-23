import { describe, expect, it } from "vitest";

import { FIT_ROUND_TRIP } from "../application/round-trip/contract/formats";
import type { RoundTripContract } from "../application/round-trip/contract/round-trip-contract";
import type { KRD } from "../domain/schemas/krd";
import { sportSchema } from "../domain/schemas/sport";
import { buildRoundTripCases, buildUnsupportedCases } from "./round-trip-cases";
import {
  roundTripReport,
  unsupportedButCarried,
  unusedDeclarations,
} from "./round-trip-report";

const identity = {
  read: async (text: string): Promise<KRD> => JSON.parse(text) as KRD,
  write: async (krd: KRD): Promise<string> => JSON.stringify(krd),
};

/** A format that drops workout notes and refuses calorie steps. */
const lossy = {
  read: identity.read,
  write: async (krd: KRD): Promise<string> => {
    const text = JSON.stringify(krd);
    if (text.includes('"calories"')) throw new Error("no calories");
    const copy = JSON.parse(text) as KRD;
    const workout = copy.extensions?.structured_workout as { notes?: string };
    delete workout.notes;
    return JSON.stringify(copy);
  },
};

const strict: RoundTripContract = {
  ...FIT_ROUND_TRIP,
  notCarried: [],
  filledIn: [],
};

describe("buildRoundTripCases", () => {
  it("should cover every sport, and leave out what the contract declares unsupported", () => {
    // Arrange
    const contract: RoundTripContract = {
      ...strict,
      unsupported: {
        durations: [{ type: "calories", reason: "none" }],
        targets: [{ type: "power", unit: "zone", reason: "none" }],
        intensities: [{ intensity: "other", reason: "none" }],
      },
      sports: { carried: ["cycling", "running"], reason: "two sports" },
    };

    // Act
    const carried = buildRoundTripCases(contract).map((c) => c.name);
    const unsupported = buildUnsupportedCases(contract).map((c) => c.name);

    // Assert
    expect(carried).toContain("duration time");
    expect(carried).toContain("target power/range/percent_ftp");
    expect(carried).toContain("structure");
    expect(carried).not.toContain("pool swim");
    expect(carried).not.toContain("target stroke_type/swim_stroke");
    expect(unsupported).toContain("duration calories");
    expect(unsupported).toContain("target power/zone");
    expect(unsupported).toContain("intensity other");
    expect(unsupported).toContain("sport swimming");
    expect(buildRoundTripCases(strict).map((c) => c.name)).toEqual(
      expect.arrayContaining(sportSchema.options.map((s) => `sport ${s}`))
    );
  });
});

describe("roundTripReport", () => {
  it("should find nothing for a format that keeps every value, and report a fixture it cannot read", async () => {
    // Arrange
    const fixtures = [{ name: "fixture", data: "not a KRD" }];

    // Act
    const report = await roundTripReport(strict, identity, []);
    const broken = await roundTripReport(strict, identity, fixtures);

    // Assert
    expect(report.differences).toEqual([]);
    expect(broken.differences).toHaveLength(1);
    expect(broken.differences[0]).toMatch(/^fixture: threw /);
  });

  it("should report a lost value and a refused write, and excuse a declared one", async () => {
    // Arrange
    const declared: RoundTripContract = {
      ...strict,
      notCarried: [
        { field: "extensions.structured_workout.notes", reason: "none" },
        { field: "never.used", reason: "stale" },
      ],
    };

    // Act
    const report = await roundTripReport(strict, lossy);
    const excused = await roundTripReport(declared, lossy);

    // Assert
    expect(report.differences).toContain(
      'structure (KRD → FIT → KRD): missing extensions.structured_workout.notes ("Stay seated on the hard reps." → undefined)'
    );
    expect(report.differences).toContain(
      "duration calories (KRD → FIT → KRD): threw no calories"
    );
    expect(excused.differences.join("\n")).not.toContain("notes");
    expect(unusedDeclarations(declared, excused)).toEqual(["never.used"]);
  });
});

describe("unsupportedButCarried", () => {
  it("should name a declared-unsupported kind the format keeps, and accept one it refuses", async () => {
    // Arrange
    const contract: RoundTripContract = {
      ...strict,
      unsupported: {
        durations: [{ type: "calories", reason: "refused" }],
        targets: [{ type: "power", unit: "zone", reason: "kept after all" }],
        intensities: [],
      },
    };

    // Act
    const carried = await unsupportedButCarried(contract, lossy);

    // Assert
    expect(carried).toEqual(["target power/zone"]);
  });
});
