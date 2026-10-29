import { describe, expect, it } from "vitest";

import {
  createRemoteTestClient,
  createTestClient,
  type McpToolResult,
  REMOTE_TEST_OPTIONS,
} from "../tests/helpers/mcp-test-client";
import { PATH_PARAMS } from "../tools/register-kaiord-tool";

const REMOTE_TOOLS = [
  "kaiord_convert",
  "kaiord_diff",
  "kaiord_extract_workout",
  "kaiord_get_format_spec",
  "kaiord_inspect",
  "kaiord_list_formats",
  "kaiord_round_trip_validate",
  "kaiord_validate",
];
const REMOTE_RESOURCES = ["krd-format-spec", "krd-schema", "supported-formats"];
const LOCAL_TOOL_COUNT = 17;
const LOCAL_PROMPT_COUNT = 2;
const EXCLUDED_WORDS = ["garmin", "health"];

describe("createServer remote toolset", () => {
  it("should list exactly the eight remote tools", async () => {
    // Arrange
    const client = await createRemoteTestClient();

    // Act
    const { tools } = await client.listTools();

    // Assert
    expect(tools.map((t) => t.name).sort()).toEqual(REMOTE_TOOLS);
  });

  it("should advertise no file-path parameter in any remote schema", async () => {
    // Arrange
    const client = await createRemoteTestClient();

    // Act
    const { tools } = await client.listTools();
    const keys = tools.flatMap((t) =>
      Object.keys(t.inputSchema.properties ?? {})
    );

    // Assert
    for (const param of PATH_PARAMS) expect(keys).not.toContain(param);
    expect(keys).toEqual(expect.arrayContaining(["input_content", "content1"]));
  });

  it("should list no prompt and exactly the three remote resources", async () => {
    // Arrange
    const client = await createRemoteTestClient();

    // Act
    const capabilities = client.getServerCapabilities();
    const { resources } = await client.listResources();

    // Assert
    expect(capabilities?.prompts).toBeUndefined();
    expect(resources.map((r) => r.name).sort()).toEqual(REMOTE_RESOURCES);
  });

  it("should name only remote tools in the remote instructions", async () => {
    // Arrange
    const client = await createRemoteTestClient();

    // Act
    const instructions = client.getInstructions() ?? "";
    const named = instructions.match(/kaiord_[a-z_]+/g) ?? [];

    // Assert
    for (const word of EXCLUDED_WORDS) {
      expect(instructions.toLowerCase()).not.toContain(word);
    }
    for (const name of named) expect(REMOTE_TOOLS).toContain(name);
  });

  it.each(["kaiord_garmin_push", "kaiord_get_health_summary"])(
    "should fail %s as an unknown tool remotely",
    async (name) => {
      // Arrange
      const client = await createRemoteTestClient();

      // Act
      const result = (await client.callTool({
        name,
        arguments: {},
      })) as McpToolResult;

      // Assert
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("not found");
    }
  );

  it("should serve the injected format spec from the tool and both resources", async () => {
    // Arrange
    const client = await createRemoteTestClient();

    // Act
    const tool = (await client.callTool({
      name: "kaiord_get_format_spec",
      arguments: {},
    })) as McpToolResult;
    const spec = await client.readResource({ uri: "kaiord://docs/krd-format" });
    const schema = await client.readResource({ uri: "kaiord://schema/krd" });

    // Assert
    expect(tool.content[0].text).toBe(REMOTE_TEST_OPTIONS.formatSpec);
    expect(spec.contents[0].text).toBe(REMOTE_TEST_OPTIONS.formatSpec);
    expect(schema.contents[0].text).toBe(REMOTE_TEST_OPTIONS.krdSchema);
  });

  it("should report the injected version", async () => {
    // Arrange
    const client = await createRemoteTestClient();

    // Act
    const info = client.getServerVersion();

    // Assert
    expect(info?.version).toBe(REMOTE_TEST_OPTIONS.version);
  });
});

describe("createServer default toolset", () => {
  it("should keep the full local surface when called without options", async () => {
    // Arrange
    const client = await createTestClient();

    // Act
    const { tools } = await client.listTools();
    const { prompts } = await client.listPrompts();
    const info = client.getServerVersion();

    // Assert
    expect(tools).toHaveLength(LOCAL_TOOL_COUNT);
    expect(prompts).toHaveLength(LOCAL_PROMPT_COUNT);
    expect(info?.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(client.getInstructions()).toContain("kaiord_garmin_login");
  });
});
