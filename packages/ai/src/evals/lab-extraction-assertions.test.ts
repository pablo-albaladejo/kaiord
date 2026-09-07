import { describe, expect, it } from "vitest";

import {
  DIMENSIONS_PER_ROW,
  scoreLabExtraction,
} from "./lab-extraction-assertions";
import type { LabExpectation } from "./lab-extraction-fixture";
import {
  EXPECTED_METADATA,
  EXPECTED_ROWS,
  SYNTHETIC_LAB_REPORT,
} from "./lab-extraction-fixture";

const META = EXPECTED_METADATA;

/** A perfect extraction, derived from the expectations themselves. */
const perfectValues = () =>
  EXPECTED_ROWS.map((row) => ({
    label: row.label,
    ...(row.key === null ? {} : { parameterKey: row.key }),
    value: row.value,
    ...(row.unit === undefined ? {} : { unit: row.unit }),
    ...(row.refText === undefined
      ? { refLow: row.refLow, refHigh: row.refHigh }
      : { refText: row.refText }),
  }));

const perfect = () => ({ ...META, values: perfectValues() });

const failed = (score: ReturnType<typeof scoreLabExtraction>) => {
  if (!score.ok) throw new Error(`harness fault: ${score.harnessFault}`);
  return score.checks.filter((c) => !c.pass);
};

describe("scoreLabExtraction", () => {
  it("should pass every check on a perfect extraction", () => {
    // Arrange
    const output = perfect();

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    expect(failed(score)).toEqual([]);
  });

  it("should report a harness fault when values is not an array", () => {
    // Arrange
    const output = { ...META, values: "not-an-array" };

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    expect(score.ok).toBe(false);
  });

  it("should not treat a harness fault as a failing score", () => {
    // Arrange
    const output = undefined;

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    expect(score).not.toHaveProperty("checks");
  });

  it("should fail the key check when GOT is mapped to alt", () => {
    // Arrange
    const output = perfect();
    const got = output.values.find((v) => v.label === "GOT");
    if (got) got.parameterKey = "alt";

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    expect(failed(score).map((c) => c.subject)).toContain("GOT");
  });

  it("should fail when a key is guessed for the uncatalogued parameter", () => {
    // Arrange
    const output = perfect();
    const extra = output.values.find(
      (v) => v.label === "Índice aterogénico"
    ) as Record<string, unknown>;
    extra.parameterKey = "cholesterol_total";

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    expect(failed(score).map((c) => c.subject)).toContain("Índice aterogénico");
  });

  it("should fail the value check when a decimal comma is not normalized", () => {
    // Arrange
    const output = perfect();
    const hb = output.values.find((v) => v.label === "Hemoglobina");
    if (hb) hb.value = 148;

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    const value = failed(score).filter((c) => c.dimension === "value");
    expect(value.map((c) => c.subject)).toEqual(["Hemoglobina"]);
  });

  it("should fail every dimension of a row that was not extracted", () => {
    // Arrange
    const output = perfect();
    output.values = output.values.filter((v) => v.label !== "TSH");

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    expect(failed(score).filter((c) => c.subject === "TSH")).toHaveLength(
      DIMENSIONS_PER_ROW
    );
  });

  it("should fail the metadata checks when the header is missed", () => {
    // Arrange
    const output = { ...perfect(), date: undefined, fasting: undefined };

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    expect(
      failed(score).filter((c) => c.dimension === "metadata")
    ).toHaveLength(2);
  });

  it("should accept a printed range whose decimal separator is a comma", () => {
    // Arrange
    const output = perfect();
    const idx = output.values.find(
      (v) => v.label === "Índice aterogénico"
    ) as Record<string, unknown>;
    idx.refText = "< 5.0";

    // Act
    const score = scoreLabExtraction(output, EXPECTED_ROWS, META);

    // Assert
    expect(failed(score)).toEqual([]);
  });
});

describe("SYNTHETIC_LAB_REPORT", () => {
  it("should print GOT and GPT without a translated parenthetical", () => {
    // Arrange
    const report = SYNTHETIC_LAB_REPORT;

    // Act
    const giveaway = /\((ALT|AST)\)/.test(report);

    // Assert
    expect(giveaway).toBe(false);
  });

  it("should carry one row for every expectation", () => {
    // Arrange
    const rows: readonly LabExpectation[] = EXPECTED_ROWS;

    // Act
    const missing = rows.filter(
      (row) => !SYNTHETIC_LAB_REPORT.includes(row.label)
    );

    // Assert
    expect(missing).toEqual([]);
  });
});
