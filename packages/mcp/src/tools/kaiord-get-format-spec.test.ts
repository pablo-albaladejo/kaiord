import { describe, expect, it } from "vitest";

import {
  createTestClient,
  type McpToolResult,
} from "../tests/helpers/mcp-test-client";

describe("kaiord_get_format_spec", () => {
  it("should be listed in available tools", async () => {
    const client = await createTestClient();

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);

    expect(names).toContain("kaiord_get_format_spec");
  });

  it("should return the KRD format specification", async () => {
    const client = await createTestClient();

    const result = (await client.callTool({
      name: "kaiord_get_format_spec",
      arguments: {},
    })) as McpToolResult;

    expect(result.content[0].text).toContain("application/vnd.kaiord+json");
    expect(result.content[0].text).toContain("metadata");
    expect(result.content[0].text).toContain("workout");
  });

  it("should expose server instructions mentioning the tool", async () => {
    const client = await createTestClient();

    const instructions = client.getInstructions();

    expect(instructions).toContain("kaiord_get_format_spec");
    expect(instructions).toContain("KRD");
  });

  it("should list KRD resources for additional reference", async () => {
    const client = await createTestClient();

    const resources = await client.listResources();
    const uris = resources.resources.map((r) => r.uri);

    expect(uris).toContain("kaiord://docs/krd-format");
    expect(uris).toContain("kaiord://schema/krd");
    expect(uris).toContain("kaiord://formats");
  });
});
