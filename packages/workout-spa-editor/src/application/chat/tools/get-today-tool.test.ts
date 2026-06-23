import { describe, expect, it } from "vitest";

import { createGetTodayTool } from "./get-today-tool";

describe("createGetTodayTool", () => {
  it("should resolve today into its date and ISO week range", async () => {
    // Arrange
    const tool = createGetTodayTool({ today: "2026-06-13" });

    // Act
    const result = (await tool.execute({})) as {
      today: string;
      weekId: string;
      weekStart: string | null;
      weekEnd: string | null;
    };

    // Assert
    expect(result.today).toBe("2026-06-13");
    expect(result.weekId).toMatch(/^2026-W\d{2}$/);
    expect(result.weekStart).not.toBeNull();
    expect(result.weekEnd).not.toBeNull();
  });

  it("should be a read tool that does not require confirmation", () => {
    // Arrange

    // Act
    const tool = createGetTodayTool({ today: "2026-06-13" });

    // Assert
    expect(tool.requiresConfirmation).toBe(false);
  });
});
