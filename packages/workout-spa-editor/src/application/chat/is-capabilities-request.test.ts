import { describe, expect, it } from "vitest";

import { isCapabilitiesRequest } from "./is-capabilities-request";

describe("isCapabilitiesRequest", () => {
  it.each([
    "¿Qué puedo hacer?",
    "  que puedes HACER ",
    "/ayuda",
    "/Help",
    "Help!",
    "What can you do?",
  ])("should recognise %j in an empty conversation", (text) => {
    // Arrange
    const context = { started: false };

    // Act
    const result = isCapabilitiesRequest(text, context);

    // Assert
    expect(result).toBe(true);
  });

  it.each(["/ayuda", "/help", "¿Qué sabes hacer?", "what can you do…"])(
    "should still recognise %j mid-conversation",
    (text) => {
      // Arrange
      const context = { started: true };

      // Act
      const result = isCapabilitiesRequest(text, context);

      // Assert
      expect(result).toBe(true);
    }
  );

  it.each(["¿Qué puedo hacer?", "ayuda", "help", "What can I do?"])(
    "should send %j to the model mid-conversation, where it follows up",
    (text) => {
      // Arrange
      const context = { started: true };

      // Act
      const result = isCapabilitiesRequest(text, context);

      // Assert
      expect(result).toBe(false);
    }
  );

  it.each(["¿Qué puedo hacer mañana en el entreno?", "help me plan a run", ""])(
    "should leave %j for the model",
    (text) => {
      // Arrange
      const context = { started: false };

      // Act
      const result = isCapabilitiesRequest(text, context);

      // Assert
      expect(result).toBe(false);
    }
  );
});
