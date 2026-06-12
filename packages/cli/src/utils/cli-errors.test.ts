import { describe, expect, it } from "vitest";

import {
  DirectoryCreateError,
  EnvironmentError,
  UnsupportedFormatError,
} from "./cli-errors";

describe("cli typed errors", () => {
  it("should give UnsupportedFormatError a stable name and cause", () => {
    // Arrange
    const cause = new Error("root");

    // Act
    const error = new UnsupportedFormatError("nope", cause);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("UnsupportedFormatError");
    expect(error.cause).toBe(cause);
  });

  it("should give DirectoryCreateError a stable name", () => {
    // Arrange

    // Act
    const error = new DirectoryCreateError("cannot create");

    // Assert
    expect(error).toBeInstanceOf(DirectoryCreateError);
    expect(error.name).toBe("DirectoryCreateError");
  });

  it("should give EnvironmentError a stable name", () => {
    // Arrange

    // Act
    const error = new EnvironmentError("reinstall");

    // Assert
    expect(error).toBeInstanceOf(EnvironmentError);
    expect(error.name).toBe("EnvironmentError");
  });
});
