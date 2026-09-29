/**
 * Guard: the hub chat-tool fixtures mirror the real SPA tools, so they must
 * serialise to a provider-acceptable input schema too. Anthropic and OpenAI
 * reject a tool whose top-level JSON Schema is not `type: "object"` (a bare
 * `oneOf` from `z.discriminatedUnion` is refused with 400). The conversion is
 * the SDK's own: the tools go through `buildSdkTools`, then
 * `asSchema(tool.inputSchema).jsonSchema` as `prepareToolsAndToolChoice` does.
 */
import { asSchema } from "ai";
import { describe, expect, it } from "vitest";

import { buildSdkTools } from "../chat/build-sdk-tools";
import { createHubChatToolFixtures } from "./chat-tool-fixtures";

const sdkTools = Object.entries(buildSdkTools(createHubChatToolFixtures()));

describe("hub chat-tool fixtures", () => {
  it.each(sdkTools)(
    "should serialise %s to a top-level object schema",
    async (_name, tool) => {
      // Arrange

      // Act
      const jsonSchema = (await asSchema(tool.inputSchema).jsonSchema) as {
        type?: unknown;
        oneOf?: unknown;
        anyOf?: unknown;
        allOf?: unknown;
      };

      // Assert
      expect(jsonSchema.type).toBe("object");
      expect(jsonSchema.oneOf).toBeUndefined();
      expect(jsonSchema.anyOf).toBeUndefined();
      expect(jsonSchema.allOf).toBeUndefined();
    }
  );

  it("should keep set_data_route action-discriminated", async () => {
    // Arrange
    const tool = createHubChatToolFixtures().find(
      (t) => t.name === "set_data_route"
    );

    // Act
    const missingDirection = tool?.inputSchema.safeParse({
      action: "enable_route",
      dataType: "sleep",
      integrationId: "whoop",
    });
    const valid = tool?.inputSchema.safeParse({
      action: "set_source_policy",
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop"],
    });

    // Assert
    expect(missingDirection?.success).toBe(false);
    expect(valid?.success).toBe(true);
  });
});
