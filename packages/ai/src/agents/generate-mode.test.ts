import { describe, it, expect } from "vitest";
import { z } from "zod";
import { definePrompt } from "../prompts/registry";
import { runGenerateAgent } from "./runtime";
import { AiAgentError } from "./errors";
import type { AgentDefinition } from "./definition-types";
import {
  jsonResult,
  mockModelReturning,
} from "../test-utils/mock-language-model";
import {
  HTTP_STATUS_SERVICE_OVERLOADED,
  HTTP_STATUS_UNAUTHORIZED,
} from "../test-utils/constants";
import { MockLanguageModelV4 } from "ai/test";
import { APICallError } from "ai";

const apiError = (statusCode: number, isRetryable: boolean) =>
  new APICallError({
    message: "transport",
    url: "https://api.example.com/v1",
    requestBodyValues: {},
    statusCode,
    isRetryable,
  });

definePrompt({
  id: "test/echo",
  version: "9.9.9",
  template: "SYSTEM MARKER {{topic}}",
  variables: ["topic"],
});

const VALID_N = 42;
const DOC_BYTES = new TextEncoder().encode("doc");

const TEST_AGENT: AgentDefinition<{ n: number }> = {
  id: "test-agent",
  version: "1.0.0",
  purpose: "default",
  systemPrompt: { id: "test/echo", vars: { topic: "labs" } },
  mode: "generate",
  outputSchema: z.object({
    n: z.number().optional(),
    ok: z.boolean().optional(),
  }),
  validate: (raw) => z.object({ n: z.number() }).parse(raw),
};

const promptText = (model: MockLanguageModelV4): string =>
  JSON.stringify(model.doGenerateCalls[0]?.prompt);

describe("runGenerateAgent generate mode", () => {
  it("should assemble the system prompt from the registry", async () => {
    // Arrange
    const model = mockModelReturning({ n: 1 });

    // Act
    await runGenerateAgent(TEST_AGENT, { text: "hi" }, { model });

    // Assert
    expect(promptText(model)).toContain("SYSTEM MARKER labs");
  });

  it("should forward document file parts to the model", async () => {
    // Arrange
    const model = mockModelReturning({ n: 1 });
    const data = DOC_BYTES;

    // Act
    await runGenerateAgent(
      TEST_AGENT,
      { files: [{ data, mediaType: "application/pdf" }] },
      { model }
    );

    // Assert
    const call = JSON.stringify(model.doGenerateCalls[0]?.prompt);
    expect(call).toContain("application/pdf");
  });

  it("should retry with feedback then succeed", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doGenerate: [jsonResult({ ok: false }), jsonResult({ n: VALID_N })],
    });

    // Act
    const result = await runGenerateAgent(
      TEST_AGENT,
      { text: "go" },
      { model }
    );

    // Assert
    expect(result.output.n).toBe(VALID_N);
    expect(JSON.stringify(model.doGenerateCalls[1]?.prompt)).toContain(
      "Previous attempt failed"
    );
  });

  it("should throw AiAgentError after exhausting retries", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doGenerate: [jsonResult({ ok: false }), jsonResult({ ok: false })],
    });
    const agent = { ...TEST_AGENT, maxRetries: 1 };

    // Act
    const run = runGenerateAgent(agent, { text: "x" }, { model });

    // Assert
    await expect(run).rejects.toBeInstanceOf(AiAgentError);
  });

  it("should map provider usage onto the result", async () => {
    // Arrange
    const model = mockModelReturning({ n: 7 });

    // Act
    const result = await runGenerateAgent(TEST_AGENT, { text: "u" }, { model });

    // Assert
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5 });
  });

  it("should rethrow a non-retryable transport error without retrying", async () => {
    // Arrange
    const error = apiError(HTTP_STATUS_UNAUTHORIZED, false);
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doGenerate: async () => {
        throw error;
      },
    });

    // Act
    const run = runGenerateAgent(TEST_AGENT, { text: "x" }, { model });

    // Assert
    await expect(run).rejects.toBe(error);
    expect(model.doGenerateCalls).toHaveLength(1);
  });

  it("should retry a retryable transport error until the budget is spent", async () => {
    // Arrange
    const overloaded = apiError(HTTP_STATUS_SERVICE_OVERLOADED, true);
    const model = new MockLanguageModelV4({
      modelId: "m",
      provider: "p",
      doGenerate: async () => {
        throw overloaded;
      },
    });
    const agent = { ...TEST_AGENT, maxRetries: 1 };

    // Act
    const run = runGenerateAgent(agent, { text: "x" }, { model });

    // Assert
    await expect(run).rejects.toThrow();
    expect(model.doGenerateCalls.length).toBeGreaterThan(1);
  });

  it("should abort without calling the model when the signal is aborted", async () => {
    // Arrange
    const model = mockModelReturning({ n: 1 });
    const controller = new AbortController();
    controller.abort();

    // Act
    const run = runGenerateAgent(
      TEST_AGENT,
      { text: "x" },
      { model, signal: controller.signal }
    );

    // Assert
    await expect(run).rejects.toThrow();
    expect(model.doGenerateCalls).toHaveLength(0);
  });
});
