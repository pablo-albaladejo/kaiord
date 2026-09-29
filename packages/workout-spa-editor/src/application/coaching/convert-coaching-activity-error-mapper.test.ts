import { describe, expect, it } from "vitest";

import { classifyAiFailure } from "./convert-coaching-activity-error-mapper";

describe("classifyAiFailure", () => {
  it("should classify a retired-model 404 as model-unavailable", () => {
    // Arrange
    const error = Object.assign(new Error("Not Found"), {
      statusCode: 404,
      responseBody:
        '{"type":"error","error":{"type":"not_found_error","message":"model: claude-3-haiku-20240307"}}',
    });

    // Act
    const reason = classifyAiFailure(error);

    // Assert
    expect(reason).toBe("ai-model-unavailable");
  });

  it("should keep an unrelated provider failure as a generic ai-error", () => {
    // Arrange
    const error = Object.assign(new Error("Internal Server Error"), {
      statusCode: 500,
    });

    // Act
    const reason = classifyAiFailure(error);

    // Assert
    expect(reason).toBe("ai-error");
  });
});
