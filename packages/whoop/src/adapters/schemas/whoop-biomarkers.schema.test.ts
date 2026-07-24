import { describe, expect, it } from "vitest";

import { BIOMARKER_SUMMARY_FIXTURE } from "../../test-utils/biomarkers-fixture";
import {
  measuredBiomarkers,
  whoopBiomarkerSummarySchema,
  whoopBiomarkerTestsResponseSchema,
} from "./whoop-biomarkers.schema";

const FIXTURE_BIOMARKER_COUNT = 4;
const TEST_ENTRY = { id: "1", display_name: "Blood" };

describe("whoopBiomarkerTestsResponseSchema", () => {
  it.each([
    { shape: "bare-array", payload: [TEST_ENTRY] },
    { shape: "records-wrapped", payload: { records: [TEST_ENTRY] } },
    { shape: "tests-wrapped", payload: { tests: [TEST_ENTRY] } },
  ])("should normalize a $shape biomarker-tests response", ({ payload }) => {
    // Arrange

    // Act
    const result = whoopBiomarkerTestsResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.[0].display_name).toBe("Blood");
  });
});

describe("whoopBiomarkerSummarySchema", () => {
  it("should parse the fixture summary", () => {
    // Arrange
    const payload = BIOMARKER_SUMMARY_FIXTURE;

    // Act
    const result = whoopBiomarkerSummarySchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.biomarkers).toHaveLength(FIXTURE_BIOMARKER_COUNT);
  });

  it("should tolerate extra unmodelled fields at the summary and biomarker level", () => {
    // Arrange
    const payload = {
      biomarker_test_id: "t1",
      unknown_top_level_field: true,
      biomarkers: [
        { biomarker_name: "x", status: "OPTIMAL", unknown_field: "extra" },
      ],
    };

    // Act
    const result = whoopBiomarkerSummarySchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should default biomarkers to an empty array when omitted", () => {
    // Arrange
    const payload = { biomarker_test_id: "t1" };

    // Act
    const result = whoopBiomarkerSummarySchema.safeParse(payload);

    // Assert
    expect(result.data?.biomarkers).toEqual([]);
  });

  it("should reject a biomarker missing biomarker_name", () => {
    // Arrange
    const payload = {
      biomarker_test_id: "t1",
      biomarkers: [{ status: "OPTIMAL" }],
    };

    // Act
    const result = whoopBiomarkerSummarySchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("measuredBiomarkers", () => {
  it("should return every measured biomarker from the fixture in order", () => {
    // Arrange
    const summary = whoopBiomarkerSummarySchema.parse(
      BIOMARKER_SUMMARY_FIXTURE
    );

    // Act
    const measured = measuredBiomarkers(summary);

    // Assert
    expect(measured.map((b) => b.biomarker_name)).toEqual([
      "alt",
      "hdl_cholesterol",
      "custom_marker",
    ]);
  });

  it.each([
    { scenario: "a missing status", biomarkers: [{ biomarker_name: "x" }] },
    {
      scenario: "an UNAVAILABLE status",
      biomarkers: [{ biomarker_name: "x", status: "UNAVAILABLE" }],
    },
  ])("should treat $scenario as unmeasured", ({ biomarkers }) => {
    // Arrange
    const summary = whoopBiomarkerSummarySchema.parse({
      biomarker_test_id: "t1",
      biomarkers,
    });

    // Act
    const measured = measuredBiomarkers(summary);

    // Assert
    expect(measured).toEqual([]);
  });
});
