import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasClipboardContent,
  readClipboard,
  writeClipboard,
} from "./clipboard-store";

afterEach(() => {
  // Each test that installs a fake navigator.clipboard restores it here so the
  // store falls back to its in-memory path for the next test, matching the
  // default jsdom environment where navigator.clipboard is undefined.
  vi.unstubAllGlobals();
});

describe("hasClipboardContent", () => {
  it("should report empty clipboard before anything is copied", () => {
    // Arrange

    // Act

    // Assert
    expect(hasClipboardContent()).toBe(false);
  });

  it("should report available content after a value is copied", async () => {
    // Arrange

    // Act
    await writeClipboard("test-data");

    // Assert
    expect(hasClipboardContent()).toBe(true);
  });
});

describe("writeClipboard", () => {
  it("should keep the most recently copied value when copying twice", async () => {
    // Arrange
    await writeClipboard("first-copy");

    // Act
    await writeClipboard("second-copy");
    const readBack = await readClipboard();

    // Assert
    expect(readBack).toBe("second-copy");
  });
});

describe("readClipboard", () => {
  it("should return the same step payload that was copied", async () => {
    // Arrange
    const stepPayload = JSON.stringify(
      {
        id: "step-1",
        type: "step",
        stepIndex: 0,
        intensity: "active",
        duration: { type: "time", value: 300 },
        target: { type: "power", value: 200 },
      },
      null,
      2
    );

    // Act
    await writeClipboard(stepPayload);
    const readBack = await readClipboard();

    // Assert
    expect(readBack).toBe(stepPayload);
    expect(JSON.parse(readBack)).toStrictEqual(JSON.parse(stepPayload));
  });

  it("should return the same repetition block payload that was copied", async () => {
    // Arrange
    const blockPayload = JSON.stringify(
      {
        id: "block-1",
        type: "repetition",
        repetitions: 3,
        steps: [
          { id: "s-1", type: "step", stepIndex: 0 },
          { id: "s-2", type: "step", stepIndex: 1 },
        ],
      },
      null,
      2
    );

    // Act
    await writeClipboard(blockPayload);
    const readBack = await readClipboard();

    // Assert
    expect(JSON.parse(readBack)).toStrictEqual(JSON.parse(blockPayload));
  });
});

describe("clipboard failure handling", () => {
  it("should preserve the copied value when the native clipboard write rejects", async () => {
    // Arrange
    const rejectingClipboard = {
      writeText: vi.fn().mockRejectedValue(new Error("permission denied")),
      readText: vi.fn().mockRejectedValue(new Error("permission denied")),
    };
    vi.stubGlobal("navigator", { clipboard: rejectingClipboard });

    // Act
    await writeClipboard("payload-during-failure");
    const readBack = await readClipboard();

    // Assert
    expect(rejectingClipboard.writeText).toHaveBeenCalledWith(
      "payload-during-failure"
    );
    expect(readBack).toBe("payload-during-failure");
    expect(hasClipboardContent()).toBe(true);
  });

  it("should fall back to in-memory content when the native clipboard read rejects", async () => {
    // Arrange
    await writeClipboard("memory-fallback-value");
    const rejectingClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockRejectedValue(new Error("read blocked")),
    };
    vi.stubGlobal("navigator", { clipboard: rejectingClipboard });

    // Act
    const readBack = await readClipboard();

    // Assert
    expect(rejectingClipboard.readText).toHaveBeenCalledTimes(1);
    expect(readBack).toBe("memory-fallback-value");
  });
});
