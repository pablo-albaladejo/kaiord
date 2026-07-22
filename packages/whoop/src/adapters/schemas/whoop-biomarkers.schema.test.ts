import { describe, expect, it } from "vitest";

import { BIOMARKER_SUMMARY_FIXTURE } from "../../test-utils/biomarkers-fixture";
import {
  measuredBiomarkers,
  whoopBiomarkerSummarySchema,
  whoopBiomarkerTestsResponseSchema,
} from "./whoop-biomarkers.schema";

const FIXTURE_BIOMARKER_COUNT = 4;
const MEASURED_BIOMARKER_COUNT = 3;

describe("whoopBiomarkerTestsResponseSchema", () => {
  it("should normalize a bare-array biomarker-tests response", () => {
    // Arrange
    const payload = [{ id: "1", display_name: "Blood" }];

    // Act
    const result = whoopBiomarkerTestsResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.[0].display_name).toBe("Blood");
  });

  it("should normalize a records-wrapped biomarker-tests response", () => {
    // Arrange
    const payload = { records: [{ id: "1", display_name: "Blood" }] };

    // Act
    const result = whoopBiomarkerTestsResponseSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.[0].display_name).toBe("Blood");
  });

  it("should normalize a tests-wrapped biomarker-tests response", () => {
    // Arrange
    const payload = { tests: [{ id: "1", display_name: "Blood" }] };

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

  it("should tolerate null units and a null value on a biomarker", () => {
    // Arrange
    const payload = {
      biomarker_test_id: "t1",
      biomarkers: [
        { biomarker_name: "x", value: null, units: null, status: "OPTIMAL" },
      ],
    };

    // Act
    const result = whoopBiomarkerSummarySchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
  });

  it("should tolerate a biomarker with no reference ranges at all", () => {
    // Arrange
    const payload = {
      biomarker_test_id: "t1",
      biomarkers: [{ biomarker_name: "x", status: "OPTIMAL" }],
    };

    // Act
    const result = whoopBiomarkerSummarySchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
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
  it("should filter out UNAVAILABLE biomarkers", () => {
    // Arrange
    const summary = whoopBiomarkerSummarySchema.parse(
      BIOMARKER_SUMMARY_FIXTURE
    );

    // Act
    const measured = measuredBiomarkers(summary);

    // Assert
    expect(measured.some((b) => b.biomarker_name === "vitamin_d")).toBe(false);
  });

  it("should keep a measured biomarker even when its value is null", () => {
    // Arrange
    const summary = whoopBiomarkerSummarySchema.parse(
      BIOMARKER_SUMMARY_FIXTURE
    );

    // Act
    const measured = measuredBiomarkers(summary);

    // Assert
    expect(measured.some((b) => b.biomarker_name === "custom_marker")).toBe(
      true
    );
  });

  it("should return every measured biomarker from the fixture in order", () => {
    // Arrange
    const summary = whoopBiomarkerSummarySchema.parse(
      BIOMARKER_SUMMARY_FIXTURE
    );

    // Act
    const measured = measuredBiomarkers(summary);

    // Assert
    expect(measured).toHaveLength(MEASURED_BIOMARKER_COUNT);
    expect(measured.map((b) => b.biomarker_name)).toEqual([
      "alt",
      "hdl_cholesterol",
      "custom_marker",
    ]);
  });

  it("should treat a missing status as unmeasured", () => {
    // Arrange
    const summary = whoopBiomarkerSummarySchema.parse({
      biomarker_test_id: "t1",
      biomarkers: [{ biomarker_name: "x" }],
    });

    // Act
    const measured = measuredBiomarkers(summary);

    // Assert
    expect(measured).toEqual([]);
  });

  it("should return an empty array when every biomarker is UNAVAILABLE", () => {
    // Arrange
    const summary = whoopBiomarkerSummarySchema.parse({
      biomarker_test_id: "t1",
      biomarkers: [{ biomarker_name: "x", status: "UNAVAILABLE" }],
    });

    // Act
    const measured = measuredBiomarkers(summary);

    // Assert
    expect(measured).toEqual([]);
  });
});
