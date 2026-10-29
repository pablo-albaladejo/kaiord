import { loadZwoFixture } from "@kaiord/core/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

const CONSOLE_METHODS = ["log", "debug", "info", "warn", "error"] as const;

const spyOnConsole = () =>
  CONSOLE_METHODS.map((method) =>
    vi.spyOn(console, method).mockImplementation(() => undefined)
  );

describe("browser entry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("should log nothing when the entry is imported", async () => {
    // Arrange
    const spies = spyOnConsole();

    // Act
    await import("./browser");

    // Assert
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });

  it("should read and write through the lazy default singletons", async () => {
    // Arrange
    spyOnConsole();
    const { zwiftReader, zwiftWriter } = await import("./browser");
    const xml = loadZwoFixture("WorkoutIndividualSteps.zwo");

    // Act
    const krd = await zwiftReader(xml);
    const written = await zwiftWriter(krd);

    // Assert
    expect(krd.type).toBe("structured_workout");
    expect(written).toContain("<workout_file");
  });
});
