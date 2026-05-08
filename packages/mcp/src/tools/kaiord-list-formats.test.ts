import { describe, expect, it } from "vitest";

import { FORMAT_COUNT_FIVE } from "../test-utils/constants";
import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";

describe("kaiord_list_formats", () => {
  it("should return all five formats", async () => {
    // Arrange
    const client = await createTestClient();
    const result = (await client.callTool({
      name: "kaiord_list_formats",
      arguments: {},
    })) as McpToolResult;
    const formats = JSON.parse(result.content[0].text);
    expect(formats).toHaveLength(FORMAT_COUNT_FIVE);

    // Act
    const names = formats.map((f: { format: string }) => f.format);

    // Assert
    expect(names).toContain("fit");
    expect(names).toContain("tcx");
    expect(names).toContain("zwo");
    expect(names).toContain("gcn");
    expect(names).toContain("krd");
  });

  it("should include format details", async () => {
    // Arrange
    const client = await createTestClient();
    const result = (await client.callTool({
      name: "kaiord_list_formats",
      arguments: {},
    })) as McpToolResult;
    const formats = JSON.parse(result.content[0].text);

    // Act
    const fit = formats.find((f: { format: string }) => f.format === "fit");

    // Assert
    expect(fit).toHaveProperty("name");
    expect(fit).toHaveProperty("extension");
    expect(fit).toHaveProperty("description");
    expect(fit).toHaveProperty("binary");
  });

  it("should mark FIT as binary and text formats as non-binary", async () => {
    // Arrange
    const client = await createTestClient();
    const result = (await client.callTool({
      name: "kaiord_list_formats",
      arguments: {},
    })) as McpToolResult;
    const formats = JSON.parse(result.content[0].text);
    const fit = formats.find((f: { format: string }) => f.format === "fit");

    // Act
    const tcx = formats.find((f: { format: string }) => f.format === "tcx");

    // Assert
    expect(fit.binary).toBe(true);
    expect(tcx.binary).toBe(false);
  });
});
