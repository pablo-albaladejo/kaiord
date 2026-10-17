import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";

import type { GenerateProgress } from "../agents/progress";
import { jsonStream } from "../test-utils/mock-language-model";
import { createTextToWorkout } from "./text-to-workout";

const step = (stepIndex: number) =>
  JSON.stringify({
    stepIndex,
    durationType: "time",
    duration: { type: "time", seconds: 600 },
    targetType: "open",
    target: { type: "open" },
    intensity: "active",
  });

describe("createTextToWorkout progress", () => {
  it("should report the workout step count as the output streams", async () => {
    // Arrange
    const model = new MockLanguageModelV4({
      doStream: [
        jsonStream([
          '{"name":"Easy run","sport":"running","steps":[',
          `${step(0)},`,
          step(1),
          "]}",
        ]),
      ],
    });
    const events: GenerateProgress[] = [];

    // Act
    const workout = await createTextToWorkout({ model })("easy run", {
      onProgress: (p) => events.push(p),
    });

    // Assert
    expect(workout.steps).toHaveLength(2);
    const counts = events.filter((e) => e.phase === "generating");
    expect(counts.at(-1)?.items).toBe(2);
    expect(events.at(-1)?.phase).toBe("validating");
  });

  it("should forward the abort signal so a cancelled run never calls the model", async () => {
    // Arrange
    const model = new MockLanguageModelV4({ doStream: [jsonStream(["{}"])] });
    const controller = new AbortController();
    controller.abort();

    // Act
    const run = createTextToWorkout({ model })("easy run", {
      signal: controller.signal,
      onProgress: () => {},
    });

    // Assert
    await expect(run).rejects.toMatchObject({ name: "AbortError" });
    expect(model.doStreamCalls).toHaveLength(0);
  });
});
