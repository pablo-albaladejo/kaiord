import { describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";

describe("kaiord_get_format_spec", () => {
  it("should be listed in available tools", async () => {
    // Arrange
    const client = await createTestClient();
    const tools = await client.listTools();

    // Act
    const names = tools.tools.map((t) => t.name);

    // Assert
    expect(names).toContain("kaiord_get_format_spec");
  });

  it("should return the KRD format specification", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const result = (await client.callTool({
      name: "kaiord_get_format_spec",
      arguments: {},
    })) as McpToolResult;

    // Assert
    expect(result.content[0].text).toContain("application/vnd.kaiord+json");
    expect(result.content[0].text).toContain("metadata");
    expect(result.content[0].text).toContain("workout");
  });

  it("should expose server instructions mentioning the tool", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const instructions = client.getInstructions();

    // Assert
    expect(instructions).toContain("kaiord_get_format_spec");
    expect(instructions).toContain("KRD");
  });

  it("should list KRD resources for additional reference", async () => {
    // Arrange
    const client = await createTestClient();
    const resources = await client.listResources();

    // Act
    const uris = resources.resources.map((r) => r.uri);

    // Assert
    expect(uris).toContain("kaiord://docs/krd-format");
    expect(uris).toContain("kaiord://schema/krd");
    expect(uris).toContain("kaiord://formats");
  });
});
