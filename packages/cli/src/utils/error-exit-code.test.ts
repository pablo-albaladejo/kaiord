import {
  createFitParsingError,
  createGarminParsingError,
  createKrdValidationError,
  createServiceApiError,
  createServiceAuthError,
  ToleranceExceededError,
} from "@kaiord/core";
import { describe, expect, it } from "vitest";

import {
  DirectoryCreateError,
  EnvironmentError,
  UnsupportedFormatError,
} from "./cli-errors";
import { getExitCodeForError, mapErrorToExitCode } from "./error-exit-code";
import { ExitCode } from "./exit-codes";

const HTTP_SERVICE_UNAVAILABLE = 503;

const fileNotFoundError = (path: string): Error =>
  Object.assign(new Error(`File not found: ${path}`), {
    code: "ENOENT",
  });

const moduleNotFoundError = (): Error =>
  Object.assign(new Error("Cannot find module 'xsd-schema-validator'"), {
    code: "MODULE_NOT_FOUND",
  });

describe("mapErrorToExitCode", () => {
  it("should map FitParsingError to PARSING_ERROR", () => {
    // Arrange
    const error = createFitParsingError("bad fit");

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.PARSING_ERROR);
  });

  it("should map GarminParsingError to PARSING_ERROR", () => {
    // Arrange
    const error = createGarminParsingError("bad gcn");

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.PARSING_ERROR);
  });

  it("should map KrdValidationError to VALIDATION_ERROR", () => {
    // Arrange
    const error = createKrdValidationError("invalid", []);

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it("should map ToleranceExceededError to TOLERANCE_EXCEEDED", () => {
    // Arrange
    const error = new ToleranceExceededError("too far", []);

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.TOLERANCE_EXCEEDED);
  });

  it("should map ServiceAuthError to AUTH_ERROR", () => {
    // Arrange
    const error = createServiceAuthError("expired");

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.AUTH_ERROR);
  });

  it("should map UnsupportedFormatError to INVALID_ARGUMENT", () => {
    // Arrange
    const error = new UnsupportedFormatError("nope");

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.INVALID_ARGUMENT);
  });

  it("should map DirectoryCreateError to DIRECTORY_CREATE_ERROR", () => {
    // Arrange
    const error = new DirectoryCreateError("cannot create");

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.DIRECTORY_CREATE_ERROR);
  });

  it("should map EnvironmentError to ENVIRONMENT_ERROR", () => {
    // Arrange
    const error = new EnvironmentError("reinstall");

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.ENVIRONMENT_ERROR);
  });

  it("should map a raw MODULE_NOT_FOUND error to ENVIRONMENT_ERROR", () => {
    // Arrange
    const error = moduleNotFoundError();

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.ENVIRONMENT_ERROR);
  });

  it("should map a node_modules ENOENT asset error to ENVIRONMENT_ERROR", () => {
    // Arrange
    const error = Object.assign(new Error("missing schema"), {
      code: "ENOENT",
      path: "/app/node_modules/@kaiord/zwo/schema/zwift-workout.xsd",
    });

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.ENVIRONMENT_ERROR);
  });

  it("should map ServiceApiError to SERVICE_ERROR", () => {
    // Arrange
    const error = createServiceApiError("Garmin 503", HTTP_SERVICE_UNAVAILABLE);

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.SERVICE_ERROR);
  });

  it("should map a network ECONNREFUSED error to SERVICE_ERROR", () => {
    // Arrange
    const error = Object.assign(new Error("connect ECONNREFUSED"), {
      code: "ECONNREFUSED",
    });

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.SERVICE_ERROR);
  });

  it("should map an input-file ENOENT error to FILE_NOT_FOUND", () => {
    // Arrange
    const error = fileNotFoundError("/tmp/missing.fit");

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.FILE_NOT_FOUND);
  });

  it("should map an unknown error to UNKNOWN_ERROR", () => {
    // Arrange
    const error = new Error("something unexpected");

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.UNKNOWN_ERROR);
  });

  it("should map a non-error value to UNKNOWN_ERROR", () => {
    // Arrange
    const error = "not an error";

    // Act
    const code = mapErrorToExitCode(error);

    // Assert
    expect(code).toBe(ExitCode.UNKNOWN_ERROR);
  });

  it("should classify the same file-not-found failure as one code", () => {
    // Arrange
    const fromConvert = fileNotFoundError("/in/a.fit");
    const fromValidate = fileNotFoundError("/in/b.fit");
    const fromInspect = fileNotFoundError("/in/c.fit");

    // Act
    const codes = [fromConvert, fromValidate, fromInspect].map(
      mapErrorToExitCode
    );

    // Assert
    expect(new Set(codes).size).toBe(1);
    expect(codes[0]).toBe(ExitCode.FILE_NOT_FOUND);
  });

  it("should keep the exit code when an error message is reworded", () => {
    // Arrange
    const original = new UnsupportedFormatError("Format not supported");
    const reworded = new UnsupportedFormatError(
      "We do not support that format yet"
    );

    // Act
    const originalCode = mapErrorToExitCode(original);
    const rewordedCode = mapErrorToExitCode(reworded);

    // Assert
    expect(rewordedCode).toBe(originalCode);
    expect(rewordedCode).toBe(ExitCode.INVALID_ARGUMENT);
  });

  it("should expose getExitCodeForError as an alias of the mapper", () => {
    // Arrange
    const error = createServiceApiError("Garmin 503", HTTP_SERVICE_UNAVAILABLE);

    // Act
    const code = getExitCodeForError(error);

    // Assert
    expect(code).toBe(mapErrorToExitCode(error));
  });
});
