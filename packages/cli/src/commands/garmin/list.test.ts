import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";

vi.mock("./client-factory", () => ({
  createCliGarminClient: vi.fn(),
}));

import { listCommand } from "./list";
import { createCliGarminClient } from "./client-factory";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const mockWorkouts = [
  {
    id: "1",
    name: "Morning Run",
    sport: "running",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

describe("listCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list workouts as table by default", async () => {
    const logger = createMockLogger();
    const mockService = { list: vi.fn().mockResolvedValue(mockWorkouts) };
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(true) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: mockService,
    } as never);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await listCommand({}, logger);

    expect(result).toBe(ExitCode.SUCCESS);
    expect(mockService.list).toHaveBeenCalledWith({ limit: 20, offset: 0 });
    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(output).toContain("Morning Run");
    consoleSpy.mockRestore();
  });

  it("should output JSON when --json flag is set", async () => {
    const logger = createMockLogger();
    const mockService = { list: vi.fn().mockResolvedValue(mockWorkouts) };
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(true) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: mockService,
    } as never);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await listCommand({ json: true }, logger);

    expect(result).toBe(ExitCode.SUCCESS);
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify(mockWorkouts, null, 2)
    );
    consoleSpy.mockRestore();
  });

  it("should return AUTH_ERROR when not authenticated", async () => {
    const logger = createMockLogger();
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(false) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);

    const result = await listCommand({}, logger);

    expect(result).toBe(ExitCode.AUTH_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      "Not authenticated. Run: kaiord garmin login"
    );
  });

  it("should return AUTH_ERROR on ServiceAuthError", async () => {
    const logger = createMockLogger();
    const mockService = {
      list: vi.fn().mockRejectedValue(new ServiceAuthError("Expired")),
    };
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(true) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: mockService,
    } as never);

    const result = await listCommand({}, logger);

    expect(result).toBe(ExitCode.AUTH_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      "Authentication expired. Run: kaiord garmin login"
    );
  });
});
