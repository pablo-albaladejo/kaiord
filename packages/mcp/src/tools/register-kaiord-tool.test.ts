import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createRemoteTestClient,
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";
import { loadKrdFixtureRaw } from "../tests/helpers/test-fixtures";
import type * as FileIoModule from "../utils/file-io";

const fileIoSpies = vi.hoisted(() => ({
  readFileAsBuffer: vi.fn(),
  readFileAsText: vi.fn(),
  writeOutputFile: vi.fn(),
}));

vi.mock("../utils/file-io", async (importOriginal) => {
  const actual = await importOriginal<typeof FileIoModule>();
  fileIoSpies.readFileAsBuffer.mockImplementation(actual.readFileAsBuffer);
  fileIoSpies.readFileAsText.mockImplementation(actual.readFileAsText);
  fileIoSpies.writeOutputFile.mockImplementation(actual.writeOutputFile);
  return { ...actual, ...fileIoSpies };
});

const KRD = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

const callRemote = async (
  name: string,
  args: Record<string, unknown>
): Promise<McpToolResult> => {
  const client = await createRemoteTestClient();
  return (await client.callTool({ name, arguments: args })) as McpToolResult;
};

const expectNoFileAccess = (): void => {
  for (const spy of Object.values(fileIoSpies)) {
    expect(spy).not.toHaveBeenCalled();
  }
};

describe("remote path parameters", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should reject input_file without reading any file", async () => {
    // Arrange
    const args = { input_file: "/etc/passwd", output_format: "krd" };

    // Act
    const result = await callRemote("kaiord_convert", args);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("input_file");
    expectNoFileAccess();
  });

  it("should reject output_file even next to valid inline content", async () => {
    // Arrange
    const args = {
      input_content: KRD,
      input_format: "krd",
      output_format: "tcx",
      output_file: "/tmp/out.tcx",
    };

    // Act
    const result = await callRemote("kaiord_convert", args);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("output_file");
    expect(result.content[0].text).not.toContain("TrainingCenterDatabase");
    expectNoFileAccess();
  });

  it.each([
    [
      "kaiord_diff",
      { file1: "/a.krd", content2: KRD, format2: "krd" },
      "file1",
    ],
    [
      "kaiord_diff",
      { content1: KRD, format1: "krd", file2: "/b.krd" },
      "file2",
    ],
    ["kaiord_inspect", { input_file: "/a.fit" }, "input_file"],
    ["kaiord_validate", { input_file: "/a.krd" }, "input_file"],
    ["kaiord_extract_workout", { input_file: "/a.fit" }, "input_file"],
    ["kaiord_round_trip_validate", { input_file: "/a.fit" }, "input_file"],
  ])("should reject a path on %s naming %s", async (name, args, param) => {
    // Arrange
    const call = { name, args };

    // Act
    const result = await callRemote(call.name, call.args);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(param);
    expectNoFileAccess();
  });

  it("should still accept input_file on the local server", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_validate",
      arguments: { input_file: "/nonexistent/file.krd" },
    })) as McpToolResult;

    // Assert
    expect(fileIoSpies.readFileAsText).toHaveBeenCalledWith(
      "/nonexistent/file.krd"
    );
    expect(result.content[0].text).toContain("File not found");
  });
});
