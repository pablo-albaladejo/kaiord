/**
 * Error Recovery Utility Tests
 *
 * Tests for error recovery functionality.
 */

import { describe, expect, it, vi } from "vitest";
import type { KRD } from "../types/krd";
import { withErrorRecovery, withErrorRecoverySync } from "./error-recovery";

describe("withErrorRecovery", () => {
  it("should return success when operation succeeds", async () => {
    // Arrange
    const mockWorkout: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [],
        },
      },
    };

    const operation = vi.fn().mockResolvedValue("success");
    const onRestore = vi.fn();

    // Act
    const result = await withErrorRecovery(operation, mockWorkout, onRestore);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBe("success");
    expect(result.recovered).toBe(false);
    expect(result.error).toBeUndefined();
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("should restore state and return error when operation fails", async () => {
    // Arrange
    const mockWorkout: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [],
        },
      },
    };

    const testError = new Error("Operation failed");
    const operation = vi.fn().mockRejectedValue(testError);
    const onRestore = vi.fn();

    // Act
    const result = await withErrorRecovery(operation, mockWorkout, onRestore);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(testError);
    expect(result.recovered).toBe(true);
    expect(result.data).toBeUndefined();
    expect(onRestore).toHaveBeenCalledWith(mockWorkout);
  });

  it("should not restore when no backup exists", async () => {
    // Arrange
    const testError = new Error("Operation failed");
    const operation = vi.fn().mockRejectedValue(testError);
    const onRestore = vi.fn();

    // Act
    const result = await withErrorRecovery(operation, null, onRestore);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(testError);
    expect(result.recovered).toBe(false);
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("should handle synchronous operations", async () => {
    // Arrange
    const mockWorkout: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [],
        },
      },
    };

    const operation = vi.fn().mockReturnValue("sync success");
    const onRestore = vi.fn();

    // Act
    const result = await withErrorRecovery(operation, mockWorkout, onRestore);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBe("sync success");
    expect(result.recovered).toBe(false);
  });

  it("should convert non-Error objects to Error", async () => {
    // Arrange
    const mockWorkout: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [],
        },
      },
    };

    const operation = vi.fn().mockRejectedValue("string error");
    const onRestore = vi.fn();

    // Act
    const result = await withErrorRecovery(operation, mockWorkout, onRestore);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("string error");
  });
});

describe("withErrorRecoverySync", () => {
  it("should return success when operation succeeds", () => {
    // Arrange
    const mockWorkout: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [],
        },
      },
    };

    const operation = vi.fn().mockReturnValue("success");
    const onRestore = vi.fn();

    // Act
    const result = withErrorRecoverySync(operation, mockWorkout, onRestore);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBe("success");
    expect(result.recovered).toBe(false);
    expect(result.error).toBeUndefined();
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("should restore state and return error when operation fails", () => {
    // Arrange
    const mockWorkout: KRD = {
      version: "1.0",
      type: "workout",
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          steps: [],
        },
      },
    };

    const testError = new Error("Operation failed");
    const operation = vi.fn().mockImplementation(() => {
      throw testError;
    });
    const onRestore = vi.fn();

    // Act
    const result = withErrorRecoverySync(operation, mockWorkout, onRestore);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(testError);
    expect(result.recovered).toBe(true);
    expect(result.data).toBeUndefined();
    expect(onRestore).toHaveBeenCalledWith(mockWorkout);
  });

  it("should not restore when no backup exists", () => {
    // Arrange
    const testError = new Error("Operation failed");
    const operation = vi.fn().mockImplementation(() => {
      throw testError;
    });
    const onRestore = vi.fn();

    // Act
    const result = withErrorRecoverySync(operation, null, onRestore);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(testError);
    expect(result.recovered).toBe(false);
    expect(onRestore).not.toHaveBeenCalled();
  });
});
