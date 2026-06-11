import type { KRD, Logger } from "@kaiord/core";
import { ServiceAuthError } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExitCode } from "../../utils/exit-codes";

vi.mock("./client-factory", () => ({
  createCliGarminClient: vi.fn(),
}));

vi.mock("../../utils/krd-converter", () => ({
  loadFileAsKrd: vi.fn(),
}));

import { loadFileAsKrd } from "../../utils/krd-converter";
import { createCliGarminClient } from "./client-factory";
import { pushCommand } from "./push";

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
    // Arrange
    const logger = createMockLogger();
    const mockService = { push: vi.fn().mockResolvedValue(mockPushResult) };
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(true) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: mockService,
    } as never);
    vi.mocked(loadFileAsKrd).mockResolvedValue(mockKrd);

    // Act
    const result = await pushCommand({ input: "workout.krd" }, logger);

    // Assert
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
    // Arrange
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

    // Act
    consoleSpy.mockRestore();

    // Assert
  });

  it("should return AUTH_ERROR when not authenticated", async () => {
    // Arrange
    const logger = createMockLogger();
    const mockAuth = { is_authenticated: vi.fn().mockReturnValue(false) };
    vi.mocked(createCliGarminClient).mockResolvedValue({
      auth: mockAuth,
      service: {} as never,
    } as never);

    // Act
    const result = await pushCommand({ input: "workout.krd" }, logger);

    // Assert
    expect(result).toBe(ExitCode.AUTH_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      "Not authenticated. Run: kaiord garmin login"
    );
  });

  it("should return AUTH_ERROR on ServiceAuthError", async () => {
    // Arrange
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

    // Act
    const result = await pushCommand({ input: "workout.krd" }, logger);

    // Assert
    expect(result).toBe(ExitCode.AUTH_ERROR);
  });
});
