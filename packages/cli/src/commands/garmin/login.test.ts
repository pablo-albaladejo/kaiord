import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";

vi.mock("./client-factory", () => ({
  createCliGarminClient: vi.fn(),
}));

import { loginCommand } from "./login";
import { createCliGarminClient } from "./client-factory";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("loginCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return SUCCESS on successful login", async () => {
    const logger = createMockLogger();
    const mockAuth = { login: vi.fn() };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);

    const result = await loginCommand(
      { email: "user@test.com", password: "pass123" },
      logger
    );

    expect(result).toBe(ExitCode.SUCCESS);
    expect(mockAuth.login).toHaveBeenCalledWith("user@test.com", "pass123");
    expect(logger.info).toHaveBeenCalledWith("Logged in to Garmin Connect");
  });

  it("should return AUTH_ERROR on ServiceAuthError", async () => {
    const logger = createMockLogger();
    const mockAuth = {
      login: vi.fn().mockRejectedValue(new ServiceAuthError("Invalid creds")),
    };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);

    const result = await loginCommand(
      { email: "user@test.com", password: "wrong" },
      logger
    );

    expect(result).toBe(ExitCode.AUTH_ERROR);
    expect(logger.error).toHaveBeenCalledWith("Login failed", {
      error: "Invalid creds",
    });
  });

  it("should output JSON on success when --json flag is set", async () => {
    const logger = createMockLogger();
    const mockAuth = { login: vi.fn() };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await loginCommand(
      { email: "user@test.com", password: "pass123", json: true },
      logger
    );

    expect(result).toBe(ExitCode.SUCCESS);
    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify({ success: true }));
    consoleSpy.mockRestore();
  });

  it("should rethrow non-auth errors", async () => {
    const logger = createMockLogger();
    const mockAuth = {
      login: vi.fn().mockRejectedValue(new Error("Network error")),
    };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);

    await expect(
      loginCommand({ email: "user@test.com", password: "pass" }, logger)
    ).rejects.toThrow("Network error");
  });
});
