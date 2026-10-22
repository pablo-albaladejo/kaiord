import { UnsupportedFunctionalityError } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTextToWorkout } from "../../adapters/text-to-workout";
import { WORKOUT_PARSER_SYSTEM } from "../../prompts/parse-workout-prompt";
import { cliRun } from "../../test-utils/claude-cli-doubles";
import { simpleWorkout } from "../../test-utils/cassette-builder";
import {
  PARITY_GAPS,
  createClaudeCliLanguageModel,
} from "./claude-cli-language-model";
import type { ClaudeRequest } from "./clean-context-args";
import type { V4CallOptions } from "./language-model-types";
import type { CliRun } from "./stream-messages";

const PREFIX = 40;
const OVERHEAD = 670;

const adapter = (run: CliRun = cliRun()) => {
  const requests: Array<ClaudeRequest> = [];
  const model = createClaudeCliLanguageModel({
    modelId: "claude-sonnet-5",
    call: async (request) => {
      requests.push(request);
      return run;
    },
  });
  return { model, requests };
};

const options = (overrides: Partial<V4CallOptions> = {}): V4CallOptions =>
  ({
    prompt: [
      { role: "system", content: "sys" },
      { role: "user", content: [{ type: "text", text: "hello" }] },
    ],
    responseFormat: { type: "json", schema: { type: "object" } },
    ...overrides,
  }) as V4CallOptions;

const unsupportedOf = async (promise: Promise<unknown>) =>
  promise.then(
    () => "resolved",
    (error) =>
      UnsupportedFunctionalityError.isInstance(error)
        ? error.functionality
        : `other: ${error}`
  );

describe("createClaudeCliLanguageModel", () => {
  // The SDK logs every declared warning; these tests assert them instead.
  beforeEach(() => vi.stubGlobal("AI_SDK_LOG_WARNINGS", false));
  afterEach(() => vi.unstubAllGlobals());

  it("should run the real parser runtime unchanged over claude -p", async () => {
    // Arrange
    const workout = simpleWorkout("cycling");
    const { model, requests } = adapter(cliRun({ structuredOutput: workout }));

    // Act
    const parsed = await createTextToWorkout({ model })("30 min easy ride", {
      sport: "cycling" as never,
    });

    // Assert
    expect(parsed.sport).toBe("cycling");
    expect(requests).toHaveLength(1);
    expect(requests[0]?.system).toContain(
      WORKOUT_PARSER_SYSTEM.template.slice(0, PREFIX)
    );
    expect(requests[0]?.prompt).toContain("30 min easy ride");
    expect(requests[0]?.jsonSchema).toMatchObject({ type: "object" });
  });

  it("should declare every parity gap and the CLI provenance on each response", async () => {
    // Arrange
    const { model } = adapter();

    // Act
    const result = await model.doGenerate(options());

    // Assert
    expect(result.warnings).toEqual(PARITY_GAPS);
    expect(result.providerMetadata?.claudeCli).toEqual({
      cliVersion: "2.1.308",
      servedModels: ["claude-sonnet-5"],
      apiEquivalentCostUsd: 0.01,
    });
    expect(result.usage.inputTokens.total).toBe(OVERHEAD);
    expect(result.content).toEqual([{ type: "text", text: '{"ok":true}' }]);
  });

  it("should map max_tokens to a length finish and an absent answer to no content", async () => {
    // Arrange
    const { model } = adapter(
      cliRun({ stopReason: "max_tokens", structuredOutput: undefined })
    );

    // Act
    const result = await model.doGenerate(options());

    // Assert
    expect(result.finishReason).toEqual({
      unified: "length",
      raw: "max_tokens",
    });
    expect(result.content).toEqual([]);
  });

  it("should refuse tool calling, file parts, a schema-less call and streaming", async () => {
    // Arrange
    const { model, requests } = adapter();
    const withTools = options({
      tools: [{ type: "function", name: "x", inputSchema: {} }],
    } as Partial<V4CallOptions>);
    const withFile = options({
      prompt: [
        {
          role: "user",
          content: [
            { type: "file", data: "AA==", mediaType: "application/pdf" },
          ],
        },
      ],
    } as Partial<V4CallOptions>);

    // Act
    const refused = await Promise.all([
      unsupportedOf(model.doGenerate(withTools)),
      unsupportedOf(model.doGenerate(withFile)),
      unsupportedOf(
        model.doGenerate(options({ responseFormat: { type: "text" } }))
      ),
      unsupportedOf(model.doStream(options())),
    ]);

    // Assert
    expect(refused).toEqual([
      "tool calling",
      "file parts",
      "a call without a JSON schema",
      "streaming",
    ]);
    expect(requests).toHaveLength(0);
  });

  it("should refuse a prompt that is not one user message", async () => {
    // Arrange
    const { model } = adapter();
    const twoTurns = options({
      prompt: [
        { role: "user", content: [{ type: "text", text: "a" }] },
        { role: "assistant", content: [{ type: "text", text: "b" }] },
      ],
    } as Partial<V4CallOptions>);

    // Act
    const refused = await unsupportedOf(model.doGenerate(twoTurns));

    // Assert
    expect(refused).toBe("a prompt other than one user message");
  });
});
