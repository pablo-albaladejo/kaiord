import type { Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExitCode } from "../../utils/exit-codes";

vi.mock("./client-factory", () => ({
  createCliGarminClient: vi.fn(),
}));

import { createCliGarminClient } from "./client-factory";
import { logoutCommand } from "./logout";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("logoutCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return SUCCESS after logout", async () => {
    // Arrange
    const logger = createMockLogger();
    const mockAuth = { logout: vi.fn() };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);

    // Act
    const result = await logoutCommand(logger);

    // Assert
    expect(result).toBe(ExitCode.SUCCESS);
    expect(mockAuth.logout).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("Logged out from Garmin Connect");
  });

  it("should output JSON when --json flag is set", async () => {
    // Arrange
    const logger = createMockLogger();
    const mockAuth = { logout: vi.fn() };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await logoutCommand(logger, true);
    expect(result).toBe(ExitCode.SUCCESS);
    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify({ success: true }));

    // Act
    consoleSpy.mockRestore();

    // Assert
  });

  it("should return AUTH_ERROR on ServiceAuthError", async () => {
    // Arrange
    const logger = createMockLogger();
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: {
        logout: vi.fn().mockRejectedValue(new ServiceAuthError("expired")),
      },
      service: {} as never,
    } as never);

    // Act
    const result = await logoutCommand(logger);

    // Assert
    expect(result).toBe(ExitCode.AUTH_ERROR);
    expect(logger.error).toHaveBeenCalledWith("Logout failed", {
      error: "expired",
    });
  });

  it("should rethrow unknown errors", async () => {
    // Arrange
    const logger = createMockLogger();

    // Act
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: { logout: vi.fn().mockRejectedValue(new Error("network")) },
      service: {} as never,
    } as never);

    // Assert
    await expect(logoutCommand(logger)).rejects.toThrow("network");
  });
});
