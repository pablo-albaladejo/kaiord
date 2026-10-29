import type * as FsModule from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";

const { fsSpies, spyOnFs } = vi.hoisted(() => {
  const spies = { readFileSync: vi.fn(), existsSync: vi.fn() };
  const factory = async (
    importOriginal: () => Promise<typeof FsModule>
  ): Promise<typeof FsModule> => {
    const actual = await importOriginal();
    spies.readFileSync.mockImplementation(actual.readFileSync);
    spies.existsSync.mockImplementation(actual.existsSync);
    return { ...actual, ...spies, default: { ...actual, ...spies } };
  };
  return { fsSpies: spies, spyOnFs: factory };
});

vi.mock("fs", spyOnFs);
vi.mock("node:fs", spyOnFs);

describe("create-server module import", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should read no file when the server module is imported", async () => {
    // Arrange
    vi.resetModules();

    // Act
    await import("./create-server");

    // Assert
    expect(fsSpies.readFileSync).not.toHaveBeenCalled();
    expect(fsSpies.existsSync).not.toHaveBeenCalled();
  });

  it("should read no file when every input is injected", async () => {
    // Arrange
    const { createServer } = await import("./create-server");
    vi.clearAllMocks();

    // Act
    createServer({
      toolset: "remote",
      version: "0.0.0-test",
      formatSpec: "spec",
      krdSchema: "{}",
    });

    // Assert
    expect(fsSpies.readFileSync).not.toHaveBeenCalled();
    expect(fsSpies.existsSync).not.toHaveBeenCalled();
  });

  it("should still read the local inputs from disk when none is injected", async () => {
    // Arrange
    const { createServer } = await import("./create-server");
    vi.clearAllMocks();

    // Act
    createServer();

    // Assert
    expect(fsSpies.readFileSync).toHaveBeenCalled();
  });
});
