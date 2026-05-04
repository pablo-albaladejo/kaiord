import { describe, it, expect } from "vitest";
import { loadPrompt } from "./load-prompt";

describe("loadPrompt", () => {
  it("should return raw string when no variables provided", () => {
    // Arrange

    // Act

    // Assert
    expect(loadPrompt("Hello world")).toBe("Hello world");
  });

  it("should return raw string when vars is undefined", () => {
    // Arrange

    // Act

    // Assert
    expect(loadPrompt("Hello", undefined)).toBe("Hello");
  });

  it("should replace single variable", () => {
    // Arrange

    // Act

    // Assert
    expect(loadPrompt("Sport: {{sport}}", { sport: "running" })).toBe(
      "Sport: running"
    );
  });

  it("should replace multiple variables", () => {
    // Arrange

    // Act
    const result = loadPrompt("{{a}} and {{b}}", { a: "X", b: "Y" });

    // Assert
    expect(result).toBe("X and Y");
  });

  it("should replace all occurrences of the same variable", () => {
    // Arrange

    // Act
    const result = loadPrompt("{{x}} + {{x}}", { x: "1" });

    // Assert
    expect(result).toBe("1 + 1");
  });

  it("should leave unreferenced placeholders unchanged", () => {
    // Arrange

    // Act

    // Assert
    expect(loadPrompt("{{missing}}", {})).toBe("{{missing}}");
  });
});
