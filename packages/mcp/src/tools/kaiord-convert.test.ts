import { createMockLogger } from "@kaiord/core/test-utils";
import { createFitReader } from "@kaiord/fit";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createRemoteTestClient,
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { loadKrdFixtureRaw } from "../tests/helpers/test-fixtures";
import { decodeBase64 } from "../utils/base64";

const FTP_W = 250;
// 85 % of 250 W = 213 W; Garmin gets a single value as its ±5 % band.
const SWEET_SPOT_BAND_HIGH_W = 224;
const SWEET_SPOT_BAND_LOW_W = 202;
const RAMP_LOW_W = 125;
const RAMP_HIGH_W = 188;
// KRD input, not ZWO: ZWO input is XSD-validated by spawning a JVM per
// call (xsd-schema-validator), which alone can exceed the 5 s test budget
// on a cold CI runner. These tests cover the `ftp` parameter, not parsing.
const PERCENT_FTP_KRD = JSON.stringify({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-01-01T00:00:00.000Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "ftp test",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "power",
          target: { type: "power", value: { unit: "percent_ftp", value: 85 } },
        },
        {
          stepIndex: 1,
          durationType: "time",
          duration: { type: "time", seconds: 300 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "range", min: 50, max: 75, basis: "percent_ftp" },
          },
        },
      ],
    },
  },
});

type GcnStep = { targetValueOne: number; targetValueTwo: number };

describe("kaiord_convert", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "mcp-convert-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("should convert KRD content to TCX", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: krdJson,
        input_format: "krd",
        output_format: "tcx",
      },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("TrainingCenterDatabase");
  });

  it("should convert KRD file to TCX", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const filePath = join(tmpDir, "input.krd");
    await writeFile(filePath, krdJson);

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: { input_file: filePath, output_format: "tcx" },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("TrainingCenterDatabase");
  });

  it("should return error when both inputs provided", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_file: "/some/file.krd",
        input_content: "{}",
        input_format: "krd",
        output_format: "tcx",
      },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBe(true);
  });

  it("should write FIT output to file", async () => {
    // Arrange
    const client = await createTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const outPath = join(tmpDir, "output.fit");

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: krdJson,
        input_format: "krd",
        output_format: "fit",
        output_file: outPath,
      },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain("Written to:");
  });

  it("should return FIT as base64 text that decodes back to the same KRD", async () => {
    // Arrange
    const client = await createRemoteTestClient();
    const krdJson = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
    const reader = createFitReader(createMockLogger());

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: krdJson,
        input_format: "krd",
        output_format: "fit",
      },
    })) as McpToolResult;
    const [header, encoded] = result.content[0].text.split("\n");
    const decoded = await reader(decodeBase64(encoded));

    // Assert
    expect(result.isError).toBeUndefined();
    expect(header).toContain("base64");
    expect(decoded.extensions?.structured_workout).toEqual(
      JSON.parse(krdJson).extensions.structured_workout
    );
  });

  it("should resolve %FTP power targets to watts for GCN output with ftp", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: PERCENT_FTP_KRD,
        input_format: "krd",
        output_format: "gcn",
        ftp: FTP_W,
      },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const gcn = JSON.parse(result.content[0].text) as {
      workoutSegments: [{ workoutSteps: [GcnStep, GcnStep] }];
    };
    const [step, ramp] = gcn.workoutSegments[0].workoutSteps;
    expect(step.targetValueOne).toBe(SWEET_SPOT_BAND_HIGH_W);
    expect(step.targetValueTwo).toBe(SWEET_SPOT_BAND_LOW_W);
    expect(ramp.targetValueOne).toBe(RAMP_HIGH_W);
    expect(ramp.targetValueTwo).toBe(RAMP_LOW_W);
  });

  it("should return a missing-ftp error for %FTP GCN output without ftp", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: PERCENT_FTP_KRD,
        input_format: "krd",
        output_format: "gcn",
      },
    })) as McpToolResult & {
      structuredContent?: { error: { type: string } };
    };

    // Assert
    expect(result.isError).toBe(true);
    expect(result.structuredContent?.error.type).toBe("missing-ftp");
  });
});
