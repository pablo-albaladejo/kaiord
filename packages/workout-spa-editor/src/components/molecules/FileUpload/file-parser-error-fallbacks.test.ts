import { describe, expect, it } from "vitest";

import {
  createFileParsingErrorState,
  createGenericErrorState,
  createSyntaxErrorState,
  createUnrecoverableErrorState,
} from "./file-parser-error-fallbacks";

describe("createFileParsingErrorState", () => {
  it.each([
    {
      label: "plain-message-no-position",
      error: { message: "bad" },
      expected: {
        title: "Invalid File Format",
        message: "Failed to parse JSON: bad",
      },
    },
    {
      label: "position-only",
      error: { message: "oops at position 42" },
      expected: {
        title: "Invalid File Format",
        message: "Failed to parse JSON at position 42",
      },
    },
    {
      label: "line-and-position",
      error: { message: "oops at position 42", line: 7 },
      expected: {
        title: "Invalid File Format",
        message: "Failed to parse JSON at position 42 (line 7)",
      },
    },
    {
      label: "line-column-and-position",
      error: { message: "oops at position 42", line: 7, column: 3 },
      expected: {
        title: "Invalid File Format",
        message: "Failed to parse JSON at position 42 (line 7, column 3)",
      },
    },
    {
      label: "line-column-no-position",
      error: { message: "oops", line: 7, column: 3 },
      expected: {
        title: "Invalid File Format",
        message: "Failed to parse JSON (line 7, column 3)",
      },
    },
    {
      label: "line-only-no-position",
      error: { message: "oops", line: 7 },
      expected: {
        title: "Invalid File Format",
        message: "Failed to parse JSON (line 7)",
      },
    },
  ])("should build $label error state", ({ error, expected }) => {
    // Arrange

    // Act
    const result = createFileParsingErrorState(error);

    // Assert
    expect(result).toEqual(expected);
  });
});

describe("createSyntaxErrorState", () => {
  it.each([
    {
      label: "with-position-suffix",
      error: new SyntaxError("Unexpected token at position 5"),
      expected: {
        title: "Invalid File Format",
        message:
          "Failed to parse JSON: Unexpected token at position 5. Please check your file and try again.",
      },
    },
    {
      label: "without-position",
      error: new SyntaxError("plain error"),
      expected: {
        title: "Invalid File Format",
        message: "Failed to parse JSON: plain error",
      },
    },
  ])("should build $label syntax error state", ({ error, expected }) => {
    // Arrange

    // Act
    const result = createSyntaxErrorState(error);

    // Assert
    expect(result).toEqual(expected);
  });
});

describe("createUnrecoverableErrorState", () => {
  it.each([
    {
      label: "not-a-fit-file",
      error: new Error("not a FIT file"),
      expected: {
        title: "Import Failed",
        message: "not a FIT file. Please check your file and try again.",
      },
    },
  ])("should build $label unrecoverable error state", ({ error, expected }) => {
    // Arrange

    // Act
    const result = createUnrecoverableErrorState(error);

    // Assert
    expect(result).toEqual(expected);
  });
});

describe("createGenericErrorState", () => {
  it.each([
    {
      label: "real-error",
      error: new Error("disk full"),
      expected: {
        title: "File Read Error",
        message:
          "Failed to read file: disk full. Please check your file and try again.",
      },
    },
    {
      label: "plain-string",
      error: "string error" as unknown,
      expected: {
        title: "File Read Error",
        message:
          "Failed to read file: Unknown error. Please check your file and try again.",
      },
    },
    {
      label: "null",
      error: null as unknown,
      expected: {
        title: "File Read Error",
        message:
          "Failed to read file: Unknown error. Please check your file and try again.",
      },
    },
    {
      label: "plain-object",
      error: { custom: "object" } as unknown,
      expected: {
        title: "File Read Error",
        message:
          "Failed to read file: Unknown error. Please check your file and try again.",
      },
    },
  ])("should build $label generic error state", ({ error, expected }) => {
    // Arrange

    // Act
    const result = createGenericErrorState(error);

    // Assert
    expect(result).toEqual(expected);
  });
});
