import { describe, expect, it } from "vitest";

import { strayTools } from "./stray-tools";

describe("strayTools", () => {
  it("should allow one StructuredOutput for a call that asked for a schema", () => {
    // Arrange
    const tools = ["StructuredOutput"];

    // Act
    const stray = strayTools(tools, { structuredOutput: true });

    // Assert
    expect(stray).toStrictEqual([]);
  });

  it("should name StructuredOutput when the call asked for no schema", () => {
    // Arrange
    const tools = ["StructuredOutput"];

    // Act
    const stray = strayTools(tools, { structuredOutput: false });

    // Assert
    expect(stray).toStrictEqual(["StructuredOutput"]);
  });

  it("should name every other tool and a second StructuredOutput", () => {
    // Arrange
    const tools = ["StructuredOutput", "Bash", "StructuredOutput"];

    // Act
    const stray = strayTools(tools, { structuredOutput: true });

    // Assert
    expect(stray).toStrictEqual(["Bash", "StructuredOutput"]);
  });

  it("should not print a tool entry that is not a plain name", () => {
    // Arrange
    const tools = [{ name: "Bash" }, "rm -rf /"];

    // Act
    const stray = strayTools(tools, { structuredOutput: true });

    // Assert
    expect(stray).toStrictEqual([
      "<unrecognized tool entry>",
      "<unrecognized tool entry>",
    ]);
  });
});
