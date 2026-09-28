import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { loadKrdFixtureRaw } from "../tests/helpers/test-fixtures";

const FTP_W = 250;
const SWEET_SPOT_W = 213;
const PERCENT_FTP_ZWO = `<workout_file><name>ftp test</name><sportType>bike</sportType><workout>
<SteadyState Duration="600" Power="0.85"/>
</workout></workout_file>`;

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

  it("should resolve %FTP power targets to watts for GCN output with ftp", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: PERCENT_FTP_ZWO,
        input_format: "zwo",
        output_format: "gcn",
        ftp: FTP_W,
      },
    })) as McpToolResult;

    // Assert
    expect(result.isError).toBeUndefined();
    const gcn = JSON.parse(result.content[0].text) as {
      workoutSegments: [{ workoutSteps: [GcnStep] }];
    };
    const step = gcn.workoutSegments[0].workoutSteps[0];
    expect(step.targetValueOne).toBe(SWEET_SPOT_W);
    expect(step.targetValueTwo).toBe(SWEET_SPOT_W);
  });

  it("should return a missing-ftp error for %FTP GCN output without ftp", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_convert",
      arguments: {
        input_content: PERCENT_FTP_ZWO,
        input_format: "zwo",
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
