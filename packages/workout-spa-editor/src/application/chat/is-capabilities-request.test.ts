import { describe, expect, it } from "vitest";

import { isCapabilitiesRequest } from "./is-capabilities-request";

describe("isCapabilitiesRequest", () => {
  it.each([
    "¿Qué puedo hacer?",
    "  que puedes HACER ",
    "/ayuda",
    "/help",
    "What can you do?",
  ])("should recognise %j as a capabilities request", (text) => {
    // Arrange
    const message = text;

    // Act
    const result = isCapabilitiesRequest(message);

    // Assert
    expect(result).toBe(true);
  });

  it.each(["¿Qué puedo hacer mañana en el entreno?", "help me plan a run", ""])(
    "should leave %j for the model",
    (text) => {
      // Arrange
      const message = text;

      // Act
      const result = isCapabilitiesRequest(message);

      // Assert
      expect(result).toBe(false);
    }
  );
});
