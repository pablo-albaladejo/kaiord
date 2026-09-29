/**
 * Guard: every registered chat tool must serialise to a provider-acceptable
 * input schema. Anthropic (`tools.N.custom.input_schema.type: Field
 * required`) and OpenAI function calling both reject a tool whose top-level
 * JSON Schema is not `type: "object"` — e.g. a bare `oneOf` produced by
 * `z.discriminatedUnion`. The engine's unit tests run against a mock model,
 * which accepts any schema, so this defect never surfaced there.
 *
 * The conversion below is the exact one the AI SDK performs before sending
 * tools to the provider (`prepareToolsAndToolChoice` →
 * `await asSchema(tool.inputSchema).jsonSchema`).
 */
import { asSchema } from "ai";
import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { buildChatTools } from "./build-chat-tools";

const tools = buildChatTools({
  persistence: createInMemoryPersistence(),
  profileId: "p1",
  today: "2026-06-13",
  actions: {
    syncCoaching: vi.fn(),
    createWorkout: vi.fn(),
    logHealthMetric: vi.fn(),
    logIntake: vi.fn(),
    pushToGarmin: vi.fn(),
    setDataRoute: vi.fn(),
  },
  getMatrixSignals: vi.fn(),
});

describe("chat tool provider-facing input schemas", () => {
  it("should register at least one tool to guard", () => {
    // Arrange / Act / Assert
    expect(tools.length).toBeGreaterThan(0);
  });

  it.each(tools.map((t) => [t.name, t] as const))(
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
});
