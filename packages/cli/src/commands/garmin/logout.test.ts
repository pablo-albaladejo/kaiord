import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";

vi.mock("./client-factory", () => ({
  createCliGarminClient: vi.fn(),
}));

import { logoutCommand } from "./logout";
import { createCliGarminClient } from "./client-factory";

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
    const logger = createMockLogger();
    const mockAuth = { logout: vi.fn() };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);

    const result = await logoutCommand(logger);

    expect(result).toBe(ExitCode.SUCCESS);
    expect(mockAuth.logout).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("Logged out from Garmin Connect");
  });

  it("should output JSON when --json flag is set", async () => {
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
    consoleSpy.mockRestore();
  });

  it("should return AUTH_ERROR on ServiceAuthError", async () => {
    const logger = createMockLogger();
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: {
        logout: vi.fn().mockRejectedValue(new ServiceAuthError("expired")),
      },
      service: {} as never,
    } as never);

    const result = await logoutCommand(logger);

    expect(result).toBe(ExitCode.AUTH_ERROR);
    expect(logger.error).toHaveBeenCalledWith("Logout failed", {
      error: "expired",
    });
  });

  it("should rethrow unknown errors", async () => {
    const logger = createMockLogger();
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: { logout: vi.fn().mockRejectedValue(new Error("network")) },
      service: {} as never,
    } as never);

    await expect(logoutCommand(logger)).rejects.toThrow("network");
  });
});
