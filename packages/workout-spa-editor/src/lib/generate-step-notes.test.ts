import { beforeEach, describe, expect, it, vi } from "vitest";

const runGenerateAgent = vi.fn();

// The agent and its message stay real; only the model run is stubbed.
vi.mock("@kaiord/ai/agents", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  runGenerateAgent: (...args: unknown[]) => runGenerateAgent(...args),
}));

vi.mock("@kaiord/ai/providers", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createLanguageModel: vi.fn().mockResolvedValue({ modelId: "test-model" }),
}));

import { createInMemoryTraceRepository } from "../test-utils/in-memory-trace-repository";
import { generateStepNotes } from "./generate-step-notes";

const traces = createInMemoryTraceRepository();
const options = () => ({
  deps: {
    persistence: { traces } as never,
    usage: { emit: vi.fn() },
  },
  input: { coachText: "Tres series a una pierna", steps: ["30 s R1"] },
  provider: { id: "a", type: "anthropic", apiKey: "k" } as never,
  modelId: "claude",
});

describe("generateStepNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runGenerateAgent.mockResolvedValue({
      output: [{ step: 1, text: "A una pierna", origin: "coach" }],
    });
  });

  it("should send only the coach's text and the step lines, and record the coaching plan in its Trace", async () => {
    // Arrange

    // Act
    const notes = await generateStepNotes(options());

    // Assert
    const [, input] = runGenerateAgent.mock.calls[0] ?? [];
    expect(input).toStrictEqual({
      text: "<coach_description>\nTres series a una pierna\n</coach_description>\n\n<steps>\n1. 30 s R1\n</steps>",
    });
    expect(notes).toStrictEqual([
      { step: 1, text: "A una pierna", origin: "coach" },
    ]);
    const [trace] = await traces.list();
    expect(trace?.sent).toStrictEqual([
      { to: "anthropic", kinds: ["coachingPlan"] },
    ]);
  });
});
