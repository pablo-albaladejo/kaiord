import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { createQueryHealthTool } from "./query-health-tool";

const TODAY = "2026-06-13";

describe("createQueryHealthTool", () => {
  it("should route to the store for the requested metric, profile-scoped", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.healthSleep.put({
      id: "s1",
      profileId: "p1",
      date: "2026-06-10",
      krd: { hours: 7 },
    } as never);
    await persistence.healthSleep.put({
      id: "s2",
      profileId: "p2",
      date: "2026-06-10",
      krd: { hours: 8 },
    } as never);
    const tool = createQueryHealthTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Act
    const result = (await tool.execute({ metric: "sleep" })) as {
      metric: string;
      count: number;
    };

    // Assert
    expect(result.metric).toBe("sleep");
    expect(result.count).toBe(1);
  });

  it("should reject an unknown metric via its schema", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const tool = createQueryHealthTool({
      persistence,
      profileId: "p1",
      today: TODAY,
    });

    // Act
    const result = tool.inputSchema.safeParse({ metric: "calories" });

    // Assert
    expect(result.success).toBe(false);
  });
});
