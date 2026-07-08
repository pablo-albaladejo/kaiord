import { describe, expect, it } from "vitest";

import { definePrompt, PromptError, resolvePrompt } from "./registry";

describe("resolvePrompt", () => {
  it("should substitute declared variables", () => {
    // Arrange
    definePrompt({
      id: "test/greet",
      version: "1.0.0",
      template: "Hello {{name}}!",
      variables: ["name"],
    });

    // Act
    const result = resolvePrompt("test/greet", { vars: { name: "Ada" } });

    // Assert
    expect(result).toBe("Hello Ada!");
  });

  it("should throw for an unregistered prompt id", () => {
    // Arrange

    // Act
    const act = () => resolvePrompt("test/missing");

    // Assert
    expect(act).toThrow(PromptError);
  });

  it("should throw when a declared variable is not provided", () => {
    // Arrange
    definePrompt({
      id: "test/needs-var",
      version: "1.0.0",
      template: "Sport: {{sport}}",
      variables: ["sport"],
    });

    // Act
    const act = () => resolvePrompt("test/needs-var", { vars: {} });

    // Assert
    expect(act).toThrow(/sport/);
  });
});
