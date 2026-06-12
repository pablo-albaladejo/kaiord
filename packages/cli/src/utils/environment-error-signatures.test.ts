import { describe, expect, it } from "vitest";

import { isEnvironmentDependencyError } from "./environment-error-signatures";

describe("isEnvironmentDependencyError", () => {
  it("should recognize a MODULE_NOT_FOUND error", () => {
    // Arrange
    const error = Object.assign(new Error("Cannot find module 'x'"), {
      code: "MODULE_NOT_FOUND",
    });

    // Act
    const result = isEnvironmentDependencyError(error);

    // Assert
    expect(result).toBe(true);
  });

  it("should recognize an ENOENT on a node_modules asset path", () => {
    // Arrange
    const error = Object.assign(new Error("missing"), {
      code: "ENOENT",
      path: "/app/node_modules/@kaiord/zwo/schema/zwift-workout.xsd",
    });

    // Act
    const result = isEnvironmentDependencyError(error);

    // Assert
    expect(result).toBe(true);
  });

  it("should not flag an ENOENT on a user input path", () => {
    // Arrange
    const error = Object.assign(new Error("missing"), {
      code: "ENOENT",
      path: "/home/user/workout.fit",
    });

    // Act
    const result = isEnvironmentDependencyError(error);

    // Assert
    expect(result).toBe(false);
  });

  it("should not flag an ENOENT without a path", () => {
    // Arrange
    const error = Object.assign(new Error("missing"), { code: "ENOENT" });

    // Act
    const result = isEnvironmentDependencyError(error);

    // Assert
    expect(result).toBe(false);
  });

  it("should not flag an unrelated error", () => {
    // Arrange
    const error = new Error("boom");

    // Act
    const result = isEnvironmentDependencyError(error);

    // Assert
    expect(result).toBe(false);
  });

  it("should not flag a non-object value", () => {
    // Arrange
    const error = "not an error";

    // Act
    const result = isEnvironmentDependencyError(error);

    // Assert
    expect(result).toBe(false);
  });
});
