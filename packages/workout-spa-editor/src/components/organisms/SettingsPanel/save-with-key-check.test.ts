import { describe, expect, it, vi } from "vitest";

import { saveWithKeyCheck } from "./save-with-key-check";

const credential = { type: "anthropic" as const, apiKey: "sk-test" };

describe("saveWithKeyCheck", () => {
  it("should not save a key the provider rejects", async () => {
    // Arrange
    const save = vi.fn(async () => undefined);
    const verify = vi.fn(async () => "invalid" as const);

    // Act
    const outcome = await saveWithKeyCheck({ credential, save, verify });

    // Assert
    expect(outcome).toBe("invalid");
    expect(verify).toHaveBeenCalledWith(credential);
    expect(save).not.toHaveBeenCalled();
  });

  it("should save a valid key", async () => {
    // Arrange
    const save = vi.fn(async () => undefined);
    const verify = vi.fn(async () => "valid" as const);

    // Act
    const outcome = await saveWithKeyCheck({ credential, save, verify });

    // Assert
    expect(outcome).toBe("saved");
    expect(save).toHaveBeenCalledOnce();
  });

  it("should save a key that could not be checked and say so", async () => {
    // Arrange
    const save = vi.fn(async () => undefined);
    const verify = vi.fn(async () => "unverified" as const);

    // Act
    const outcome = await saveWithKeyCheck({ credential, save, verify });

    // Assert
    expect(outcome).toBe("unverified");
    expect(save).toHaveBeenCalledOnce();
  });

  it("should skip the check when the save leaves the key alone", async () => {
    // Arrange
    const save = vi.fn(async () => undefined);
    const verify = vi.fn(async () => "invalid" as const);

    // Act
    const outcome = await saveWithKeyCheck({ save, verify });

    // Assert
    expect(outcome).toBe("saved");
    expect(verify).not.toHaveBeenCalled();
  });

  it("should report a failed write", async () => {
    // Arrange
    const save = vi.fn(async () => {
      throw new Error("idb");
    });
    const verify = vi.fn(async () => "valid" as const);

    // Act
    const outcome = await saveWithKeyCheck({ credential, save, verify });

    // Assert
    expect(outcome).toBe("failed");
  });
});
