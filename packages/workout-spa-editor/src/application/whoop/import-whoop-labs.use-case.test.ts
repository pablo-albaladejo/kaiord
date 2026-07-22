import type { LabReport, LabValue } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import { createInMemoryLabRepository } from "../../test-utils/in-memory-lab-repository";
import type { LabPersistence } from "../lab/lab-persistence";
import {
  importWhoopLabs,
  type ImportWhoopLabsDeps,
} from "./import-whoop-labs.use-case";
import type { WhoopFetchResult } from "./whoop-fetch-result";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const TESTS_PATH = "/advanced-labs-service/v1/biomarker-tests";
const TEST_1 = "test-1";
const TEST_2 = "test-2";

const TESTS_LIST = [
  {
    id: TEST_1,
    display_name: "Blood Panel",
    test_date: "2026-07-10",
    upload_source: "LabCorp",
    status: "COMPLETE",
  },
  {
    id: TEST_2,
    display_name: "Empty Panel",
    test_date: "2026-06-01",
    upload_source: "LabCorp",
    status: "COMPLETE",
  },
];

const SUMMARY_1 = {
  biomarker_test_id: TEST_1,
  test_display_name: "Blood Panel",
  test_date: "2026-07-10",
  biomarkers: [
    {
      biomarker_name: "alt",
      biomarker_display_name: "ALT",
      value: 38,
      units: "U/L",
      status: "SUFFICIENT",
      optimal_range: { lower_endpoint: 10, upper_endpoint: 40 },
    },
    {
      biomarker_name: "custom_thing",
      biomarker_display_name: "Custom Thing",
      value: 5,
      units: "ng/mL",
      status: "OPTIMAL",
    },
    {
      biomarker_name: "vitamin_d",
      biomarker_display_name: "Vitamin D",
      value: null,
      units: null,
      status: "UNAVAILABLE",
    },
  ],
};

const SUMMARY_2 = {
  biomarker_test_id: TEST_2,
  test_display_name: "Empty Panel",
  test_date: "2026-06-01",
  biomarkers: [
    {
      biomarker_name: "vitamin_d",
      biomarker_display_name: "Vitamin D",
      value: null,
      units: null,
      status: "UNAVAILABLE",
    },
  ],
};

const summaryPath = (testId: string): string =>
  `${TESTS_PATH}/${testId}/summary`;

const makeFetchLabs = () =>
  vi.fn(async (path: string): Promise<WhoopFetchResult> => {
    if (path === TESTS_PATH) return { ok: true, status: 200, data: TESTS_LIST };
    if (path === summaryPath(TEST_1)) {
      return { ok: true, status: 200, data: SUMMARY_1 };
    }
    if (path === summaryPath(TEST_2)) {
      return { ok: true, status: 200, data: SUMMARY_2 };
    }
    throw new Error(`unexpected path: ${path}`);
  });

const makeDeps = (
  fetchLabs: ImportWhoopLabsDeps["fetchLabs"] = makeFetchLabs()
): {
  deps: ImportWhoopLabsDeps;
  reports: Map<string, LabReport>;
  values: Map<string, LabValue>;
} => {
  const reports = new Map<string, LabReport>();
  const values = new Map<string, LabValue>();
  const persistence: LabPersistence = {
    labs: createInMemoryLabRepository(reports, values),
    transaction: async (fn) => fn(),
  };
  let seq = 0;
  const deps: ImportWhoopLabsDeps = {
    persistence,
    fetchLabs,
    profileId: PROFILE_ID,
    newId: () => `id-${++seq}`,
  };
  return { deps, reports, values };
};

describe("importWhoopLabs", () => {
  it("should import a test's measured biomarkers as one report with its values", async () => {
    // Arrange
    const { deps, reports, values } = makeDeps();

    // Act
    const result = await importWhoopLabs(deps);

    // Assert
    expect(result).toEqual({ ok: true, imported: 1, skipped: 1 });
    expect(reports.size).toBe(1);
    const report = [...reports.values()][0];
    expect(report.date).toBe("2026-07-10");
    expect(report.labName).toBe("LabCorp");
    const savedValues = [...values.values()];
    expect(savedValues.map((v) => v.parameterKey).sort()).toEqual([
      "alt",
      "custom:custom_thing",
    ]);
  });

  it("should filter out biomarkers WHOOP marked UNAVAILABLE", async () => {
    // Arrange
    const { deps, values } = makeDeps();

    // Act
    await importWhoopLabs(deps);

    // Assert
    const keys = [...values.values()].map((v) => v.parameterKey);
    expect(keys).not.toContain("vitamin_d");
    expect(keys).not.toContain("custom:vitamin_d");
  });

  it("should resolve an unmapped slug to a custom parameter key", async () => {
    // Arrange
    const { deps, values } = makeDeps();

    // Act
    await importWhoopLabs(deps);

    // Assert
    const custom = [...values.values()].find(
      (v) => v.parameterKey === "custom:custom_thing"
    );
    expect(custom).toBeDefined();
  });

  it("should stamp source whoop plus sourceBridgeId and externalId on the report and its values", async () => {
    // Arrange
    const { deps, reports, values } = makeDeps();

    // Act
    await importWhoopLabs(deps);

    // Assert
    const report = [...reports.values()][0];
    expect(report.provenance).toEqual({
      source: "whoop",
      sourceBridgeId: "whoop-bridge",
      externalId: TEST_1,
    });
    const altValue = [...values.values()].find((v) => v.parameterKey === "alt");
    expect(altValue?.provenance).toEqual({
      source: "whoop",
      sourceBridgeId: "whoop-bridge",
      externalId: `${TEST_1}:alt`,
    });
  });

  it("should skip a test whose measured biomarkers yield no usable rows", async () => {
    // Arrange
    const { deps, reports } = makeDeps();

    // Act
    await importWhoopLabs(deps);

    // Assert
    expect(reports.size).toBe(1);
    expect(
      [...reports.values()].some((r) => r.provenance.externalId === TEST_2)
    ).toBe(false);
  });

  it("should dedupe on re-import by skipping a test whose report already exists", async () => {
    // Arrange
    const { deps, reports, values } = makeDeps();
    await importWhoopLabs(deps);

    // Act
    const result = await importWhoopLabs(deps);

    // Assert
    expect(result).toEqual({ ok: true, imported: 0, skipped: 2 });
    expect(reports.size).toBe(1);
    expect(values.size).toBe(2);
  });

  it("should return a transport error when the tests list read throws", async () => {
    // Arrange
    const fetchLabs = vi
      .fn()
      .mockRejectedValue(new Error("Extension did not respond"));
    const { deps } = makeDeps(fetchLabs);

    // Act
    const result = await importWhoopLabs(deps);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Extension did not respond",
    });
  });

  it("should return a transport error when a test summary read reports failure", async () => {
    // Arrange
    const fetchLabs = vi.fn(async (path: string): Promise<WhoopFetchResult> => {
      if (path === TESTS_PATH)
        return { ok: true, status: 200, data: TESTS_LIST };
      return { ok: false, status: 401, error: "Unauthorized" };
    });
    const { deps } = makeDeps(fetchLabs);

    // Act
    const result = await importWhoopLabs(deps);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Unauthorized",
    });
  });

  it("should return a transport error when the tests list fails schema validation", async () => {
    // Arrange
    const fetchLabs = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      data: { unexpected: "shape" },
    });
    const { deps } = makeDeps(fetchLabs);

    // Act
    const result = await importWhoopLabs(deps);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Malformed WHOOP biomarker tests list",
    });
  });
});
