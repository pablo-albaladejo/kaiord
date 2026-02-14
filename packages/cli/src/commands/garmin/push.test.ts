import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Logger, KRD } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { ExitCode } from "../../utils/exit-codes";

vi.mock("./client-factory", () => ({
  createCliGarminClient: vi.fn(),
}));

vi.mock("../../utils/krd-converter", () => ({
  loadFileAsKrd: vi.fn(),
}));

import { pushCommand } from "./push";
import { createCliGarminClient } from "./client-factory";
import { loadFileAsKrd } from "../../utils/krd-converter";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const mockKrd = { version: "1.0" } as unknown as KRD;
const mockPushResult = {
  id: "123",
  name: "Test Workout",
  url: "https://connect.garmin.com/modern/workout/123",
};

describe("pushCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should push workout and return SUCCESS", async () => {
    const logger = createMockLogger();
    const mockService = { push: vi.fn().mockResolvedValue(mockPushResult) };
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(true) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: mockService,
    } as never);
    vi.mocked(loadFileAsKrd).mockResolvedValue(mockKrd);

    const result = await pushCommand({ input: "workout.krd" }, logger);

    expect(result).toBe(ExitCode.SUCCESS);
    expect(loadFileAsKrd).toHaveBeenCalledWith(
      "workout.krd",
      undefined,
      logger
    );
    expect(mockService.push).toHaveBeenCalledWith(mockKrd);
    expect(logger.info).toHaveBeenCalledWith(
      "Workout pushed to Garmin Connect",
      {
        id: "123",
        name: "Test Workout",
        url: "https://connect.garmin.com/modern/workout/123",
      }
    );
  });

  it("should output JSON when --json flag is set", async () => {
    const logger = createMockLogger();
    const mockService = { push: vi.fn().mockResolvedValue(mockPushResult) };
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(true) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: mockService,
    } as never);
    vi.mocked(loadFileAsKrd).mockResolvedValue(mockKrd);
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await pushCommand(
      { input: "workout.krd", json: true },
      logger
    );

    expect(result).toBe(ExitCode.SUCCESS);
    expect(consoleSpy).toHaveBeenCalledWith(
      JSON.stringify(mockPushResult, null, 2)
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

    const result = await pushCommand({ input: "workout.krd" }, logger);

    expect(result).toBe(ExitCode.AUTH_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      "Not authenticated. Run: kaiord garmin login"
    );
  });

  it("should return AUTH_ERROR on ServiceAuthError", async () => {
    const logger = createMockLogger();
    const mockService = {
      push: vi.fn().mockRejectedValue(new ServiceAuthError("Expired")),
    };
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(true) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: mockService,
    } as never);
    vi.mocked(loadFileAsKrd).mockResolvedValue(mockKrd);

    const result = await pushCommand({ input: "workout.krd" }, logger);

    expect(result).toBe(ExitCode.AUTH_ERROR);
  });
});
