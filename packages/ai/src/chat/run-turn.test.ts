import { describe, it, expect, vi, beforeEach } from "vitest";
import { runTurn } from "./run-turn";

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return { ...actual, streamText: vi.fn() };
});
const mockStreamText = vi.mocked((await import("ai")).streamText);

const fakeStream = (deltas: string[]) => ({
  textStream: (async function* () {
    for (const d of deltas) yield d;
  })(),
  text: Promise.resolve(deltas.join("")),
  toolCalls: Promise.resolve([
    { toolName: "query_workouts", toolCallId: "r1", input: { days: 20 } },
  ]),
  finishReason: Promise.resolve("stop"),
  usage: Promise.resolve({ inputTokens: 12, outputTokens: 8 }),
  response: Promise.resolve({
    messages: [{ role: "assistant", content: "done" }],
  }),
});

const model = { modelId: "test-model" } as never;

describe("runTurn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should forward each streamed delta to onTextDelta", async () => {
    // Arrange
    mockStreamText.mockReturnValueOnce(
      fakeStream(["lo", "ng", "est"]) as never
    );
    const deltas: string[] = [];

    // Act
    await runTurn({
      model,
      messages: [{ role: "user", content: "hi" }],
      tools: {},
      maxSteps: 8,
      onTextDelta: (d) => deltas.push(d),
    });

    // Assert
    expect(deltas).toEqual(["lo", "ng", "est"]);
  });

  it("should normalize usage from SDK input/output token fields", async () => {
    // Arrange
    mockStreamText.mockReturnValueOnce(fakeStream(["x"]) as never);

    // Act
    const result = await runTurn({
      model,
      messages: [{ role: "user", content: "hi" }],
      tools: {},
      maxSteps: 8,
    });

    // Assert
    expect(result.usage).toEqual({ promptTokens: 12, completionTokens: 8 });
    expect(result.toolCalls[0]).toMatchObject({ toolName: "query_workouts" });
  });
});
