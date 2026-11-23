import type { ChatTool } from "@kaiord/ai";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createInMemoryTraceRepository } from "../../test-utils/in-memory-trace-repository";
import { HEALTH_WITHHELD } from "../chat/tools/withhold-health";
import { traceReadTools } from "./trace-read-tools";
import { startTraceRun } from "./trace-run";

const tool = (
  name: string,
  requiresConfirmation: boolean,
  execute: ChatTool["execute"]
): ChatTool => ({
  name,
  description: name,
  inputSchema: z.object({}),
  requiresConfirmation,
  execute,
});

describe("traceReadTools", () => {
  it("should record each read Tool call with its result and leave action Tools alone", async () => {
    // Arrange
    const traces = createInMemoryTraceRepository();
    const run = startTraceRun({ feature: "chat", traces });
    const [read, broken, action] = traceReadTools(
      [
        tool("query_health", false, async () => ({ weight: 70 })),
        tool("get_workouts", false, async () => {
          throw new Error("db down");
        }),
        tool("create_workout", true, async () => ({ id: "w" })),
      ],
      run,
      "anthropic"
    );

    // Act
    await read?.execute({});
    await broken?.execute({}).catch(() => undefined);
    await action?.execute({});
    await run.finish();
    const [trace] = await traces.list();

    // Assert
    expect(trace?.tools).toEqual([
      { name: "query_health", confirmation: "not_needed", result: "ok" },
      { name: "get_workouts", confirmation: "not_needed", result: "failed" },
    ]);
  });

  it("should count what each read Tool handed the Provider, and nothing for a withheld one", async () => {
    // Arrange
    const run = startTraceRun({
      feature: "chat",
      traces: createInMemoryTraceRepository(),
    });
    const [sleep, workouts] = traceReadTools(
      [
        tool("query_health", false, async () => ({ records: [] })),
        tool("query_workouts", false, async () => ({ rows: [] })),
      ],
      run,
      "openai"
    );
    const [withheld] = traceReadTools(
      [tool("query_health", false, async () => HEALTH_WITHHELD)],
      run,
      "openai"
    );

    // Act
    await sleep?.execute({ metric: "sleep" });
    await workouts?.execute({});
    await withheld?.execute({ metric: "weight" });

    // Assert
    expect(run.sentSoFar()).toEqual([
      {
        to: "openai",
        kinds: ["sleep", "restingHeartRate", "workouts"],
      },
    ]);
  });
});
