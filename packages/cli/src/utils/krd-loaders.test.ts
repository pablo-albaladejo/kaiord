import type { Logger } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EnvironmentError } from "./cli-errors";
import { mapErrorToExitCode } from "./error-exit-code";
import { ExitCode } from "./exit-codes";

const readerError = { current: new Error("unset") };

vi.mock("@kaiord/zwo", () => ({
  createZwiftReader: () => () => {
    throw readerError.current;
  },
}));

import { zwoToKrd } from "./krd-loaders";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const moduleNotFound = (): Error =>
  Object.assign(new Error("Cannot find module 'xsd-schema-validator'"), {
    code: "MODULE_NOT_FOUND",
  });

const missingSchemaAsset = (): Error =>
  Object.assign(new Error("missing schema asset"), {
    code: "ENOENT",
    path: "/app/node_modules/@kaiord/zwo/schema/zwift-workout.xsd",
  });

describe("zwo loaders environment guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should wrap a missing dependency as EnvironmentError with a reinstall hint", async () => {
    // Arrange
    readerError.current = moduleNotFound();
    const logger = createMockLogger();

    // Act
    const thrown = await zwoToKrd("<workout/>", logger).catch(
      (e: unknown) => e
    );

    // Assert
    expect(thrown).toBeInstanceOf(EnvironmentError);
    expect((thrown as EnvironmentError).message).toContain("Reinstall");
    expect(mapErrorToExitCode(thrown)).toBe(ExitCode.ENVIRONMENT_ERROR);
  });

  it("should wrap a missing bundled schema asset as EnvironmentError", async () => {
    // Arrange
    readerError.current = missingSchemaAsset();
    const logger = createMockLogger();

    // Act
    const thrown = await zwoToKrd("<workout/>", logger).catch(
      (e: unknown) => e
    );

    // Assert
    expect(thrown).toBeInstanceOf(EnvironmentError);
    expect(mapErrorToExitCode(thrown)).toBe(ExitCode.ENVIRONMENT_ERROR);
  });

  it("should not wrap an unrelated reader failure", async () => {
    // Arrange
    readerError.current = new Error("malformed zwo");
    const logger = createMockLogger();

    // Act
    const thrown = await zwoToKrd("<workout/>", logger).catch(
      (e: unknown) => e
    );

    // Assert
    expect(thrown).not.toBeInstanceOf(EnvironmentError);
    expect((thrown as Error).message).toBe("malformed zwo");
  });
});
